# CLAUDE.md

このリポジトリで作業するときの入口。**詳細は `docs/` に分けてある**ので、
作業に当たる文書を開いてから手を動かす。

## プロジェクト概要

Remotion で作るミュージックビデオ集。`npm run dev` で Remotion Studio が起動する。
**1 リポジトリに複数の MV を並べる**構成で、MV 1 本ぶんが `src/videos/<Name>/` に丸ごと収まる。
汎用エンジン（`src/lib/`）は全 MV で共有する。現在の MV は `meerkat` だけ。

フォルダ構成の一覧は [`README.ja.md` の「構成」](./README.ja.md)。

## コマンド

- `npm run lint` : `eslint src tests stories && tsc` をまとめて実行。**コードを変更したら必ずこれを通す**
- `npm test` : `vitest run`。`tests/**/*.test.ts` を拾う
- `npm run dev` : Remotion Studio でプレビュー
- `npm run storybook` : Storybook で `src/lib/` のパーツを単体確認

## どの文書を読むか

| やること                             | 読む文書                                                                           |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| コードを書く（命名・定数・置き場所） | [`docs/instructions/code_guide.md`](./docs/instructions/code_guide.md)             |
| 汎用パーツを使う・足す               | [`docs/instructions/lib_guide.md`](./docs/instructions/lib_guide.md)               |
| 画の切り替えを触る                   | [`docs/instructions/transition_guide.md`](./docs/instructions/transition_guide.md) |
| 言語版を足す・歌詞 JSON を直す       | [`docs/instructions/localization.md`](./docs/instructions/localization.md)         |
| 新しい MV を1本足す                  | [`docs/instructions/new_video.md`](./docs/instructions/new_video.md)               |
| `src/lib/` のパーツを単体で確かめる  | [`docs/instructions/storybook.md`](./docs/instructions/storybook.md)               |
| 依存パッケージを足す・入れ替える     | [`docs/instructions/setup.md`](./docs/instructions/setup.md)                       |
| meerkat の秒・数値・固有の作り       | [`docs/videos/meerkat.md`](./docs/videos/meerkat.md)                               |

## 常に守ること

読む前でも外してはいけない決めごとだけ、ここに置く。理由と例は各文書にある。

1. **`React.FC` を使わない。** 引数に直接 Props 型をアノテートする（JSDoc 自動生成のため）
2. **1か所でしか使わない値は定数にしない。** 定数化するのは「必ず一致していなければならない値」
   「他のファイルから参照される値」「並びそのものを表すデータ」だけ
3. **同じ形のものが並ぶときは、定数ではなく組み立て関数にまとめる**（違うところだけを引数に取る）
4. **ファイル名は PascalCase**（例外は `index.ts` と `00_01_Intro.tsx` のような連番始まり）
5. **コメントは「なぜ」を書く。** 処理を日本語に訳しただけのコメントは書かない
6. **汎用（`src/lib/`）と MV 専用（`src/videos/<Name>/`）を混ぜない。**
   依存は MV専用 → 汎用 の一方向だけ。MV どうしも import し合わない。
   汎用側は曲・キャラ・作品名を知らず、画像・音源のパスは既定値も持たない
7. **MV 側のラッパーを汎用パーツと同じ名前にしない**（`Subtitle` ではなく `MeerkatSubtitle`）
8. **`src/` に置くのは動画になるコードだけ。** Remotion の入口 `src/index.ts` から
   import で辿れるものが出力になる。テストとストーリーは辿られない検証の道具なので、
   実装の隣にも `src/` の中にも置かず、ルート直下の `tests/` / `stories/` の下を
   `src/` と同じ形にミラーする
9. **並びをトランジションで繋ぐときは `TransitionRun` を使う。** 頭出し・重なりを自分で計算しない
10. **公開済み Composition の出力を1フレームも変えない。** 解像度・fps・数値・
    `durationInFrames` の式は触らない。リファクタ時は静止画を撮って `cmp` で突き合わせる
    （守るべき数値は `docs/videos/<Name>.md`）
11. フォーマットは Prettier に任せる（`npx prettier --check .`）
