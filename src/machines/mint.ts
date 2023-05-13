import { formatISO } from "date-fns";
import { Subject, from, map, interval, switchMap, filter, take } from "rxjs";
import { createMachine, assign } from "xstate";
import { CashuWallet, Proof } from "@cashu/cashu-ts";
import { Invoice } from "../types";
/**
 * Handles logic for minting new tokens from the mint
 */

export type MintEvent =
  | {
      type: "INVOICE_RECEIVED";
      invoice: Invoice;
    }
  | { type: "INVOICE_PAID"; proofs: Proof[] }
  | { type: "CANCEL_INVOICE" };

interface MintContext {
  pr?: string;
  hash?: string;
}

export const createMintMachine = (
  wallet: CashuWallet,
  amount: number,
  event$$: Subject<MintEvent>
) =>
  createMachine(
    {
      id: "mintMachine",
      predictableActionArguments: true,
      tsTypes: {} as import("./mint.typegen").Typegen0,
      schema: {
        context: {} as MintContext,
        events: {} as MintEvent,
      },
      context: {},
      initial: "request",
      on: {
        CANCEL_INVOICE: {
          target: "cancelled",
        },
      },
      states: {
        request: {
          invoke: {
            src: "requestMint",
            id: "requestMint",
          },
          on: {
            INVOICE_RECEIVED: {
              actions: ["handleInvoiceReceived"],
              target: "minting",
            },
          },
        },
        minting: {
          invoke: {
            src: "mint",
            id: "mint",
          },
          on: {
            INVOICE_PAID: {
              actions: ["emitMintSuccess"],
              target: "minted",
            },
          },
        },
        minted: {
          type: "final",
        },
        cancelled: {
          type: "final",
        },
      },
    },
    {
      actions: {
        handleInvoiceReceived: assign((_, event) => {
          event$$.next({ type: "INVOICE_RECEIVED", invoice: event.invoice });
          return {
            hash: event.invoice.hash,
            pr: event.invoice.pr,
          };
        }),
        emitMintSuccess: (_, event) => {
          event$$.next({ type: "INVOICE_PAID", proofs: event.proofs });
        },
      },
      services: {
        mint: (ctx) => {
          return interval(3000).pipe(
            switchMap(async () => {
              const { hash } = ctx;
              if (!hash) throw new Error("No invoice");
              try {
                const response = await wallet.requestTokens(amount, hash);
                return response;
              } catch (error) {
                console.log("Invoice not paid yet");
              }
            }),
            filter((r) => !!r),
            map((r) => ({ type: "INVOICE_PAID", proofs: r!.proofs })),
            take(1)
          );
        },
        requestMint: () => {
          return from(wallet.requestMint(amount)).pipe(
            map((r) => ({
              type: "INVOICE_RECEIVED",
              invoice: {
                amount,
                date: formatISO(new Date()),
                hash: r.hash,
                pr: r.pr,
                status: "pending",
              } satisfies Invoice,
            }))
          );
        },
      },
    }
  );
