// Supabase Edge Function: verify-payment
//
// Deploy with: supabase functions deploy verify-payment
// Requires one secret set on your Supabase project (never in client code):
//   supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxxxxxxx
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY below are injected
// automatically by Supabase into every Edge Function — do not try to set
// them yourself via `supabase secrets set` (it will refuse, since names
// starting with SUPABASE_ are reserved).
//
// Why this needs to be a server-side function at all: the browser can
// call Paystack's popup, but it can never be trusted to say "yes, I
// really paid" — that flag has to come from Paystack's own servers. This
// function is the only thing allowed to flip a booking to "confirmed",
// and it only does so after asking Paystack directly.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!PAYSTACK_SECRET_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Server is missing required secrets.");
    }

    const { reference, booking_id } = await req.json();
    if (!reference || !booking_id) {
      throw new Error("reference and booking_id are required.");
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Load the booking as it actually exists in the database — never
    // trust an amount or coach_id passed in from the client.
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id, amount_kobo, status")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found.");
    }

    if (booking.status === "confirmed") {
      return json({ confirmed: true, already: true });
    }

    // Ask Paystack directly whether this transaction really succeeded.
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );
    const verifyJson = await verifyRes.json();

    const paystackData = verifyJson?.data;
    const isSuccessful = verifyJson?.status && paystackData?.status === "success";
    const amountMatches = paystackData?.amount === booking.amount_kobo;

    if (!isSuccessful || !amountMatches) {
      return json({ confirmed: false, reason: "Payment could not be verified." });
    }

    const { error: updateError } = await admin
      .from("bookings")
      .update({ status: "confirmed", payment_reference: reference })
      .eq("id", booking_id);

    if (updateError) throw updateError;

    return json({ confirmed: true });
  } catch (err) {
    return json(
      { confirmed: false, reason: err instanceof Error ? err.message : "Unknown error" },
      500
    );
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
