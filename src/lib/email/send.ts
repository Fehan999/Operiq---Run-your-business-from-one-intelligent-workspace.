import "server-only";

import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logging/logger";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailResult {
  delivered: boolean;
}

/*
 * Transactional email goes through Resend when an API key is configured (its free tier
 * covers a small team). Without a key the message is logged instead, and callers show
 * the user a link they can share by hand, so local development never needs an inbox.
 *
 * Verification and password reset emails are sent by Firebase Auth and do not use this.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const env = getServerEnv();

  if (!env.RESEND_API_KEY) {
    logger.info("email provider not configured, skipping send", {
      to: message.to,
      subject: message.subject,
    });
    return { delivered: false };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      logger.error("email send failed", { status: response.status, subject: message.subject });
      return { delivered: false };
    }
    return { delivered: true };
  } catch (error) {
    logger.error("email send failed", { error, subject: message.subject });
    return { delivered: false };
  }
}
