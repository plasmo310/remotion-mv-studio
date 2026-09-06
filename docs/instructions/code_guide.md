# コーディングルール

このリポジトリでコード（`src/` / `tests/` / `stories/`）を書くときの決めごと。
どこに置くか（フォルダの分け方）は [`new_video.md`](./new_video.md) と
[`lib_guide.md`](./lib_guide.md) も参照。

## 1. コンポーネントは `React.FC` を使わず、引数に直接 Props 型をアノテートする

```ts
// ❌ 避ける
const Foo: React.FC<FooProps> = ({ a, b }) => { ... };

// ✅ こう書く
type FooProps = {
  a: string;
  b: number;
};

const Foo = ({ a, b }: FooProps) => { ... };
```

理由: `React.FC<Props>` は型が外側の変数に付き、引数自体は無注釈（コンテキストからの推論）になる。VSCode の「関数直前で `/**` → Enter」による JSDoc 自動生成は引数自体の型注釈を見て `@param` を展開するため、`React.FC` 方式だと `@param param0` の1行で止まってしまう。引数に直接アノテートすれば `@param param0.a` のようにフィールドごとに展開される。

Props 型は基本的に `type <ComponentName>Props` という名前で、コンポーネントの直前に定義する。

## 2. 調整値は使う場所に直接書く。定数化は「効くもの」だけ

**1か所でしか使わない値は定数にしない。** Props の既定値も、JSX の中のレイアウト値も、その場に直接書く。

```ts
// ❌ 避ける（同じ値を2回書いていて、値とコンポーネントの対応も追いづらい）
const DEFAULT_HEIGHT_RATIO = 0.55;
const FLOAT_SEC = 2.6;

export const CharaHover = ({ heightRatio = DEFAULT_HEIGHT_RATIO }: Props) => {
  const floatY = oscillate(elapsedSec, FLOAT_SEC) * size;

// ✅ こう書く（値が使う場所にあり、意味はコメントで伝える）
export const CharaHover = ({ heightRatio = 0.55 }: Props) => {
  // 上下に 2.6 秒周期で漂わせる
  const floatY = oscillate(elapsedSec, 2.6) * size;
```

定数にするのは次のどれかに当てはまるときだけ:

- **必ず一致していなければならない**値を、同じファイル内の2か所以上から参照するとき。例: `SQUASH_RATIO`（縦に伸ばした分だけ横を縮める）、`LINEARIZE_FILTER_ID`（定義と参照で同じ id）、`SRGB_GAMMA`
- **他のファイルから参照される**値。この場合は `export` する。例: `CHARA_HEIGHT_RATIO`, `SUBTITLE_BOTTOM_RATIO`
- カットやセクションの**並びそのもの**を表すデータ。例: `CUTS`, `SECTIONS`、`MusicVideoFull.tsx` の入り方プリセット `TRANSITIONS`

同じ値が2回出てきても、**それぞれ独立に調整してよい**なら定数にしない。1枚絵ごとのズーム量のように「たまたま今おなじ」だけの値は、各カットに直接書く。

値の意味・単位・既定値はコメントで伝える。Props の既定値なら Props 型の JSDoc に「省略時 0.8」のように書いておけば、呼び出し側からも読める。

文字列リテラルで種類分け（モード等）をする場合は例外で、生の文字列を各所に書かず `as const` の定数オブジェクトにまとめ、そこから型を導出する。

```ts
export const SUBTITLE_MODES = {
  KARAOKE: "karaoke",
  LINE: "line",
} as const;

export type SubtitleMode = (typeof SUBTITLE_MODES)[keyof typeof SUBTITLE_MODES];
```

呼び出し側も `mode === "karaoke"` ではなく `mode === SUBTITLE_MODES.KARAOKE` のように定数経由で比較する。

## 3. 同じ形のものが並ぶときは、定数ではなく組み立て関数にまとめる

カットや要素が「一部だけ違う同型のもの」として並ぶとき、共通の値を定数に切り出して並べると定数が増えるだけで読みにくい。**違うところだけを引数に取る関数**にして、共通の値は関数の中に直接書く。

```ts
// ❌ 避ける（共通値のぶんだけ定数が増え、2つのカットの違いも見えにくい）
const CHECK_ZOOM_HEIGHT_RATIO = 1.9;
const CHECK_ZOOM_TRANSLATE_Y = 0.34;
const CHECK_ZOOM_FROM_SCALE = 0.28;
// …あと4つ

// ✅ こう書く（違いは呼び出しの2つの引数だけ）
const CUTS: ImageCut[] = [
  // 右ヨシッ : 反転して、右から左へ流しながら寄る
  buildCheckCut(0.15, -1.35),
  // 左ヨシッ : 左から右へ流しながら寄る
  buildCheckCut(0.95, 1.35),
];
```

複数のセクションで同じ見せ方を使い回すときは、その関数を `export` して読み込む。

組み立て関数の名前は、**`export` するものはセクション名を含める**（`buildPreChorusCuts`）、**そのファイルの中だけで使うものは `buildCuts`** に揃える。

## 4. ファイル名は PascalCase

`src/` 配下の `.ts` / `.tsx` はコンポーネントでも計算モジュールでも**ファイル名を大文字始まり**にそろえる（`DropShadowEffect.ts`, `MusicVideoShortEn.tsx`）。export する名前まで合わせる必要はない（`DropShadowEffect.ts` が export するのは関数 `dropShadowEffect`）。

例外は入口の `index.ts`（`src/index.ts` と `src/videos/<Name>/index.ts`）と、並び順を持つ `sections/00_01_Intro.tsx` のような連番始まりのファイル。

## 5. フォーマットは Prettier に任せる

- `.prettierrc` の設定に従う。保存時に自動整形されるよう `.vscode/settings.json` で `editor.formatOnSave` を有効にしている
- 手動でインデントや改行を気にして書かなくてよい。整形はコミット前に `npx prettier --check .` で確認できる

## 6. コメントは「なぜ」を書く

- 単に処理を日本語に訳しただけのコメントは避け、「なぜその値・そのロジックにしているか」を書く（間奏区間の除外理由、フレーム丸め順序の理由など、既存コードのコメントを参考にする）
- 定数を減らして値を直接書くぶん（ルール2）、その値がなぜその数字なのかはコメントで補う

## 7. 汎用と MV 専用を混ぜない

フォルダの分け方は [`README.ja.md` の「構成」](../../README.ja.md) に従う。判断に迷ったときの基準:

- **汎用（`src/lib/`）に置くもの**: 曲・キャラ・作品名に依存しないもの。固有の色・秒数はハードコードせず、既定値つきの Props で受け取る。**画像・音源のパスは既定値も持たない**（MV ごとに `assets/<Name>/...` が変わるので、必須 Props にして呼び出し側から渡させる）
- **MV 専用に置くもの**: その MV の絵柄・歌詞・曲のタイミングを知っているもの
- **依存は MV専用 → 汎用 の一方向だけ**。`src/lib/` の中から `src/videos/` 配下を import しない
- **MV どうしも import し合わない**。`src/videos/<Name>/` から `src/videos/<別のMV>/` を参照しない。共有したくなったものは `src/lib/` に上げる
- 汎用パーツに固有の見た目を固定したいときは、**薄いラッパーを MV 側に作る**（`CharaBackground` が `SimpleBackground` を、`components/text/MeerkatSubtitle` が `lib/components/text/Subtitle` をラップしている形）
- ラッパーは**汎用パーツと同じ名前にしない**（`Subtitle` / `Telop` ではなく `MeerkatSubtitle` / `MeerkatTelop`）。同名だと import のたびに別名を付けることになり、どちらを見ているのか分からなくなる

## Composition の id

id は Studio の一覧とレンダーコマンドでそのまま使う名前なので、MV が増えても衝突しないよう **`MV-<作品名>-<尺>-<言語>`** で名前空間を切る（例: `MV-Meerkats-Full-Ja` / `MV-Meerkats-Short-En`）。

- Remotion は id に英数字・ハイフン・CJK しか許さない（`@remotion/valid-composition-and-folder-name`）。区切りはアンダースコアではなく**ハイフン**
- Studio の表示にもレンダーコマンドにも使われるのは id だけ。**Composition を登録するラッパーコンポーネントの名前はファイル名に合わせる**（`MusicVideoFull.tsx` なら `MusicVideoFullComposition`）。MV をまたいで同名になるが、`Root.tsx` が `import * as meerkat from "./videos/meerkat"` と名前空間で読むので衝突しない

## Sequence の名前とタイムラインの並び

Studio のタイムラインは `<Sequence>` の `name` をそのまま行の名前にする。**タイムラインに出る Sequence には必ず `name` を付ける**（無名だと `<Sequence>` とだけ表示され、どの行が何なのか分からない）。

- **名前の付け方**: セクションはファイル名と同じ連番名（`00_01_Intro`）、それ以外は役割が分かる短い名前（`BGM` / `Subtitle` / `PopUp` / `Hover`）。`TransitionRun` の項目名は React の key にもなるので、ひとつの並びの中で重複させない
- **まとめるためだけの入れ物には `layout="none"`** を付ける。DOM を足さないので出力が変わらない（`Subtitle` が歌詞行をまとめている形）
- **行の順番は JSX に置いた順番**。並べ替えたいときは JSX を入れ替える。ただし**後ろに置いたものが手前に描かれる**ので、順番を変えると絵の重なりも変わる。字幕は `Subtitle` 側が `zIndex: 1` で最前面に出るようにしてあるので、タイムラインでの並び優先で置いてよい
- **`map` で並べた Sequence は、Studio が「同じコード位置から作られた複製」とみなして1行にまとめる**（先頭の項目の名前だけが出て、残りは `+11` のように隠れる）。`TransitionRun` は項目ごとに違う `_remotionInternalStack` を渡してこれを外している。自分で `map` して Sequence を並べるときも同じ手当てが要る
- その印は**コードの位置として読めない文字列**にする（`TransitionRun item 01_01_Verse` のような形）。`:` を挟むと「ファイル名:行」として読まれ、Studio がそのソースを取りに行って失敗し、ブラウザのコンソールにエラーが出る
- Sequence を足す・並べ替えたときは、**出力が1フレームも変わっていないことを静止画で確認する**（次の節）

## テストとストーリーの置き場所

**`src/` に置くのは動画になるコードだけ。** Remotion の入口 `src/index.ts`（`registerRoot`）から
import で辿れるものが出力になる。テストとストーリーは辿られない検証の道具なので、
実装の隣にも `src/` の中にも置かず、**リポジトリルート直下**に出して
その下を **`src/` と同じ形にミラーする**。

| 実装                                   | テスト                                       | ストーリー                                         |
| -------------------------------------- | -------------------------------------------- | -------------------------------------------------- |
| `src/lib/components/text/Subtitle.tsx` | `tests/lib/components/text/Subtitle.test.ts` | `stories/lib/components/text/Subtitle.stories.tsx` |

- 実装フォルダに `.test.ts` / `.stories.tsx` が混ざらないので、MV のファイル一覧が読みやすい
- 対象の import は `tests/` からの相対パス（`tests/lib/components/text/` からは `../../../../src/lib/...`、`tests/videos/<Name>/compositions/` からは `../../../../src/videos/<Name>/...`）
- ストーリーは `src/lib/` 専用。MV の Composition は Remotion Studio（`npm run dev`）で見るので `src/videos/` のストーリーは作らない。詳しくは [`storybook.md`](./storybook.md)

## 既存 MV の出力を壊さない（リファクタ時の検証）

公開済みの Composition は、解像度・fps・数値・`durationInFrames` の式を変えない。
リファクタで出力が1フレームも変わらないことを Studio かレンダーで確認する。

検証は**静止画で取る**（mp4 はエンコードが run 間で bit 一致しない）。リファクタの前に撮っておき、あとで `cmp` で突き合わせる:

```console
npx remotion still <Composition の id> before.png --frame=1500 --image-format=png
```

- セクションの頭出しを変えるカットを触ったときは、そのセクションに当たるフレームを選ぶこと
- フレーム数の式は `npm test`（`tests/videos/<Name>/compositions/VideoDuration.test.ts`）でも固定してある
- 各 MV の「守るべき数値」は `docs/videos/<Name>.md` に書いてある（meerkat は [`meerkat.md`](../videos/meerkat.md)）
