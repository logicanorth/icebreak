import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function AuthCallbackPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = params.token ?? "";

  if (!token) {
    redirect("/login?error=expired");
  }

  redirect(`/api/auth/verify?token=${encodeURIComponent(token)}`);
}
