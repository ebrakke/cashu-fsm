// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.mint": {
      type: "done.invoke.mint";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.requestMint": {
      type: "done.invoke.requestMint";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.mint": { type: "error.platform.mint"; data: unknown };
    "error.platform.requestMint": {
      type: "error.platform.requestMint";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    mint: "done.invoke.mint";
    requestMint: "done.invoke.requestMint";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    emitMintSuccess: "INVOICE_PAID";
    handleInvoiceReceived: "INVOICE_RECEIVED";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    mint: "INVOICE_RECEIVED";
    requestMint: "CANCEL_INVOICE" | "xstate.init";
  };
  matchesStates: "cancelled" | "minted" | "minting" | "request";
  tags: never;
}
