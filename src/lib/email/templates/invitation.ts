import { ROLE_DETAILS, type Role } from "@/lib/authorization/permissions";
import { escapeHtml } from "@/lib/email/html";

interface InvitationEmailInput {
  workspaceName: string;
  inviterName: string;
  role: Role;
  acceptUrl: string;
  expiresInDays: number;
}

export function invitationEmail({
  workspaceName,
  inviterName,
  role,
  acceptUrl,
  expiresInDays,
}: InvitationEmailInput) {
  const roleLabel = ROLE_DETAILS[role].label;
  const subject = `${inviterName} invited you to ${workspaceName} on Operiq`;

  const text = [
    `${inviterName} invited you to join ${workspaceName} on Operiq as ${roleLabel}.`,
    "",
    `Accept the invitation: ${acceptUrl}`,
    "",
    `The link expires in ${expiresInDays} days. If you weren't expecting this, you can ignore this email.`,
  ].join("\n");

  const safeWorkspace = escapeHtml(workspaceName);
  const safeInviter = escapeHtml(inviterName);
  const safeUrl = escapeHtml(acceptUrl);

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d232f;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e6e8ec;border-radius:12px;padding:32px;">
            <tr><td style="font-size:18px;font-weight:600;padding-bottom:16px;">Operiq</td></tr>
            <tr>
              <td style="font-size:15px;line-height:1.6;padding-bottom:24px;">
                <strong>${safeInviter}</strong> invited you to join <strong>${safeWorkspace}</strong> as <strong>${roleLabel}</strong>.
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <a href="${safeUrl}" style="display:inline-block;background:#0f6f78;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:8px;">Accept invitation</a>
              </td>
            </tr>
            <tr>
              <td style="font-size:13px;line-height:1.6;color:#667085;">
                This link expires in ${expiresInDays} days. If you weren't expecting this invitation, you can ignore this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}
