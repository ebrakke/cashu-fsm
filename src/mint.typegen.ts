// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.connect": {
      type: "done.invoke.connect";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.connect": { type: "error.platform.connect"; data: unknown };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    connect: "done.invoke.connect";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    handleConnectSuccess: "done.invoke.connect";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    connect: "CONNECT";
  };
  matchesStates:
    | "connectSuccess"
    | "connected"
    | "connected.idle"
    | "connected.minting"
    | "connected.minting.mint"
    | "connected.minting.request"
    | "connecting"
    | "idle"
    | { connected?: "idle" | "minting" | { minting?: "mint" | "request" } };
  tags: never;
}
