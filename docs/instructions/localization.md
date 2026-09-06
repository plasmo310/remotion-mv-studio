# ローカライズ（言語別バージョン）

同じ絵・同じ演出のまま、歌詞と曲だけ差し替えた言語別バージョン（本編＋ショート）を並べて出す仕組み。
この文書は**どの MV でも共通の作法**。実際の値（秒・オフセット・文言）は
`docs/videos/<Name>.md` にある（meerkat は [`meerkat.md`](../videos/meerkat.md)）。

## 仕組み

### 日本語版がその MV の実装そのもの

`src/videos/<Name>/compositions/` 配下:

- `MusicVideoFull.tsx` … 本編。セクションの**並び・`name`・入り方（`transitionIn`）・絵（`element`）・日本語の頭出しの秒**を `SECTIONS` に、描画そのものを `MusicVideoFull` コンポーネントに持つ。入り方は `TRANSITIONS` というプリセット。`SectionEntry` 型・`FULL_VIDEO_FPS`・`fullDurationInFrames` もここ。
- `MusicVideoShort.tsx` … ショート。描画そのものの `MusicVideoShort` コンポーネントと、`SHORT_VIDEO_FPS`・`SHORT_LEAD_IN_SEC`・`shortDurationInFrames`。
- `MusicVideoFull` / `MusicVideoShort` の **Props の既定値がそのまま日本語版**なので、日本語の Composition は `<MusicVideoFull />` と書くだけ。

### 他の言語は「日本語版との差分」だけを持つ

- `MusicVideoFull<Lang>.tsx` … その言語の本編。`MusicVideoFull.tsx` の `SECTIONS` に `<LANG>_TAKES`（セクション名 → `{ startSec, element? }` の表）を上書きして `SECTIONS_<LANG>` を作り、音源・歌詞・lead-in・字幕補正といっしょに `<MusicVideoFull ... />` へ渡す。`<LANG>_TAKES` は `Record<SectionName, ...>` なので、**セクションの取りこぼしと名前の typo は型エラーになる**。
- そのテイク固有のタイミング定数（lead-in・イントロの遅延・イントロ終わり・字幕オフセット）を export する（ショートも同じ値を使うため）。音源・ロゴは `settings/Assets.ts`、歌詞は `data/Lyrics.ts` から読む。**その言語のタイミング調整はこのファイルで行う**。
- `MusicVideoShort<Lang>.tsx` … その言語のショート。`MusicVideoFull<Lang>.tsx` から上の値を import して `<MusicVideoShort ... />` に渡すだけ。

### 要点

- 演出（並び・入り方）を変えたいときは `MusicVideoFull.tsx` の `SECTIONS` / `TRANSITIONS` を触る。他の言語は秒と差し替えしか持たないので、そのまま効く。
- **config オブジェクトも共通 body ファイルも作らない**。言語が増えても増えるファイルは `MusicVideoFull<Lang>.tsx` / `MusicVideoShort<Lang>.tsx` の2つだけ。新しい MV も、まず日本語版を `MusicVideoFull.tsx` に素直に書くところから始める（共通化を先にしない）。
- React 要素を含むものは **Composition の `defaultProps` には載せない**。`durationInFrames` は `fullDurationInFrames(lyrics, leadInSec)` / `shortDurationInFrames(introEndSec)` で直接求める（`calculateMetadata` は使わない）。
- `SectionEntry.element` は `React.ComponentType` ではなく `React.ReactNode`。日本語は `SECTIONS` の既定をそのまま使い、他言語は `<LANG>_TAKES` の `element` に `<PreChorus cutStartSecs={[...]} />` のように、その言語のタイミングを **要素の Props で** 渡す。
- 字幕は MV 側のラッパー（`components/text/<Name>Subtitle`）に `lyrics` prop で言語別の歌詞データを渡す。配色は共通。`subtitleOffsetSec` prop で字幕全体を前後にずらせる（Whisper 系のアライメントは無音明けの語頭を遅めに置きがちなので、前へずらす補正が要ることが多い）。
- イントロのロゴは `Intro` の `logoSrc` prop で言語別画像に差し替える（`public/assets/<Name>/images/<lang>/`）。ロゴの縦横比が言語で違うときは `logoWidthRatio` で高さをそろえる。
- `Intro` の `versionLabel` prop に文言（例: `"English Ver"`）を渡すと、画面上部にバッジを出せる。**ショート版だけに出す**（`MusicVideoShort` の `versionLabel` prop から渡る）。本編と日本語版には渡さない。

## 歌詞 JSON（`src/videos/<Name>/data/subtitle/<lang>/Lyrics.json`）

- 形は `LyricsData`（`duration` / `offset` / `lines[]`）。生成は外部の Whisper 系パイプライン（lyrics.txt にアライメント）。
- JSON を読んで `LyricsData` にするのは `data/Lyrics.ts` 1か所（`JA_LYRICS` / `EN_LYRICS`）。各所で `as LyricsData` と書かない。
- `words[]` は **`text` の空白以外の全文字を、1文字＝1トークンで並べたもの**。カラオケ塗り（`lib/components/text/Subtitle` の `buildCharTimings`）が「`words[i].word` が `text` の各文字と一致」を前提にしている。
  - 英語パイプラインは英字だけを 1 文字ずつ出すので、`!` `?` `,` `'`（’）などの記号が抜ける。**記号は直前の文字と同じ `start` / `end` で `words[]` に足す**（抜けていると塗りが二値化したり行分割がずれる）。認識漏れの文字も同様に直前と同じタイミングで補完する。
  - 語末の `...` のように、パイプラインが最初から `.` トークンを含めている行はそのままでよい。
- セクションの `startSec` と歌詞行の位置は Remotion Studio で音源の波形・耳に合わせて追い込む。繰り返しフレーズ（サビのフック等）は、正しく合っている別の行を基準に、別のサビの譜割りを参考に逆算すると速い。

## 言語を1つ足す手順

パスは `src/videos/<Name>/` 配下。

1. 音源を `public/assets/<Name>/audio/<lang>/`、歌詞 JSON を `data/subtitle/<lang>/Lyrics.json`、ロゴを `public/assets/<Name>/images/<lang>/` に置く。歌詞 JSON は上記の「記号を足す」まで済ませる。
2. `compositions/MusicVideoFull<Lang>.tsx` を作る（既存の `MusicVideoFullEn.tsx` に倣う）。持つのは、テイク固有のタイミング定数・音源・ロゴ・歌詞と、`SECTIONS` に上書きする**秒の表（`<LANG>_TAKES`）だけ**。並び・`name`・`transitionIn` は `MusicVideoFull.tsx` が持つのでコピーしない。`startSec` は日本語版を出発点に Studio で追い込む。歌詞に密着したセクション内タイミング（歌い出し・B メロのカット・サビのコマ割りなど）は **破綻したものだけ** optional prop（日本語の既定値つき）を足して表の `element` から渡す。全部を先に prop 化しない。
3. `compositions/MusicVideoShort<Lang>.tsx` を作る。`MusicVideoFull<Lang>.tsx` から音源・歌詞・ロゴ・`introPopupDelaySec`・`subtitleOffsetSec`・`introEndSec` を import して `<MusicVideoShort ... />` に渡し、`fullVersionTelopText` を訳す。
4. 画面に出る固定文言（謝辞セクションの `text`、`FullVersionTelop` の `text` など）を訳す。バージョン表記は `MusicVideoShort` の `versionLabel` にだけ渡す（本編の `Intro` には渡さない）。
5. Composition の id は `MV-<作品名>-Full-<Lang>` / `MV-<作品名>-Short-<Lang>`。`src/videos/<Name>/index.ts` に export し、`src/Root.tsx` の `<Folder name="<Name>">` に追加。

## イントロの頭出しの注意（`leadInSec` と `startSec`）

- イントロセクションの `SectionEntry.startSec` を後ろへずらすと、その分だけ背景が出ず `MusicVideoFull` の下地色だけになる。イントロは必ず `startSec: -<lead-in>`（動画のフレーム0）から始める。
- キャラの登場（PopUp）を曲頭よりあとにしたいときは、`startSec` ではなく `<Intro leadInSec={...}>` を増やす。`leadInSec` は「セクション頭から PopUp までの秒数」で、背景はセクション頭から出るので頭の無地は増えない。

## 既存の言語版を壊さない

公開済みの Composition の解像度・fps・数値・`durationInFrames` の式は変えない。
検証のやり方は [`code_guide.md` の「既存 MV の出力を壊さない」](./code_guide.md)、
守るべき具体的な数値は `docs/videos/<Name>.md` を参照。
