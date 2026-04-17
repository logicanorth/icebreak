import crypto from "crypto";
import { NextRequest } from "next/server";

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

function base64urlEncode(str: string): string {
  return Buffer.from(str).toString("base64url");
}

function base64urlDecode(str: string): string {
  return Buffer.from(str, "base64url").toString("utf8");
}

export function signToken(email: string): string {
  const secret = getSecret();
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 24 * 30; // 30 days
  const payload = base64urlEncode(JSON.stringify({ email, iat: now, exp }));
  const data = `${header}.${payload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

export function verifyToken(token: string): { email: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const secret = getSecret();
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(`${header}.${payload}`)
      .digest("base64url");
    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const decoded = JSON.parse(base64urlDecode(payload));
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) return null;
    if (!decoded.email) return null;
    return { email: decoded.email };
  } catch {
    return null;
  }
}

export function getSessionEmail(req: NextRequest): string | null {
  const cookie = req.cookies.get("icebreak_session");
  if (!cookie?.value) return null;
  const result = verifyToken(cookie.value);
  return result?.email ?? null;
}
