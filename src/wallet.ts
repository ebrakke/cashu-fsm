import { sumBy } from "lodash";
import { interpret, Subscription } from "xstate";
import { createWalletMachine, WalletContext } from "./machines/wallet";

interface WalletState {
  balance: number;
  proofs: WalletContext["proofs"];
  invoice?: WalletContext["invoice"];
  invoiceHistory: WalletContext["invoiceHistory"];
  isMinting: boolean;
}

export interface WalletService {
  mint: (amount: number) => void;
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
    subscribe(observer) {
      const unsub = service.subscribe((state) => {
        observer({
          balance: sumBy(state.context.proofs, "amount"),
          proofs: state.context.proofs,
          invoice: state.context.invoice,
          invoiceHistory: state.context.invoiceHistory,
          isMinting: state.matches("minting.mint"),
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
