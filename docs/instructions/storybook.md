# Storybook

`src/lib/` のパーツを、MV の Composition から切り離して1つずつ確かめるための Storybook。
どのパーツも `useCurrentFrame` / `useVideoConfig` を見るので、
`@remotion/player` の `Player` に載せた台（`stories/StoryPlayer.tsx`）の中で再生する。

## 起動

依存は `npm i` で入る（追加の初期化コマンドは不要）。

```console
npm run storybook
```

`http://localhost:6006` が開く。静的に書き出すときは `npm run build-storybook`
（出力先 `storybook-static/`。Git には入れない）。

## 中身

- ストーリーは `stories/` に置き、その下を `src/` と同じ形にミラーする
  （`src/lib/effects/functions/PopInEffect.ts` → `stories/lib/effects/functions/PopInEffect.stories.tsx`）。
  テストと同じ考え方で、`src/lib/` に `.stories.tsx` を混ぜない。
- **`src/lib/` 専用**。MV の Composition は Remotion Studio（`npm run dev`）で見るので、
  `src/videos/` のストーリーは作らない。
- サンプルは最小限。1パーツにつき「既定のまま」と「主な Props を振ったところ」の2つ程度に留める。
  凝った作例は MV 側（`src/videos/`）の仕事。
- 見本のアセットは `stories/SampleAssets.ts` にまとめてある。
  lib は特定の MV を知らないが、見本の絵を別に用意しても増えるだけなので
  `public/assets/meerkat/` のものを借りている。
- 値を返すもの（`dropShadowEffect` / `usePopIn` など）は、
  ストーリーの中に小さなデモ用コンポーネントを1つ書いて、その返り値を絵にして見せている。

## 構成ファイル

| パス                      | 中身                                                                         |
| ------------------------- | ---------------------------------------------------------------------------- |
| `.storybook/main.ts`      | ストーリーの置き場・`public/` の配信（`staticDirs`）・React プラグインの登録 |
| `.storybook/preview.ts`   | 全ストーリー共通の表示設定                                                   |
| `stories/StoryPlayer.tsx` | `Player` に載せる共通の台（fps・画面サイズ・下地の色）                       |
| `stories/SampleAssets.ts` | ストーリーで使う見本アセットのパス                                           |

React プラグインは Babel 版（`@vitejs/plugin-react`）ではなく SWC 版（`@vitejs/plugin-react-swc`）を使う。
Babel 版は `@babel/core` 8 を要求し、Remotion CLI が抱える `@babel/core` 7 と依存が衝突するため。

## ストーリーを足す

1. `stories/lib/<種類>/<サブフォルダ>/<パーツ名>.stories.tsx` を作る。
2. `title` は `lib/<種類>/<サブフォルダ>/<パーツ名>`（Storybook のサイドバーが `src/lib/` と同じ並びになる）。
3. 中身を `StoryPlayer` で包む。画像を使うなら `SampleAssets.ts` に足してから読む。
4. `npm run lint` を通す（`tsc` はストーリーも見る）。
