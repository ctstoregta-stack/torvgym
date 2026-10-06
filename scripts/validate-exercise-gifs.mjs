import { request } from "node:https";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/data/exercises.ts", import.meta.url), "utf8");
const urls = [...source.matchAll(/gif_url:\s*"([^"]+)"/g)].map((match) => match[1]);
const uniqueUrls = [...new Set(urls)];

function checkUrl(url) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      resolve({ url, ok: false, reason: "not-https" });
      return;
    }

    const req = request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "HEAD",
        timeout: 10000,
        headers: {
          "User-Agent": "TorvGym-GIF-Validator",
          Accept: "image/gif,image/*,*/*;q=0.8",
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        res.resume();
        resolve({ url, ok: status >= 200 && status < 400, status });
      },
    );

    req.on("timeout", () => {
      req.destroy();
      resolve({ url, ok: false, reason: "timeout" });
    });
    req.on("error", (error) => {
      resolve({ url, ok: false, reason: error.message });
    });
    req.end();
  });
}

const results = [];
for (const url of uniqueUrls) results.push(await checkUrl(url));

const failures = results.filter((result) => !result.ok);
console.log(`Exercícios auditados: ${urls.length}; URLs únicas: ${uniqueUrls.length}; falhas: ${failures.length}`);

for (const failure of failures) console.log(JSON.stringify(failure));

if (failures.length > 0) {
  process.exitCode = 1;
}
