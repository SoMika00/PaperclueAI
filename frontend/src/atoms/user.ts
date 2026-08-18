/* Shim: the original navbar read a jotai user atom. The marketing pages are
   always public here, so this stays null and the navbar renders its public
   About / Pricing / Blog / Login actions. Typed loosely so the ported
   component's field accesses compile unchanged. */
import { atom } from "jotai";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MarketingUser = any;

export const userAtom = atom<MarketingUser | null>(null);
