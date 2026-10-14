"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyManageExpensesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/finance");
  }, [router]);

  return <p className="p-6 text-sm text-muted-foreground">Redirecting to your finance workspace...</p>;
}
