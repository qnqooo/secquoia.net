import { existsSync, readFileSync } from "node:fs";

const read = (path) => existsSync(path) ? readFileSync(path, "utf8") : "";
const html = read("index.html");
const manifestText = read(".sqaile/platform-manifest.json");
let manifest = {};
try { manifest = JSON.parse(manifestText); } catch {}

const controls = [
  ["manifest", manifest.schemaVersion === "1.0.0" && manifest.controlPlane === "SQAILE"],
  ["topology", manifest.edge === "Cloudflare" && manifest.identity === "QuIdentify" && manifest.platformBff === "required" && manifest.integrationGateway === "QuHub" && manifest.engineApi === "private" && manifest.providerAccess === "connector-only"],
  ["fail-closed", manifest.failClosed === true && manifest.productionEvidenceRequired === true && /QuVault/.test(manifest.secrets || "")],
  ["schema", existsSync("schemas/sqaile-platform-manifest.schema.json")],
  ["governance", existsSync("docs/SQAILE_WEB_GOVERNANCE.md")],
  ["edge-headers", /Content-Security-Policy:/i.test(read("_headers")) && /Strict-Transport-Security:/i.test(read("_headers"))],
  ["metadata", /rel=["']canonical["']/i.test(html) && /name=["']referrer["']/i.test(html) && /application\/ld\+json/i.test(html)],
  ["responsive-a11y", /name=["']viewport["']/i.test(html) && /<html[^>]+lang=/i.test(html) && /aria-/i.test(html)],
  ["ci", existsSync(".github/workflows/sqaile-web-governance.yml")],
  ["rollback", typeof manifest.rollback === "string" && manifest.rollback.length >= 10]
];

const passed = controls.filter(([, ok]) => ok).length;
const score = passed * 10;
for (const [name, ok] of controls) console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
console.log(`QUAUDIT_SOURCE_SCORE=${score}`);
if (score !== 100) process.exitCode = 1;
