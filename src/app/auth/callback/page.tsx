import { redirect } from "next/navigation";

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    redirect("/login?error=expired");
  }
  redirect(`/api/auth/verify?token=${encodeURIComponent(token)}`);
}
