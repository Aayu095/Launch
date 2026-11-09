// Insert a root redirect ("/" -> "/home") at the FRONT of the Build Output
// routes, so Vercel's routing layer sends the bare domain to the public
// website before the framework's server function can serve its sign-in
// page at "/". vercel.json redirects are ignored by --prebuilt deploys
// (the generated config.json is authoritative), hence this patch.
// Idempotent: safe to run after every build, before `vercel deploy --prebuilt`.
import { readFileSync, writeFileSync } from "node:fs";

const path = ".vercel/output/config.json";
const cfg = JSON.parse(readFileSync(path, "utf8"));
const SRC = "^/$";
cfg.routes = (cfg.routes ?? []).filter((r) => r.src !== SRC);
cfg.routes.unshift({ src: SRC, headers: { Location: "/home" }, status: 307 });
writeFileSync(path, JSON.stringify(cfg, null, 2));
console.log("root redirect patched into", path, "— routes:", cfg.routes.length);
