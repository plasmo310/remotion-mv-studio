# 依存パッケージ

`npm install` で入るものの内訳と、**それぞれ何のために足したか**。
バージョンは `package.json` で固定してある（Remotion 4.0.518 / React 19.2.3 / TypeScript 5.9.3）ので、入れ直しても同じ組み合わせになる。README の[セットアップ](../../README.ja.md#セットアップ)から来る文書。

## テンプレートが入れるもの / 後から足したもの

Remotion のテンプレート（`npx create-video`）が入れてくれるのは `remotion` / `@remotion/cli` / `react` / `react-dom` と、`eslint` / `prettier` / `typescript` まわりまで。  
**残りは目的があって後から足したもの**なので、MV を作るのに何が要るかはこの表で分かる。

| パッケージ                            | 何のために足したか                                                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@remotion/google-fonts`              | 書体の読み込み。`src/lib/components/text/TextStyle.ts` が import 時に `loadFont()` を呼ぶ                                                                                       |
| `@remotion/noise`                     | 揺れのばらつき（`src/lib/effects/functions/ShakeEffect.ts`）                                                                                                                    |
| `vitest` / `jsdom`                    | 純粋関数のテスト。`TextStyle` が import しただけで `document` を触るので、DOM のない環境では動かない                                                                            |
| `storybook` / `@storybook/react-vite` | `src/lib/` のパーツを単体で確かめる（[`storybook.md`](./storybook.md)）                                                                                                         |
| `@remotion/player`                    | そのストーリーを再生する台（`stories/StoryPlayer.tsx`）。`useCurrentFrame` を見るパーツは `Player` の中でないと動かない                                                         |
| `vite`                                | Storybook のビルダー                                                                                                                                                            |
| `@vitejs/plugin-react-swc`            | `@storybook/react-vite` は React プラグインを自分で持たないので足す。**Babel 版（`@vitejs/plugin-react`）は Remotion CLI が抱える `@babel/core` 7 と依存が衝突するので SWC 版** |

## 足す・入れ替えるとき

- Remotion 関連（`remotion` / `@remotion/*`）はまとめて `npm run upgrade` で更新する。
  **バージョンがずれると動かない**ので、1つだけ上げない。
- Remotion 以外を足したら、この表に「何のために足したか」を1行書く。
  書けないものは足さない。
- 足したあとは `npm run lint` と `npm test` を通す。
  Storybook まわりを触ったときは `npm run storybook` も開いて確かめる。
