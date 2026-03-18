export interface Route {
  path: string; // URLパターン（例: /users/:id）
  filePath: string; // 元のファイルパス
  name: string; // ルート名
  isDynamic: boolean; // 動的ルートかどうか
}

export type Handler = (params: Record<string, string>) => string;
