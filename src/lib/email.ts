const RESEND_API_KEY = process.env.RESEND_API_KEY!;

export async function sendMagicLink(to: string, magicUrl: string): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Icebreak login link</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0f;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <span style="font-size:20px;font-weight:800;color:#e8e8f0;letter-spacing:-0.04em;">icebreak</span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:#111118;border:1px solid #1e1e2e;border-radius:16px;padding:40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:16px;">
                    <h1 style="margin:0;font-size:24px;font-weight:700;color:#e8e8f0;letter-spacing:-0.03em;">
                      Your Pro login link
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:32px;">
                    <p style="margin:0;font-size:15px;color:#6b6b85;line-height:1.6;">
                      Click the button below to access your Icebreak Pro account. This link is valid for 15 minutes and can only be used once.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:32px;text-align:center;">
                    <a href="${magicUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:16px 40px;border-radius:10px;letter-spacing:-0.01em;">
                      Log in to Icebreak Pro
                    </a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin:0;font-size:13px;color:#6b6b85;line-height:1.6;">
                      Or copy and paste this URL into your browser:<br />
                      <span style="color:#a5b4fc;word-break:break-all;">${magicUrl}</span>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:32px;border-top:1px solid #1e1e2e;margin-top:32px;">
                    <p style="margin:0;font-size:12px;color:#6b6b85;">
                      If you didn't request this, you can safely ignore this email. Your account remains secure.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#6b6b85;">
                Icebreak &mdash; AI cold email personalization
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Icebreak <hello@icebreakemail.com>",
      to: [to],
      subject: "Your Icebreak Pro login link",
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error: ${text}`);
  }
}
