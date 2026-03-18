import type { Route } from "./types.js";

interface MatchResult {
  route: Route;
  params: Record<string, string>;
}

/**
 * URLとルート定義をマッチングし、動的パラメータを抽出する
 *
 * 例: /users/:id と /users/123 → { id: "123" }
 */
export function matchRoute(url: string, routes: Route[]): MatchResult | null {
  for (const route of routes) {
    const params = tryMatch(route.path, url);
    if (params !== null) {
      return { route, params };
    }
  }
  return null;
}

function tryMatch(
  pattern: string,
  url: string
): Record<string, string> | null {
  // キャッチオールルート
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -2);
    if (url.startsWith(prefix + "/") || url === prefix) {
      const rest = url.slice(prefix.length + 1);
      return { slug: rest };
    }
    return null;
  }

  const patternParts = pattern.split("/");
  const urlParts = url.split("/");

  if (patternParts.length !== urlParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const pat = patternParts[i];
    const val = urlParts[i];

    if (pat.startsWith(":")) {
      // 動的セグメント — パラメータとして抽出
      params[pat.slice(1)] = val;
    } else if (pat !== val) {
      // 静的セグメントが一致しない
      return null;
    }
  }

  return params;
}
