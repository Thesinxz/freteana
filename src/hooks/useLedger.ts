"use client";

import { useLedgerContext } from "@/contexts/LedgerContext";

export function useLedger() {
  return useLedgerContext();
}
