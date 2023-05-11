import { createMachine, assign } from "xstate";
import { CashuMint, type GetInfoResponse } from "@cashu/cashu-ts";

export const createMintMachine = (url: string) =>
  createMachine(
    {
      id: "mint",
      initial: "idle",
      predictableActionArguments: true,
      schema: {
        context: {} as {
          keys: Record<number, string>;
          keysets: string[];
          mint: CashuMint;
          info?: GetInfoResponse;
        },
        events: {} as
          | { type: "CONNECT" }
          | { type: "MINT" }
          | {
              type: "done.invoke.connect";
              data: {
                info: GetInfoResponse;
                keys: Record<number, string>;
                keysets: string[];
              };
            },
      },
      tsTypes: {} as import("./mint.typegen").Typegen0,
      context: {
        mint: new CashuMint(url),
        keys: {},
        keysets: [],
      },
      states: {
        idle: {
          on: {
            CONNECT: { target: "connecting" },
          },
        },
        connecting: {
          invoke: {
            src: "connect",
            id: "connect",
            onDone: { target: "connectSuccess" },
          },
        },
        connectSuccess: {
          entry: ["handleConnectSuccess"],
          always: "connected",
        },
        connected: {
          initial: "idle",
          states: {
            idle: {
              on: {
                MINT: { target: "minting" },
              },
            },
            minting: {
              initial: "request",
              states: {
                request: {},
                mint: {},
              },
            },
          },
        },
      },
    },
    {
      actions: {
        handleConnectSuccess: assign((_, event) => ({
          info: event.data.info,
          keys: event.data.keys,
          keysets: event.data.keysets,
        })),
      },
      services: {
        connect: async (context) => {
          const info = await context.mint.getInfo();
          const keys = await context.mint.getKeys();
          const { keysets } = await context.mint.getKeySets();
          return { info, keys, keysets };
        },
      },
    }
  );
