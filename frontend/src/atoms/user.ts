/* Shim: the original navbar read a jotai user atom to switch between logged-in
   and public states. The marketing pages are always public here, so this stays
   null (the navbar then renders its public Login / Sign-Up actions). */
import { atom } from "jotai";

export interface MarketingUser {
  name?: string;
  email?: string;
}

export const userAtom = atom<MarketingUser | null>(null);
