import { createMintMachine } from "./mint";
import { interpret } from "xstate";
import { describe, it, expect } from "vitest";

describe("Mint Machine", () => {
  it("Should connect", () =>
    new Promise((done) => {
      const machine = createMintMachine("https://testnut.cashu.space");
      const svc = interpret(machine).onTransition((state) => {
        if (state.matches("connected.idle")) {
          expect(state.context.info).toBeDefined();
          done(true);
        }
      });
      svc.start();
      svc.send({ type: "CONNECT" });
    }));
});
