import { createMachine, assign, spawn, actions, type ActorRef } from "xstate";
import { last } from "lodash";
import { Subject } from "rxjs";
import {
  CashuMint,
  CashuWallet,
  type Proof,
  type RequestMintResponse,
} from "@cashu/cashu-ts";
import { Invoice, SentToken } from "../types";
import { TokenSpentEvent, createTokenChecker$ } from "./token-check";
import { SendTokenEvent, createTokenSender$ } from "./send";
import { MintEvent, createMintMachine } from "./mint";
const { stop } = actions;

type InitialWallet = Omit<WalletContext, "mint" | "wallet">;
const defaultInitial: InitialWallet = {
  proofs: [],
  sentTokens: [],
  historyProofs: [],
  invoice: null,
  invoiceHistory: [],
  tokenCheckers: [],
  tokenSenderRefs: [],
};
export const createWalletMachine = async (
  url: string,
  initial = defaultInitial
) => {
  const mint = new CashuMint(url);
  const keys = await mint.getKeys();
  const wallet = new CashuWallet(mint, keys);
  const events$$ = new Subject<WalletEvent>();
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
      invoke: {
        id: "events",
        src: () => events$$,
      },
      on: {
        TOKEN_SPENT: {
          actions: ["handleTokenSpent", "stopTokenChecker"],
          target: ".idle",
        },
        TOKENS_SENT: {
          actions: ["handleTokensSent", "startTokenChecker"],
        },
      },
      states: {
        idle: {
          on: {
            MINT: { target: "minting" },
            SEND: { actions: ["sendTokens"] },
          },
        },
        minting: {
          entry: ["mintTokens"],
          on: {
            INVOICE_RECEIVED: {
              actions: ["handleInvoiceReceived"],
            },
            INVOICE_PAID: {
              actions: ["handleMintSuccess"],
              target: "idle",
            },
            CANCEL_INVOICE: {
              actions: ["handleCancelMint"],
              target: "idle",
            },
          },
        },
      },
    },
    {
      actions: {
        sendTokens: assign((context, event) => {
          const tokenSenderRef = spawn(
            createTokenSender$(context.wallet, event.amount, context.proofs)
          );
          return {
            tokenSenderRefs: [...context.tokenSenderRefs, tokenSenderRef],
          };
        }),
        mintTokens: assign((context, event) => {
          const mintRef = spawn(
            createMintMachine(
              context.wallet,
              event.amount,
              events$$ as Subject<MintEvent>
            )
          );
          return { mintRef };
        }),
        handleInvoiceReceived: assign((_, event) => {
          const { invoice } = event;
          return {
            invoice,
          };
        }),
        handleMintSuccess: assign((context, event) => {
          return {
            proofs: [...context.proofs, ...event.proofs],
            invoice: null,
            invoiceHistory: [
              ...context.invoiceHistory,
              { ...context.invoice!, status: "paid" } satisfies Invoice,
            ],
          };
        }),
        handleCancelMint: assign((context) => {
          const { invoice } = context;
          if (!invoice) return {};
          return {
            invoiceHistory: [
              ...context.invoiceHistory,
              { ...invoice, status: "cancelled" } satisfies Invoice,
            ],
            invoice: null,
          };
        }),
        handleTokensSent: assign((context, event) => {
          const { returnChange, token } = event;
          return {
            proofs: returnChange,
            sentTokens: [...context.sentTokens, token],
          };
        }),
        handleTokenSpent: assign((context, event) => {
          const { token } = event;
          const index = context.sentTokens.findIndex(
            (t) => t.encoded === token.encoded
          );
          if (index === -1) return {};
          stop(`token-checker-${token.encoded}`);
          return {
            sentTokens: [
              ...context.sentTokens.slice(0, index),
              { ...context.sentTokens[index], status: "spent" as const },
              ...context.sentTokens.slice(index + 1),
            ],
          };
        }),
        startTokenChecker: assign((context) => {
          const token = last(context.sentTokens);
          if (!token) throw new Error("No tokens to check");
          return {
            tokenCheckers: [
              ...context.tokenCheckers,
              spawn(
                createTokenChecker$(context.wallet.mint, token),
                `token-checker-${token.encoded}`
              ),
            ],
          };
        }),
        stopTokenChecker: stop(
          (context, event) =>
            context.tokenCheckers.find(
              (t) => t.id === `token-checker-${event.token.encoded}`
            )!
        ),
      },
      services: {},
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
  /** A record of tokens that have been sent */
  sentTokens: SentToken[];
  /** A list of spent proofs */
  historyProofs: Proof[];
  /** The active invoice waiting to be paid */
  invoice: Invoice | null;
  /** A list of invoices paid to the mint */
  invoiceHistory: Invoice[];

  /** A list of token senders */
  tokenSenderRefs: ActorRef<SendTokenEvent>[];
  /** A list of token checkers */
  tokenCheckers: ActorRef<TokenSpentEvent>[];
  /** The mint machine currently running */
  mintRef?: ActorRef<MintEvent>;
}

export type WalletEvent =
  | { type: "MINT"; amount: number }
  | { type: "SEND"; amount: number }
  | { type: "PREPARED_TOKENS"; returnChange: Proof[]; send: Proof[] }
  | { type: "CANCEL_MINT" }
  | { type: "INVOICE_PAID"; proofs: Proof[] }
  | {
      type: "MINT_REQUEST_SUCCESS";
      data: RequestMintResponse & { amount: number };
    }
  | SendTokenEvent
  | TokenSpentEvent
  | MintEvent;
