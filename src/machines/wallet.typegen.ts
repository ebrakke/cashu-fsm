// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.mint": {
      type: "done.invoke.mint";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.prepareTokens": {
      type: "done.invoke.prepareTokens";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.requestMint": {
      type: "done.invoke.requestMint";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.mint": { type: "error.platform.mint"; data: unknown };
    "error.platform.prepareTokens": {
      type: "error.platform.prepareTokens";
      data: unknown;
    };
    "error.platform.requestMint": {
      type: "error.platform.requestMint";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    mint: "done.invoke.mint";
    prepareTokens: "done.invoke.prepareTokens";
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
    handleMintRequestSuccess: "MINT_REQUEST_SUCCESS";
    handleMintSuccess: "INVOICE_PAID";
    handleSendTokens: "PREPARED_TOKENS";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    mint: "MINT_REQUEST_SUCCESS";
    prepareTokens: "SEND";
    requestMint: "MINT";
  };
  matchesStates:
    | "idle"
    | "minting"
    | "minting.mint"
    | "minting.request"
    | "sending"
    | "sending.prepareTokens"
    | "sending.sendTokens"
    | {
        minting?: "mint" | "request";
        sending?: "prepareTokens" | "sendTokens";
      };
  tags: never;
}
