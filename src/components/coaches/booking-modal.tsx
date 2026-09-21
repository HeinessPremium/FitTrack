import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { payWithPaystack } from "@/lib/paystack";
import { AvailabilitySlot, CoachWithProfile } from "@/lib/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatNaira, cn } from "@/lib/utils";

type Stage = "pick" | "paying" | "verifying" | "confirmed" | "error";

export function BookingModal({
  coach,
  open,
  onClose,
}: {
  coach: CoachWithProfile | null;
  open: boolean;
  onClose: () => void;
}) {
  const { profile, user } = useAuth();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [stage, setStage] = useState<Stage>("pick");
  const [errorMessage, setErrorMessage] = useState("");
  const paymentSucceededRef = useRef(false);

  useEffect(() => {
    if (!open || !coach) return;
    setStage("pick");
    setSelectedSlot(null);
    (async () => {
      const { data } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("coach_id", coach.id)
        .eq("is_booked", false)
        .gt("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(20);
      setSlots((data as AvailabilitySlot[]) ?? []);
    })();
  }, [open, coach]);

  if (!coach) return null;

  async function handleBook() {
    if (!coach || !selectedSlot || !profile || !user?.email) return;

    // Atomically claim the slot + create a pending booking, so two people
    // can't both grab the same slot in a race.
    const { data: bookingId, error: rpcError } = await supabase.rpc(
      "book_slot",
      {
        p_slot_id: selectedSlot.id,
        p_amount_kobo: coach.hourly_rate_kobo,
      }
    );

    if (rpcError || !bookingId) {
      setErrorMessage(
        rpcError?.message ?? "That slot was just taken — pick another."
      );
      setStage("error");
      return;
    }

    setStage("paying");
    paymentSucceededRef.current = false;

    try {
      await payWithPaystack({
        email: user.email,
        amountKobo: coach.hourly_rate_kobo,
        reference: `fittrack_${bookingId}`,
        metadata: { booking_id: bookingId, coach_id: coach.id },
        onClose: () => {
          // Paystack calls this when the popup closes for any reason.
          // If onSuccess already fired, don't stomp its "verifying"/
          // "confirmed" state — otherwise the user cancelled, so reset.
          if (!paymentSucceededRef.current) setStage("pick");
        },
        onSuccess: async (reference) => {
          paymentSucceededRef.current = true;
          setStage("verifying");
          const { data, error } = await supabase.functions.invoke(
            "verify-payment",
            { body: { reference, booking_id: bookingId } }
          );
          if (error || !data?.confirmed) {
            setErrorMessage(
              "We couldn't confirm that payment yet. If you were charged, contact support with reference " +
                reference
            );
            setStage("error");
            return;
          }
          setStage("confirmed");
        },
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setStage("error");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Book ${coach.profile.full_name}`}>
      {stage === "confirmed" ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle2 size={40} className="text-brand" />
          <p className="text-[1rem] font-semibold text-ink">Session booked!</p>
          <p className="text-[0.87rem] text-ink/55">
            {selectedSlot &&
              format(new Date(selectedSlot.starts_at), "EEEE, MMM d 'at' h:mm a")}{" "}
            with {coach.profile.full_name}
          </p>
          <Button onClick={onClose} className="mt-2 w-full">
            Done
          </Button>
        </div>
      ) : stage === "error" ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-[0.9rem] text-red-600">{errorMessage}</p>
          <Button variant="outline" onClick={() => setStage("pick")}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <p className="mb-3 text-[0.85rem] text-ink/60">
            {coach.specialty} · {formatNaira(coach.hourly_rate_kobo)} / session
          </p>

          {slots.length === 0 ? (
            <p className="rounded-lg bg-tint px-3 py-3 text-[0.85rem] text-ink/50">
              No open slots right now — check back soon.
            </p>
          ) : (
            <div className="mb-5 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left text-[0.82rem] transition",
                    selectedSlot?.id === slot.id
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-border text-ink/70 hover:border-brand/30"
                  )}
                >
                  <div className="font-medium">
                    {format(new Date(slot.starts_at), "EEE, MMM d")}
                  </div>
                  <div className="text-[0.78rem] opacity-70">
                    {format(new Date(slot.starts_at), "h:mm a")}
                  </div>
                </button>
              ))}
            </div>
          )}

          <Button
            className="w-full"
            disabled={!selectedSlot || stage === "paying" || stage === "verifying"}
            onClick={handleBook}
          >
            {stage === "paying"
              ? "Opening Paystack…"
              : stage === "verifying"
              ? "Confirming payment…"
              : selectedSlot
              ? `Pay ${formatNaira(coach.hourly_rate_kobo)} with Paystack`
              : "Select a time"}
          </Button>
        </>
      )}
    </Modal>
  );
}
