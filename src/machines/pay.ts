import { from, map } from "rxjs";
import { CashuWallet, type Proof, type MintKeys } from "@cashu/cashu-ts";

export type PayInvoiceEvent =
  | {
      type: "PAY_INVOICE_PAID";
      change: Proof[];
      preimage: string;
      invoice: string;
      newKeys?: MintKeys;
    }
  | { type: "PAY_INVOICE_ERROR"; error: string };
export const createPayInvoicer$ = (
  invoice: string,
  wallet: CashuWallet,
  proofs: Proof[]
) => {
  return from(wallet.payLnInvoice(invoice, proofs)).pipe(
    map(({ change, isPaid, preimage, newKeys }) => {
      if (isPaid) {
        return {
          type: "PAY_INVOICE_PAID",
          change,
          preimage: preimage!,
          invoice,
          newKeys,
        } satisfies PayInvoiceEvent;
      }
      return {
        type: "PAY_INVOICE_ERROR",
        error: "Invoice not paid",
      } satisfies PayInvoiceEvent;
    })
  );
};
