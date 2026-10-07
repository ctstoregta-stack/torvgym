import { request } from "node:https";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/data/exercises.ts", import.meta.url), "utf8");
const urls = [...source.matchAll(/gif_url:\s*"([^"]+)"/g)].map((match) => match[1]);
const uniqueUrls = [...new Set(urls)];

function checkUrl(url, redirectCount = 0) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      resolve({ url, ok: false, reason: "not-https" });
      return;
    }
    if (redirectCount > 3) {
      resolve({ url, ok: false, reason: "too-many-redirects" });
      return;
    }

    const req = request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "GET",
        timeout: 10000,
        headers: {
          "User-Agent": "TorvGym-GIF-Validator",
          Accept: "image/gif,image/*,*/*;q=0.8",
          Range: "bytes=0-15",
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = res.headers.location;
        if (status >= 300 && status < 400 && location) {
          res.resume();
          const next = new URL(location, parsed);
          void checkUrl(next.toString(), redirectCount + 1).then((result) =>
            resolve({ ...result, url }),
          );
          return;
        }

        const contentType = String(res.headers["content-type"] ?? "").toLowerCase();
        const chunks = [];
        let bytes = 0;
        res.on("data", (chunk) => {
          if (bytes < 16) {
            const value = Buffer.from(chunk);
            chunks.push(value.subarray(0, Math.max(0, 16 - bytes)));
            bytes += Math.min(value.length, 16 - bytes);
          }
          res.destroy();
        });
        res.on("close", () => {
          const header = Buffer.concat(chunks).toString("ascii");
          const okStatus = status >= 200 && status < 300;
          const isGif = contentType.startsWith("image/gif");
          const isPng = contentType.startsWith("image/png");
          const okType = isGif || isPng;
          const okMagic = isGif
            ? header.startsWith("GIF87a") || header.startsWith("GIF89a")
            : isPng
              ? header.startsWith("\x89PNG\r\n\x1a\n")
              : false;
          resolve({
            url,
            ok: okStatus && okType && okMagic,
            status,
            ...(okType ? {} : { reason: "invalid-content-type", contentType }),
            ...(okMagic ? {} : { magic: header.slice(0, 8) }),\n            ...(isGif ? {} : isPng ? { warning: "valid-image-but-not-animated-gif" } : {}),
          });
        });
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
const concurrency = 6;
for (let i = 0; i < uniqueUrls.length; i += concurrency) {
  const batch = uniqueUrls.slice(i, i + concurrency);
  results.push(...await Promise.all(batch.map((url) => checkUrl(url))));
}

const failures = results.filter((result) => !result.ok);
console.log(`Exercícios auditados: ${urls.length}; URLs únicas: ${uniqueUrls.length}; falhas: ${failures.length}`);
console.log("Validação inclui HTTPS, redirecionamentos, Content-Type e assinatura GIF/PNG; mídias PNG válidas são reportadas como não animadas.");

for (const failure of failures) console.log(JSON.stringify(failure));

if (failures.length > 0) {
  process.exitCode = 1;
}
