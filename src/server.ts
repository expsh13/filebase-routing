import http from "node:http";
import path from "node:path";
import { scanPages } from "./scanner.js";
import { matchRoute } from "./matcher.js";
import type { Handler } from "./types.js";

const PORT = 3000;
const PAGES_DIR = path.resolve(import.meta.dirname, "../pages");

async function main() {
  // Step 1: ファイルスキャン → ルート定義生成
  const routes = await scanPages(PAGES_DIR);

  console.log("=== 生成されたルート定義 ===");
  for (const route of routes) {
    console.log(`  ${route.path} → ${route.filePath}`);
  }
  console.log("");

  // Step 2: HTTPサーバーでリクエストを受け付け
  const server = http.createServer(async (req, res) => {
    const url = req.url ?? "/";
    console.log(`→ ${req.method} ${url}`);

    // Step 3: URLマッチング
    const match = matchRoute(url, routes);

    if (!match) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`404 Not Found: ${url}`);
      return;
    }

    console.log(`  マッチ: ${match.route.path} (params: ${JSON.stringify(match.params)})`);

    // Step 4: IOとコードの連携の核心 — ファイルパスを import() に渡して実行
    try {
      const mod = await import(match.route.filePath);
      const handler: Handler = mod.default;
      const body = handler(match.params);

      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(body);
    } catch (err) {
      console.error(`  エラー:`, err);
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("500 Internal Server Error");
    }
  });

  server.listen(PORT, () => {
    console.log(`サーバー起動: http://localhost:${PORT}`);
    console.log("Ctrl+C で停止\n");
  });
}

main();
