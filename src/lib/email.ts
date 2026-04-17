const BREVO_API_KEY = process.env.BREVO_API_KEY!;

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
          <tr>
            <td style="padding-bottom:32px;">
              <span style="font-size:20px;font-weight:800;color:#e8e8f0;letter-spacing:-0.04em;">icebreak</span>
            </td>
          </tr>
          <tr>
            <td style="background:#111118;border:1px solid #1e1e2e;border-radius:16px;padding:40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:16px;">
                    <h1 style="margin:0;font-size:24px;font-weight:700;color:#e8e8f0;letter-spacing:-0.03em;">
                      Your login link
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:32px;">
                    <p style="margin:0;font-size:15px;color:#6b6b85;line-height:1.6;">
                      Click the button below to sign in to Icebreak. This link is valid for 15 minutes and can only be used once.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:32px;text-align:center;">
                    <a href="${magicUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:16px 40px;border-radius:10px;letter-spacing:-0.01em;">
                      Sign in to Icebreak
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
                  <td style="padding-top:32px;border-top:1px solid #1e1e2e;">
                    <p style="margin:0;font-size:12px;color:#6b6b85;">
                      If you didn't request this, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
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

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: 'Icebreak', email: 'logicanorth@gmail.com' },
      to: [{ email: to }],
      subject: 'Your Icebreak login link',
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo error: ${text}`);
  }
}
