// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    handleCancelMint: "CANCEL_INVOICE";
    handleInvoiceReceived: "INVOICE_RECEIVED";
    handleMintSuccess: "INVOICE_PAID";
    handleTokenSpent: "TOKEN_SPENT";
    handleTokensReceived: "TOKENS_RECEIVED";
    handleTokensSent: "TOKENS_SENT";
    mintTokens: "MINT";
    receiveTokens: "RECEIVE";
    sendTokens: "SEND";
    startTokenChecker: "TOKENS_SENT";
    stopTokenChecker: "TOKEN_SPENT";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    events: "xstate.init";
  };
  matchesStates: "idle" | "minting";
  tags: never;
}
