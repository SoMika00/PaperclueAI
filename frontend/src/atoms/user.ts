/* Shim for the ported marketing navbar's jotai user atom.

   IMPORTANT: the original defaults this to a fully-populated object (id: 0,
   empty strings, zeroed credits) — NOT null — because the navbar reads fields
   off it unguarded (`currentUser.id > 0`, `currentUser.free_credits`, …). A null
   default crashes the page ("client-side exception"), so the original's default
   shape is reproduced verbatim here. Fields are optional because the navbar also
   assigns partial objects from its (shimmed) user query. The marketing pages are
   always public — real auth is Supabase — so this value never changes and the
   navbar renders its logged-out About / Pricing / Blog / Login header. */
import { atom } from "jotai";

export interface MarketingUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  team_id: number | null;
  status: string;
  avatar: string | null;
  is_verified: boolean;
  subscription_id: string;
  subscription_type: string;
  subscription_status: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  free_credits: number;
  current_credits?: number;
  verification_token: string | null;
  reset_token: string | null;
  reset_token_expires: string | null;
  last_login: string | null;
  promo_code_requested: boolean;
  created_at: string;
  updated_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export const userAtom = atom<MarketingUser>({
  id: 0,
  email: "",
  first_name: "",
  last_name: "",
  role: "",
  team_id: null,
  status: "",
  avatar: null,
  is_verified: false,
  subscription_id: "",
  subscription_type: "",
  subscription_status: "",
  subscription_start_date: null,
  subscription_end_date: null,
  free_credits: 0,
  current_credits: 0,
  verification_token: null,
  reset_token: null,
  reset_token_expires: null,
  last_login: null,
  promo_code_requested: false,
  created_at: "",
  updated_at: "",
});
