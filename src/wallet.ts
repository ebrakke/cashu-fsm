import { sumBy } from "lodash";
import { interpret, Subscription } from "xstate";
import { createWalletMachine, WalletContext } from "./machines/wallet";

interface WalletState {
  /** Balance of spendable tokens from the mint */
  balance: number;
  /** Raw proofs available to send */
  proofs: WalletContext["proofs"];
  /** Tokens that have been sent */
  sentTokens: WalletContext["sentTokens"];
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
    subscribe(observer) {
      const unsub = service.subscribe((state) => {
        observer({
          balance: sumBy(state.context.proofs, "amount"),
          proofs: state.context.proofs,
          invoice: state.context.invoice,
          invoiceHistory: state.context.invoiceHistory,
          sentTokens: state.context.sentTokens,
        });
      });
      return unsub;
    },
  };
  service.onTransition((state) => {
    localStorage.setItem(storageKey, JSON.stringify(state.context));
  });
  service.start();
  return walletService;
};
