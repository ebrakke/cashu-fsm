import { from, map, Observable } from "rxjs";
import { sumBy } from "lodash";
import { formatISO } from "date-fns";
import { CashuWallet, Proof, Token, getEncodedToken } from "@cashu/cashu-ts";
import { SentToken } from "../types";

export type SendTokenEvent = {
  type: "TOKENS_SENT";
  returnChange: Proof[];
  token: SentToken;
};
export const createTokenSender$ = (
  wallet: CashuWallet,
  amount: number,
  proofs: Proof[]
): Observable<SendTokenEvent> => {
  return from(wallet.send(amount, proofs)).pipe(
    map(({ returnChange, send }) => {
      const token: Token = {
        token: [
          {
            mint: wallet.mint.mintUrl,
            proofs: send,
          },
        ],
      };
      return {
        type: "TOKENS_SENT",
        returnChange,
        token: {
          ...token,
          amount: sumBy(send, (s) => s.amount),
          date: formatISO(new Date()),
          encoded: getEncodedToken(token),
          status: "pending",
        },
      } satisfies SendTokenEvent;
    })
  );
};
