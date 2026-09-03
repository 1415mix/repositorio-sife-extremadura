import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "public", "data", "repository.json"), "utf8"));
const urls = [...new Set([
  ...data.documents.map((document) => document.fuenteOficial),
  ...data.procedures.flatMap((procedure) => procedure.documents.map((document) => document.url))
])];
const failures = [];
const restricted = [];
const documentedRestrictions = new Set(data.documents
  .filter((document) => document.informeMaestro?.nota?.includes("impidió la descarga automatizada"))
  .map((document) => document.fuenteOficial));
const results = [];
let cursor = 0;
async function worker() {
  while (cursor < urls.length) {
    const url = urls[cursor++];
    const result = await check(url);
    results.push(result);
    if (!result.ok && documentedRestrictions.has(url) && result.status === 403) restricted.push(result);
    else if (!result.ok) failures.push(result);
  }
}
await Promise.all(Array.from({ length: Math.min(6, urls.length) }, () => worker()));

async function check(url) {
  try {
    let response = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(15000) });
    if (response.status === 405 || response.status >= 400) {
      response = await fetch(url, { method: "GET", redirect: "follow", headers: { Range: "bytes=0-1023" }, signal: AbortSignal.timeout(15000) });
    }
    return { url, ok: response.ok || response.status === 206, status: response.status, finalUrl: response.url };
  } catch (error) {
    return { url, ok: false, error: error.message };
  }
}
results.sort((a, b) => a.url.localeCompare(b.url));
fs.writeFileSync(path.join(root, "link-check-report.json"), `${JSON.stringify({ checkedAt: new Date().toISOString(), total: urls.length, failures, restricted, results }, null, 2)}\n`);
console.log(`Enlaces comprobados: ${urls.length}; incidencias: ${failures.length}; restricciones documentadas: ${restricted.length}.`);
if (failures.length) process.exitCode = 2;
