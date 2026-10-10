import { useContext } from "react";
import { LotoContext, type LotoState } from "./LotoProvider";

/**
 * LOTO state + set/clear for the subtree. Throws outside LotoProvider.
 * @throws Error if invoked outside a LotoProvider
 */
export function useLoto(): LotoState {
  const ctx = useContext(LotoContext);
  if (ctx === null) throw new Error("useLoto must be used within LotoProvider");
  return ctx;
}
