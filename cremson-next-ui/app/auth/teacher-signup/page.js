"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LegacyTeacherSignUp() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth/signup?role=teacher");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
        <p className="text-xs font-semibold">Redirecting to Teacher Registration...</p>
      </div>
    </div>
  );
}
