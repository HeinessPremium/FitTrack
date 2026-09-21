// Thin wrapper around Paystack's inline checkout script. Loaded lazily so
// it never blocks the initial page render, and only ever runs client-side.

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: PaystackSetupOptions) => { openIframe: () => void };
    };
  }
}

interface PaystackSetupOptions {
  key: string;
  email: string;
  amount: number; // kobo
  ref: string;
  metadata?: Record<string, unknown>;
  onClose?: () => void;
  callback?: (response: { reference: string }) => void;
}

let scriptPromise: Promise<void> | null = null;

function loadPaystackScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paystack script"));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export interface PayWithPaystackInput {
  email: string;
  amountKobo: number;
  reference: string;
  metadata?: Record<string, unknown>;
  onSuccess: (reference: string) => void;
  onClose?: () => void;
}

export async function payWithPaystack({
  email,
  amountKobo,
  reference,
  metadata,
  onSuccess,
  onClose,
}: PayWithPaystackInput) {
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as
    | string
    | undefined;

  if (!publicKey) {
    throw new Error(
      "Missing VITE_PAYSTACK_PUBLIC_KEY. Add it to .env.local (see .env.example)."
    );
  }

  await loadPaystackScript();

  if (!window.PaystackPop) {
    throw new Error("Paystack script did not load correctly.");
  }

  const handler = window.PaystackPop.setup({
    key: publicKey,
    email,
    amount: amountKobo,
    ref: reference,
    metadata,
    callback: (response) => onSuccess(response.reference),
    onClose,
  });

  handler.openIframe();
}
