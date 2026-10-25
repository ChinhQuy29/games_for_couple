// Compile-time only (never imported at runtime): fails `npm run typecheck` if the real
// exports drift from types.d.ts, which is what the shared server is checked against.
import type * as impl from "./index.js";
import type * as contract from "../types.js";

export const check = (x: typeof impl): typeof contract => x;
