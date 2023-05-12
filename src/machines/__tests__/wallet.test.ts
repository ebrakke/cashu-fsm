import { describe, it, expect } from "vitest";
import { interpret } from "xstate";
import { createWalletMachine } from "../wallet";

describe("Wallet Machine", () => {
  describe("Creating a wallet", () => {
    it("Should create a wallet", async () => {
      const machine = await createWalletMachine("https://testnut.cashu.space");
      expect(machine.context.wallet).toBeDefined();
    });
  });
  describe("Minting Tokens", () => {
    it("should request to mint tokens and store the invoice as context", () =>
      new Promise(async (done) => {
        const machine = await createWalletMachine(
          "https://testnut.cashu.space"
        );
        const svc = interpret(machine).onTransition((state) => {
          if (state.matches("minting.mint")) {
            expect(state.context.invoice).toBeDefined();
            expect(state.context.invoice?.amount).toBe(1000);
            expect(state.context.invoice?.status).toBe("pending");
            done(true);
          }
        });
        svc.start();
        svc.send({ type: "MINT", amount: 1000 });
      }));
    it("should cancel the invoice and return to idle if user cancels", () =>
      new Promise(async (done) => {
        const machine = await createWalletMachine(
          "https://testnut.cashu.space"
        );
        let requested = false;
        const svc = interpret(machine).onTransition((state) => {
          if (state.matches("minting.mint")) {
            svc.send({ type: "CANCEL_MINT" });
            requested = true;
          }
          if (requested && state.matches("idle")) {
            expect(state.context.invoiceHistory[0].status).toBe("cancelled");
            expect(state.context.invoice).toBe(null);
            done(true);
          }
        });
        svc.start();
        svc.send({ type: "MINT", amount: 1000 });
      }));
    it("should add proofs to the wallet when minting is successful", () =>
      new Promise(async (done) => {
        const machine = await createWalletMachine(
          "https://testnut.cashu.space"
        );
        let requested = false;
        const svc = interpret(machine).onTransition((state) => {
          if (state.matches("minting.request")) {
            requested = true;
          }
          if (requested && state.matches("idle")) {
            expect(state.context.proofs.length).toBeGreaterThan(0);
            done(true);
          }
        });
        svc.start();
        svc.send({ type: "MINT", amount: 1000 });
      }));
  });
  describe("Sending Tokens", () => {
    it("should separate sent tokens and remaining tokens in context", () =>
      new Promise(async () => {
        const machine = await createWalletMachine(
          "https://testnut.cashu.space"
        );
        const svc = interpret(machine).onTransition((state) => {
          if (state.context.proofs.length > 0) {
            svc.send({ type: "SEND", amount: 500 });
          }
        });
        svc.start();
        svc.send({ type: "MINT", amount: 1000 });
      }));
  });
});
