import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "assets/gov-profiles/rald-portrait.png");
const dest = join(root, "src/components/landing/gerald-portrait.enc.ts");

const key = 0x5a;
const buf = readFileSync(src);
const enc = Buffer.alloc(buf.length);
for (let i = 0; i < buf.length; i++) enc[i] = buf[i] ^ key;
const b64 = enc.toString("base64");

const out = `/** Encoded portrait bytes — decode only onto canvas at runtime. */
export const PORTRAIT_XOR_KEY = ${key} as const;
export const PORTRAIT_ENC_B64 =
	"${b64}";
`;

writeFileSync(dest, out);
console.log(`Encoded ${buf.length} bytes → ${dest}`);
