// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.payInvoice": {
      type: "done.invoke.payInvoice";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.payInvoice": {
      type: "error.platform.payInvoice";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    payInvoice: "done.invoke.payInvoice";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    handleCancelMint: "MINT_CANCEL_INVOICE";
    handleInvoiceReceived: "MINT_INVOICE_RECEIVED";
    handleMintSuccess: "MINT_INVOICE_PAID";
    handlePayInvoiceSuccess: "PAY_INVOICE_PAID";
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
    payInvoice: "PAY";
  };
  matchesStates: "idle" | "minting" | "paying";
  tags: never;
}
