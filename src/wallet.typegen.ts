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
    handleCancelMint: "CANCEL_MINT";
    handleMintSuccess: "INVOICE_PAID";
    handleRequestSuccess: "done.invoke.requestMint";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    mint: "done.invoke.requestMint";
    requestMint: "MINT";
  };
  matchesStates:
    | "idle"
    | "minting"
    | "minting.mint"
    | "minting.request"
    | { minting?: "mint" | "request" };
  tags: never;
}
