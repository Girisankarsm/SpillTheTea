import { appBaseUrl } from "@/lib/mongodb/env";

type MailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function fromAddress(): string {
  return process.env.AUTH_EMAIL_FROM?.trim() || "SpillTheTea <onboarding@resend.dev>";
}

export async function sendAuthEmail(input: MailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn(`[auth-email] RESEND_API_KEY missing. ${input.subject} for ${input.to}`);
    console.warn(input.text);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Could not send auth email. ${detail || response.statusText}`);
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verifyUrl = `${appBaseUrl()}/api/auth/verify?token=${encodeURIComponent(token)}`;
  await sendAuthEmail({
    to: email,
    subject: "Verify your SpillTheTea account",
    text: `Verify your SpillTheTea account: ${verifyUrl}`,
    html: `
      <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5">
        <h1>Verify your SpillTheTea account</h1>
        <p>Click the button below to finish registration.</p>
        <p><a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:white;padding:12px 18px;border-radius:10px;text-decoration:none">Verify email</a></p>
        <p>If the button does not work, paste this link into your browser:</p>
        <p>${verifyUrl}</p>
      </div>
    `,
  });
}

export async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  const loginUrl = `${appBaseUrl()}/api/auth/magic/verify?token=${encodeURIComponent(token)}`;
  await sendAuthEmail({
    to: email,
    subject: "Your SpillTheTea sign-in link",
    text: `Sign in to SpillTheTea: ${loginUrl}`,
    html: `
      <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5">
        <h1>Sign in to SpillTheTea</h1>
        <p>This one-time link signs you in.</p>
        <p><a href="${loginUrl}" style="display:inline-block;background:#4f46e5;color:white;padding:12px 18px;border-radius:10px;text-decoration:none">Sign in</a></p>
        <p>If the button does not work, paste this link into your browser:</p>
        <p>${loginUrl}</p>
      </div>
    `,
  });
}
