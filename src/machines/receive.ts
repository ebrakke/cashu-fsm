import { from, map, filter } from "rxjs";
import { CashuWallet, type Token } from "@cashu/cashu-ts";
/**
 * Receive tokens from a mint
 */
export type ReceiveTokenEvent = {
  type: "TOKENS_RECEIVED";
  token: Token;
  tokensWithErrors?: Token;
};

export const createTokenReceiver$ = (
  wallet: CashuWallet,
  encodedToken: string
) => {
  return from(wallet.receive(encodedToken)).pipe(
    map(
      ({ token, tokensWithErrors }) =>
        ({
          type: "TOKENS_RECEIVED",
          token,
          tokensWithErrors,
        } satisfies ReceiveTokenEvent)
    ),
    filter((r) => r.token.token.length > 0)
  );
};
