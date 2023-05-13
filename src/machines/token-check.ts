import { interval, switchMap, filter, map, take, Observable } from "rxjs";
import { CashuMint } from "@cashu/cashu-ts";
import { SentToken } from "../types";

/**
 * A token check machine will run a background process to check the status of a token
 * When the token is spent, it will emit a TOKEN_SPENT event to the provided subject
 */
export type TokenSpentEvent = { type: "TOKEN_SPENT"; token: SentToken };
export const createTokenChecker$ = (
  mint: CashuMint,
  token: SentToken
): Observable<TokenSpentEvent> => {
  return interval(3000).pipe(
    switchMap(async () => {
      const { spendable } = await mint.check({
        proofs: token.token.map((t) => t.proofs).flat(),
      });
      if (spendable.some((r) => !r)) {
        return true;
      }
      return false;
    }),
    filter((r) => !!r),
    map(() => ({ type: "TOKEN_SPENT", token } satisfies TokenSpentEvent)),
    take(1)
  );
};
