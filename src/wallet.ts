import { createMachine, assign } from "xstate";
import { interval, switchMap, filter, take, map } from "rxjs";
import {
  CashuMint,
  CashuWallet,
  type Proof,
  type RequestMintResponse,
} from "@cashu/cashu-ts";

export const createWalletMachine = async (url: string) => {
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
        mint,
        wallet,
        proofs: [],
        historyProofs: [],
        invoice: null,
        invoiceHistory: [],
      },
      states: {
        idle: {
          on: {
            MINT: { target: "minting" },
          },
        },
        minting: {
          initial: "request",
          states: {
            request: {
              invoke: {
                src: "requestMint",
                id: "requestMint",
                onDone: {
                  target: "mint",
                  actions: ["handleRequestSuccess"],
                },
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
      },
    },
    {
      actions: {
        handleRequestSuccess: assign((_, event) => ({
          invoice: {
            amount: event.data.amount,
            pr: event.data.pr,
            hash: event.data.hash,
            status: "pending" as const,
          },
        })),
        handleMintSuccess: assign((context, event) => {
          return {
            proofs: event.proofs,
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
      },
      services: {
        requestMint: async (ctx, event) => {
          const { amount } = event;
          const { wallet } = ctx;
          const response = await wallet.requestMint(amount);
          return { ...response, amount };
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
                return response;
              } catch (error) {
                console.log("Invoice not paid yet");
              }
            }),
            filter((r) => !!r),
            map((r) => ({ type: "INVOICE_PAID", proofs: r!.proofs })),
            take(1)
          ),
      },
    }
  );
};

interface WalletContext {
  /** The mint which the tokens are valid at */
  mint: CashuMint;
  /** Wallet object associated with the mint */
  wallet: CashuWallet;
  /** A list of spendable proofs */
  proofs: Proof[];
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
  | { type: "CANCEL_MINT" }
  | { type: "INVOICE_PAID"; proofs: Proof[] }
  | {
      type: "done.invoke.requestMint";
      data: RequestMintResponse & { amount: number };
    };
