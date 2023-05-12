import { createMachine, assign } from "xstate";
import { formatISO } from "date-fns";
import { interval, switchMap, filter, take, map, from, tap } from "rxjs";
import {
  CashuMint,
  CashuWallet,
  type Proof,
  type RequestMintResponse,
} from "@cashu/cashu-ts";

type InitialWallet = Omit<WalletContext, "mint" | "wallet">;
const defaultInitial: InitialWallet = {
  proofs: [],
  sentProofs: {},
  historyProofs: [],
  invoice: null,
  invoiceHistory: [],
};
export const createWalletMachine = async (
  url: string,
  initial = defaultInitial
) => {
  const mint = new CashuMint(url);
  const keys = await mint.getKeys();
  const wallet = new CashuWallet(mint, keys);
  return createMachine(
    {
      id: "wallet",
      predictableActionArguments: true,
      schema: {
        context: {} as WalletContext,
        events: {} as WalletEvent,
      },
      tsTypes: {} as import("./wallet.typegen").Typegen0,
      initial: "idle",
      context: {
        ...initial,
        mint,
        wallet,
      },
      states: {
        idle: {
          on: {
            MINT: { target: "minting" },
            SEND: { target: "sending" },
          },
        },
        minting: {
          initial: "request",
          states: {
            request: {
              on: {
                MINT_REQUEST_SUCCESS: {
                  target: "mint",
                  actions: ["handleMintRequestSuccess"],
                },
              },
              invoke: {
                src: "requestMint",
                id: "requestMint",
              },
            },
            mint: {
              on: {
                CANCEL_MINT: {
                  target: "#wallet.idle",
                  actions: ["handleCancelMint"],
                },
                INVOICE_PAID: {
                  target: "#wallet.idle",
                  actions: ["handleMintSuccess"],
                },
              },
              invoke: {
                src: "mint",
                id: "mint",
              },
            },
          },
        },
        sending: {
          initial: "prepareTokens",
          states: {
            prepareTokens: {
              on: {
                PREPARED_TOKENS: {
                  target: "sendTokens",
                },
              },
              invoke: {
                src: "prepareTokens",
                id: "prepareTokens",
              },
            },
            sendTokens: {
              entry: ["handleSendTokens"],
              always: { target: "#wallet.idle" },
            },
          },
        },
      },
    },
    {
      actions: {
        handleMintRequestSuccess: assign((_, event) => ({
          invoice: {
            amount: event.data.amount,
            pr: event.data.pr,
            hash: event.data.hash,
            status: "pending" as const,
          },
        })),
        handleMintSuccess: assign((context, event) => {
          return {
            proofs: [...context.proofs, ...event.proofs],
            invoice: null,
            invoiceHistory: [
              ...context.invoiceHistory,
              { ...context.invoice!, status: "paid" as const },
            ],
          };
        }),
        handleCancelMint: assign((context) => {
          const { invoice } = context;
          if (!invoice) return {};
          return {
            invoiceHistory: [
              ...context.invoiceHistory,
              { ...invoice, status: "cancelled" as const },
            ],
            invoice: null,
          };
        }),
        handleSendTokens: assign((context, event) => {
          const { returnChange, send } = event; // TODO: what to do if new keys come back?
          return {
            proofs: returnChange,
            sentProofs: {
              ...context.sentProofs,
              [formatISO(new Date())]: send,
            },
          };
        }),
      },
      services: {
        requestMint: (ctx, event) => {
          const { amount } = event;
          const { wallet } = ctx;
          return from(wallet.requestMint(amount)).pipe(
            map((r) => ({
              type: "MINT_REQUEST_SUCCESS",
              data: { ...r, amount },
            }))
          );
        },
        mint: (ctx) =>
          interval(3000).pipe(
            switchMap(async () => {
              const { invoice } = ctx;
              if (!invoice) throw new Error("No invoice");
              try {
                const response = await ctx.wallet.requestTokens(
                  invoice!.amount,
                  invoice!.hash
                );
                console.log("RESPONSE", response);
                return response;
              } catch (error) {
                console.log("Invoice not paid yet");
              }
            }),
            filter((r) => !!r),
            map((r) => ({ type: "INVOICE_PAID", proofs: r!.proofs })),
            take(1)
          ),
        prepareTokens: (ctx, event) => {
          return from(ctx.wallet.send(event.amount, ctx.proofs)).pipe(
            map((r) => ({
              type: "PREPARED_TOKENS",
              returnChange: r.returnChange,
              send: r.send,
            })),
            tap((r) => console.log(r)),
            take(1)
          );
        },
      },
    }
  );
};

export interface WalletContext {
  /** The mint which the tokens are valid at */
  mint: CashuMint;
  /** Wallet object associated with the mint */
  wallet: CashuWallet;
  /** A list of spendable proofs */
  proofs: Proof[];
  /** A record of proofs that have been sent and waiting redemption */
  sentProofs: Record<string, Proof[]>;
  /** A list of spent proofs */
  historyProofs: Proof[];
  /** The active invoice waiting to be paid */
  invoice: Invoice | null;
  /** A list of invoices paid to the mint */
  invoiceHistory: Invoice[];
}

interface Invoice {
  amount: number;
  pr: string;
  hash: string;
  status: "paid" | "pending" | "expired" | "cancelled";
}

type WalletEvent =
  | { type: "MINT"; amount: number }
  | { type: "SEND"; amount: number }
  | { type: "PREPARED_TOKENS"; returnChange: Proof[]; send: Proof[] }
  | { type: "CANCEL_MINT" }
  | { type: "INVOICE_PAID"; proofs: Proof[] }
  | {
      type: "MINT_REQUEST_SUCCESS";
      data: RequestMintResponse & { amount: number };
    };
