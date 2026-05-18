export type PayeePaymentInfo = {
  paymentUpi?: string;
  paymentPhone?: string;
};

export function normalizeUpiId(raw: string): string | null {
  const vpa = raw.trim().toLowerCase();
  if (!vpa) return null;
  if (!/^[a-z0-9.\-_]{2,256}@[a-z0-9.\-_]{2,64}$/i.test(vpa)) return null;
  return vpa;
}

export function normalizePaymentPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return null;
}

export function buildUpiPayUrl(input: {
  upiId: string;
  payeeName: string;
  amount: number;
  note: string;
}): string {
  const params = new URLSearchParams({
    pa: input.upiId,
    pn: input.payeeName.slice(0, 50),
    am: input.amount.toFixed(2),
    cu: "INR",
    tn: input.note.slice(0, 80),
  });
  return `upi://pay?${params.toString()}`;
}

export function phoneTelUrl(phone: string): string {
  return `tel:+91${phone}`;
}
