"use client";

export const dynamic = 'force-static';
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignInRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/auth/signin"); }, [router]);
  return null;
}
