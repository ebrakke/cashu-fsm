import { sumBy, omit } from "lodash";
import { interpret, Subscription } from "xstate";
import { createWalletMachine, WalletContext } from "./machines/wallet";
import { getDecodedToken } from "@cashu/cashu-ts";

interface WalletState {
  /** Balance of spendable tokens from the mint */
  balance: number;
  /** Raw proofs available to send */
  proofs: WalletContext["proofs"];
  /** Tokens that have been sent */
  sentTokens: WalletContext["sentTokens"];
  /** Tokens that have been received */
  receivedTokens: WalletContext["receivedTokens"];
  /** Current invoice waiting to be paid */
  invoice?: WalletContext["invoice"];
  /** History of invoices with the mint */
  invoiceHistory: WalletContext["invoiceHistory"];
}

export interface WalletService {
  /**
   * Ask mint to issue tokens for an amount in sats.
   * This will trigger a payment request to the user, which will be available in the `invoice` property.
   */
  mint: (amount: number) => void;
  /**
   * Send tokens to a user, this will handle splitting any tokens necessary to send the amount
   */
  send: (amount: number) => void;
  /**
   * Receives a token from a user and adds it to the list of spendable tokens if valid
   * Token must be from the same mint the wallet is setup for
   */
  receive: (encodedToken: string) => void;
  /**
   * A function to receive updates whenever the wallet state changes
   */
  subscribe: (observer: (state: WalletState) => void) => Subscription;
}

export const createWalletService = async (
  url: string
): Promise<WalletService> => {
  const storageKey = `cashu.wallet-${url}`;
  const saved = localStorage.getItem(storageKey);
  const initial = saved ? JSON.parse(saved) : undefined;
  const machine = await createWalletMachine(url, initial);
  const service = interpret(machine);

  const walletService: WalletService = {
    mint(amount: number) {
      service.send({ type: "MINT", amount });
    },
    send: (amount: number) => {
      service.send({ type: "SEND", amount });
    },
    receive: (encodedToken: string) => {
      const decoded = getDecodedToken(encodedToken);
      const mintTokens = decoded.token.filter((t) => t.mint === url);
      if (mintTokens.length === 0) {
        throw new Error(
          `Token is not from this mint. Expected ${url}, got ${decoded.token[0].mint}`
        );
      }
      service.send({ type: "RECEIVE", encodedToken });
    },
    subscribe(observer) {
      const unsub = service.subscribe((state) => {
        observer({
          balance: sumBy(state.context.proofs, "amount"),
          proofs: state.context.proofs,
          invoice: state.context.invoice,
          invoiceHistory: state.context.invoiceHistory,
          sentTokens: state.context.sentTokens,
          receivedTokens: state.context.receivedTokens,
        });
      });
      return unsub;
    },
  };
  service.onTransition((state) => {
    localStorage.setItem(storageKey, serializeContext(state.context));
  });
  service.start();
  return walletService;
};

/**
 * Only saves the necessary fields to local storage
 */
const serializeContext = (context: WalletContext) => {
  const toSave = omit(
    context,
    "tokenSenderRefs",
    "tokenReceiverRefs",
    "tokenCheckers",
    "mintRef",
    "mint",
    "wallet"
  );
  return JSON.stringify(toSave);
};
