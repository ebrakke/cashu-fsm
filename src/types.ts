import type { Token } from "@cashu/cashu-ts";
export interface Invoice {
  amount: number;
  pr: string;
  hash: string;
  status: "paid" | "pending" | "expired" | "cancelled";
  date: string; // ISO date string
}

export interface SentToken extends Token {
  date: string;
  encoded: string;
  amount: number;
  status: "pending" | "spent";
}

export interface ReceivedToken extends Token {
  date: string;
  amount: number;
}
