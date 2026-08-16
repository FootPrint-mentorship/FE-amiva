"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { sessionActive } from "@/lib/data/auth";

/** Signed-in users have no business on the auth pages — send them straight
 * to the app instead of letting them log in over an existing session. */
export function useRedirectAuthed() {
  const router = useRouter();
  useEffect(() => {
    if (sessionActive()) router.replace("/app/today");
  }, [router]);
}
