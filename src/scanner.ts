import { glob } from "tinyglobby";
import path from "node:path";
import type { Route } from "./types.js";

/**
 * 指定ディレクトリのファイルをスキャンし、ルート定義を生成する
 */
export async function scanPages(pagesDir: string): Promise<Route[]> {
  // Step 1: ファイルスキャン — tinyglobby でファイル一覧を取得
  const files = await glob(["**/*.ts"], {
    cwd: pagesDir,
    absolute: false,
  });

  // Step 2: 変換 — ファイルパスをルート定義に変換
  return files.map((file) => fileToRoute(file, pagesDir));
}

/**
 * ファイルパスからルート定義への変換ロジック
 *
 * pages/index.ts       → /
 * pages/about.ts       → /about
 * pages/users/[id].ts  → /users/:id
 * pages/posts/[...slug].ts → /posts/*
 */
function fileToRoute(filePath: string, pagesDir: string): Route {
  // 拡張子を除去
  let routePath = filePath.replace(/\.ts$/, "");

  // index を除去（ディレクトリのルートを表す）
  routePath = routePath.replace(/\/index$/, "").replace(/^index$/, "");

  // キャッチオールルート: [...param] → *
  const hasCatchAll = routePath.includes("[...");
  routePath = routePath.replace(/\[\.\.\.(\w+)\]/g, "*");

  // 動的セグメント: [param] → :param
  const hasDynamic = routePath.includes("[");
  routePath = routePath.replace(/\[(\w+)\]/g, ":$1");

  // 先頭にスラッシュを追加
  routePath = "/" + routePath;

  // ルート名を生成（スラッシュとコロンをハイフンに）
  const name = routePath === "/" ? "index" : routePath.slice(1).replace(/[/:*]/g, "-");

  return {
    path: routePath,
    filePath: path.resolve(pagesDir, filePath),
    name,
    isDynamic: hasDynamic || hasCatchAll,
  };
}
