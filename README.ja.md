# Remotion Music Video Studio (公開用)

[Remotion](https://www.remotion.dev/) によるミュージックビデオ制作環境。  
**1 リポジトリに複数の MV を並べる**構成で、MV 1 本分を `src/videos/<Name>/` に作成する。  
汎用的な部品はエンジン（`src/lib/`）にまとめ、は全 MV で共有する。

**解説記事：** [【Remotion】AIと協業できるコードベースのMV制作環境をつくる](https://elekibear.com/post/20260912_01_remotion_mv_studio)

## 動作環境

|         | バージョン                       | 備考                                                    |
| ------- | -------------------------------- | ------------------------------------------------------- |
| Node.js | **22.12 以上**（開発は 22.22.2） | 下限は Vite の要求。23 系だけは Vitest が対応していない |
| npm     | 10 以上（開発は 10.9.7）         | Node 22 に同梱のもので足りる                            |
| OS      | Windows / macOS / Linux          | 開発は Windows 11                                       |

そのほか:

- **ブラウザ**: レンダーには Chrome Headless Shell が要る。初回のレンダーで Remotion が自動で取得するので事前準備は不要（先に入れておくなら `npx remotion browser ensure`）。
- **FFmpeg**: Remotion に同梱されているので、別途インストールしなくてよい。
- **Java**（任意）: [README の図](#依存関係)を描き直すときだけ必要。動画を作るだけなら要らない。

## セットアップ

```console
# install
npm install

# スキルを追加する場合
npx remotion skills add
```

### 主な依存パッケージ

バージョンは `package.json` で固定してあるので `npm install` で揃う（Remotion 4.0.518 / React 19.2.3 / TypeScript 5.9.3）。

- `remotion` / `@remotion/cli` / `react` / `react-dom` — Remotion のテンプレートが入れてくれる土台
- `@remotion/google-fonts` / `@remotion/noise` — 書体の読み込みと、揺れのばらつき
- `vitest` / `jsdom` — 純粋関数のテスト
- `storybook` / `@storybook/react-vite` / `vite` / `@vitejs/plugin-react-swc` — `src/lib/` のパーツの単体確認
- `@remotion/player` — ストーリーを再生する台

何をどんな目的で足したかは [`docs/instructions/setup.md`](./docs/instructions/setup.md)。

## コマンド

| コマンド                  | 内容                                                               |
| ------------------------- | ------------------------------------------------------------------ |
| `npm run dev`             | Remotion Studio でプレビュー                                       |
| `npm run lint`            | `eslint src tests stories && tsc`。コードを変更したら必ず通す      |
| `npm test`                | `vitest run`。純粋関数・並びの計算のテスト（`tests/**/*.test.ts`） |
| `npm run build`           | `remotion bundle`（レンダー用のバンドルを書き出す）                |
| `npm run upgrade`         | Remotion 関連パッケージの更新                                      |
| `npm run storybook`       | Storybook で `src/lib/` のパーツを単体確認                         |
| `npm run build-storybook` | Storybook を `storybook-static/` に静的出力                        |

書き出しは Composition の id を指定してレンダーする:

```console
npx remotion render <Composition の id> out/video.mp4
```

## ドキュメント

| 文書                                                                               | いつ読むか                                                                                 |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [`docs/instructions/code_guide.md`](./docs/instructions/code_guide.md)             | コードを書くとき（命名・定数の切り方・テストの置き場所）                                   |
| [`docs/instructions/lib_guide.md`](./docs/instructions/lib_guide.md)               | 汎用パーツを使う・足すとき                                                                 |
| [`docs/instructions/transition_guide.md`](./docs/instructions/transition_guide.md) | 画の切り替えを触るとき                                                                     |
| [`docs/instructions/localization.md`](./docs/instructions/localization.md)         | 言語版を足す・歌詞 JSON を直すとき                                                         |
| [`docs/instructions/new_video.md`](./docs/instructions/new_video.md)               | 新しい MV を1本足すとき                                                                    |
| [`docs/instructions/storybook.md`](./docs/instructions/storybook.md)               | `src/lib/` のパーツを単体で確かめるとき                                                    |
| [`docs/instructions/setup.md`](./docs/instructions/setup.md)                       | 依存パッケージを足す・入れ替えるとき                                                       |
| [`docs/videos/meerkat.md`](./docs/videos/meerkat.md)                               | 収録している MV「きょろきょろミーアキャット / Looky Looky Meerkats」の秒・数値・固有の作り |

## 全体構成

**MV 1 本＝`src/videos/<Name>/` フォルダ 1 個**、アセットは `public/assets/<Name>/` に分ける。  
フォルダは「汎用（別の MV でも使える）」か「その MV 専用」かで分け、**依存は必ず MV 専用 → 汎用 の一方向。**

### 依存関係

<img src="./docs/readme/uml/architecture.png" alt="全体構成と依存関係" width="440">

矢印は参照の向き。太い矢印が守るべき決めごとで、**依存は MV 専用 → 汎用 の一方向**。  
`src/lib/` から `src/videos/` を import しないし、MV どうしも import し合わない。

MV の中は上から **完成品（`compositions/`）→ ショット（`sections/`）→ 素材（`components/`）** の3層で、上の層が下の層を使う。点線は値やパスを読むだけの参照。

Remotion の入口は `src/index.ts`（`registerRoot`）で、**そこから import で辿れるものが出力になる**。  
`tests/` と `stories/` は辿られない検証の道具なので、`src/` の外に置く（`docs/` は作法と MV ごとの記録で、コードからは参照されない）。

> 図の元データは [`docs/readme/uml/architecture.puml`](./docs/readme/uml/architecture.puml)。  
> 構成を変えたら PlantUML で描き直す:  
> `java -jar <path>/plantuml.jar -charset UTF-8 -tpng -Sdpi=192 -o ".." docs/readme/uml/architecture.puml`

### フォルダ構成

`<Name>` は MV 1 本ぶんの名前。リンク先は現在収録している `meerkat`。

| パス                                               | 中身                                                                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`src/lib/`](./src/lib)                            | 全 MV 共有の汎用エンジン。見た目パーツ・エフェクト・読み替えの作法（下の「[汎用エンジン](#汎用エンジンsrclib)」）                                |
| [`src/Root.tsx`](./src/Root.tsx)                   | 全 MV の Composition を `<Folder>` ごとに並べて登録する                                                                                          |
| [`src/videos/<Name>/`](./src/videos/meerkat)       | MV 1 本ぶんのコード一式。素材・ショット・完成品・歌詞・設定（下の「[MV固有](#mv固有srcvideosname)」）                                            |
| [`tests/`](./tests)                                | テスト。下を `src/` と同じ形にミラーする                                                                                                         |
| [`stories/`](./stories)                            | Storybook のストーリー（`src/lib/` 用）。下を `src/` と同じ形にミラーする                                                                        |
| [`docs/`](./docs)                                  | 作法（[`instructions/`](./docs/instructions)）・MV ごとの記録（[`videos/`](./docs/videos)）・README に貼る図と GIF（[`readme/`](./docs/readme)） |
| [`public/assets/<Name>/`](./public/assets/meerkat) | 音源（`audio/`）・画像（`images/`）・動画（`movie/`）。言語別は `audio/<lang>/`, `images/<lang>/`                                                |

Composition の id は `MV-<作品名>-<尺>-<言語>`。MV が増えても衝突しないよう作品名で名前空間を切る（Remotion は id に英数字・ハイフン・CJK しか許さないので、区切りはハイフン）。  
Studio では `src/Root.tsx` の `<Folder name="<Name>">` によって MV ごとにグルーピングされる。

`src/lib/` への相対パスは `sections/` `compositions/` からは `../../../lib/...`、1段深い `components/*/` からは `../../../../lib/...`。  
`tests/` `stories/` からは `src/` の外にいるぶん `../../../../src/lib/...` のように `src/` を挟む。

## MV固有（`src/videos/<Name>/`）

その MV でしか使わないコード。中は **素材（`components/`）→ ショット（`sections/`）→ 完成品（`compositions/`）** の3層で、上の層が下の層を使う。

| フォルダ                                                               | 中身                                                                                                                 |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [`index.ts`](./src/videos/meerkat/index.ts)                            | その MV の Composition 群を export（`Root.tsx` はここだけを読む）                                                    |
| [`components/`](./src/videos/meerkat/components)                       | 素材。その MV の見た目パーツ。`src/lib/components/` と対になる                                                       |
| [`components/characters/`](./src/videos/meerkat/components/characters) | キャラの見た目（`CharaBackground` / `CharaDance` / `CharaHover`）                                                    |
| [`components/text/`](./src/videos/meerkat/components/text)             | 字幕・テロップのラッパー（`MeerkatSubtitle` / `MeerkatTelop` / `FullVersionTelop`）                                  |
| [`sections/`](./src/videos/meerkat/sections)                           | 素材を組んだショット。曲の構成順に並ぶ（`00_01_Intro.tsx` …）                                                        |
| [`compositions/`](./src/videos/meerkat/compositions)                   | ショットを並べた完成品。日本語版（`MusicVideoFull.tsx` / `MusicVideoShort.tsx`）が実装本体で、他言語版は差分だけ持つ |
| [`data/subtitle/`](./src/videos/meerkat/data/subtitle)                 | 歌詞データ（言語別に `<lang>/Lyrics.json`）                                                                          |
| [`settings/`](./src/videos/meerkat/settings)                           | その MV の配色（`Theme.ts`）・アセットのパス（`Assets.ts`）のうち、2か所以上から参照するもの                         |

素材のフォルダを `components/` で受けているのは、`src/lib/components/` と対にするため。  
ラッパーはラップ先と**同じ名前のサブフォルダ**に置く（`lib/components/text/Subtitle` のラッパーは `videos/<Name>/components/text/`）。

```
src/lib/components/            background/  cuts/  transition/  text/
src/videos/<Name>/components/               characters/         text/
```

固有の見た目を固定したいときは、MV 側に薄いラッパーを作って汎用パーツに渡す（`CharaBackground` → `SimpleBackground`、`MeerkatSubtitle` → `Subtitle`）。

## 汎用エンジン（`src/lib/`）

全 MV で共有する部品。**曲・キャラ・作品名を知らない**ので、固有の値はすべて Props で渡す。  
画像・音源のパスだけは既定値を持たない（アセットが `assets/<Name>/...` に分かれているため、必須 Props）。

| フォルダ                                                    | 中身                                                     |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| [`components/`](./src/lib/components)                       | 単体で置ける見た目パーツ                                 |
| [`components/transition/`](./src/lib/components/transition) | 画の切り替え（境目の演出と、並びの繋ぎ方）               |
| [`effects/`](./src/lib/effects)                             | 見た目・音に効くヘルパー（値を返すもの／中身を包むもの） |
| [`units/`](./src/lib/units)                                 | 拍・秒・フレーム・画面比の読み替え                       |

### `components/` — 単体で置ける見た目パーツ

`<Sequence>` や `AbsoluteFill` の中にそのまま置く。役割で4つのサブフォルダに分かれる（[`background/`](./src/lib/components/background) / [`cuts/`](./src/lib/components/cuts) / [`transition/`](./src/lib/components/transition) / [`text/`](./src/lib/components/text)）。

<table>
<tr>
  <td width="33%" valign="top">
    <img src="./docs/readme/components/SimpleBackground.gif" alt="SimpleBackground" width="240"><br>
    <a href="./src/lib/components/background/SimpleBackground.tsx"><code>SimpleBackground</code></a><br>ベタ塗りに飾りをばらまいてゆっくり回す
  </td>
  <td width="33%" valign="top">
    <img src="./docs/readme/components/ImageCuts.gif" alt="ImageCuts" width="240"><br>
    <a href="./src/lib/components/cuts/ImageCuts.tsx"><code>ImageCuts</code></a><br>止め絵を順番に見せる
  </td>
  <td width="33%" valign="top">
    <img src="./docs/readme/components/MovieCut.gif" alt="MovieCut" width="240"><br>
    <a href="./src/lib/components/cuts/MovieCut.tsx"><code>MovieCut</code></a><br>動画を1カット再生する
  </td>
</tr>
<tr>
  <td width="33%" valign="top">
    <img src="./docs/readme/components/FrameAnimation.gif" alt="FrameAnimation" width="240"><br>
    <a href="./src/lib/components/cuts/FrameAnimation.tsx"><code>FrameAnimation</code></a><br>指定した間隔でコマを入れ替える
  </td>
  <td width="33%" valign="top">
    <img src="./docs/readme/components/CutoutStage.png" alt="CutoutStage" width="240"><br>
    <a href="./src/lib/components/cuts/FrameAnimation.tsx"><code>CutoutStage</code></a><br>切り抜き1枚を足元基準で置く
  </td>
  <td width="33%" valign="top">
    <img src="./docs/readme/components/Subtitle.gif" alt="Subtitle" width="240"><br>
    <a href="./src/lib/components/text/Subtitle.tsx"><code>Subtitle</code></a><br>歌詞をカラオケ塗り／行送りで出す字幕
  </td>
</tr>
<tr>
  <td width="33%" valign="top">
    <img src="./docs/readme/components/Telop.png" alt="Telop" width="240"><br>
    <a href="./src/lib/components/text/Telop.tsx"><code>Telop</code></a><br>画面に出す短い文言（縁取り・落ち影つき）
  </td>
  <td width="33%"></td>
  <td width="33%"></td>
</tr>
</table>

画に出ないものがひとつ。[`TextStyle`](./src/lib/components/text/TextStyle.ts)（コンポーネントではない）は字幕・テロップ共通の書体と縁取りで、import 時に `loadFont()` が走る。

セクションの基本の形は「カットの並びと境目の演出を宣言して `ImageCuts` に渡す」:

```tsx
// startSec だけで各カットの長さが決まる（次のカットが始まるまで）
const CUTS: ImageCut[] = [
  {
    src: "assets/<Name>/images/Art_10.png",
    startSec: 0,
    motion: { from: { scale: 1 }, to: { scale: 1.05 } },
  },
  {
    src: "assets/<Name>/images/Art_11.png",
    startSec: 3.2,
    // 境目の演出は「入ってくる側」のカットに書く
    transitionIn: { kinds: [TRANSITION_KINDS.FADE], durationSec: 0.6 },
    motion: { from: { scale: 1.1 }, to: { scale: 1.05 } },
  },
];

export const Solo = () => (
  // フェード中は下地が透けるので背景色を敷いておく
  <AbsoluteFill style={{ backgroundColor: FADE_BASE_COLOR }}>
    <ImageCuts cuts={CUTS} />
  </AbsoluteFill>
);
```

### トランジション — 画の切り替え

**並びを繋ぐエンジンは [`TransitionRun`](./src/lib/components/transition/TransitionRun.tsx) の1か所だけ**で、セクションの並びもカットの並びもこれを通る（[`ImageCuts`](./src/lib/components/cuts/ImageCuts.tsx) は `ImageCut[]` を `TransitionRun` の項目に詰め替えるだけの薄い層）。  
並びを作るときに [`TransitionLayer`](./src/lib/components/transition/Transition.tsx) を直に使わないこと。

<table>
<tr>
  <td width="33%" valign="top">
    <img src="./docs/readme/transition/Transition-None.png" alt="NONE" width="240"><br>
    <code>NONE</code><br>演出なし
  </td>
  <td width="33%" valign="top">
    <img src="./docs/readme/transition/Transition-Fade.gif" alt="FADE" width="240"><br>
    <code>FADE</code><br>明るさで溶かす
  </td>
  <td width="33%" valign="top">
    <img src="./docs/readme/transition/Transition-Blur.gif" alt="BLUR" width="240"><br>
    <code>BLUR</code><br>ぼかす
  </td>
</tr>
<tr>
  <td width="33%" valign="top">
    <img src="./docs/readme/transition/Transition-SlideLeft.gif" alt="SLIDE_LEFT" width="240"><br>
    <code>SLIDE_LEFT</code><br>左へ流す
  </td>
  <td width="33%" valign="top">
    <img src="./docs/readme/transition/Transition-SlideRight.gif" alt="SLIDE_RIGHT" width="240"><br>
    <code>SLIDE_RIGHT</code><br>右へ流す
  </td>
  <td width="33%" valign="top">
    <img src="./docs/readme/transition/Transition-SlideUp.gif" alt="SLIDE_UP" width="240"><br>
    <code>SLIDE_UP</code><br>上へ流す
  </td>
</tr>
<tr>
  <td width="33%" valign="top">
    <img src="./docs/readme/transition/Transition-SlideDown.gif" alt="SLIDE_DOWN" width="240"><br>
    <code>SLIDE_DOWN</code><br>下へ流す
  </td>
  <td width="33%" valign="top">
    <img src="./docs/readme/transition/Transition-ZoomIn.gif" alt="ZOOM_IN" width="240"><br>
    <code>ZOOM_IN</code><br>寄りながら切り替える
  </td>
  <td width="33%" valign="top">
    <img src="./docs/readme/transition/Transition-ZoomOut.gif" alt="ZOOM_OUT" width="240"><br>
    <code>ZOOM_OUT</code><br>引きながら切り替える
  </td>
</tr>
<tr>
  <td width="33%" valign="top">
    <img src="./docs/readme/transition/Transition-FadeWithSlide.gif" alt="FADE + SLIDE_LEFT" width="240"><br>
    <code>FADE + SLIDE_LEFT</code><br>重ねがけ（溶かしながら左へ流す）
  </td>
  <td width="33%" valign="top">
    <img src="./docs/readme/transition/Transition-BlurWithZoom.gif" alt="BLUR + ZOOM_IN" width="240"><br>
    <code>BLUR + ZOOM_IN</code><br>重ねがけ（ぼかしながら寄る）
  </td>
  <td width="33%"></td>
</tr>
</table>

調整値（省略時）は `BLUR` が `blurPx`（30）、`SLIDE_*` が `slideRatio`（1 = 画面1枚ぶん）、`ZOOM_*` が `zoomAmount`（0.25）。種類の定義は [`Transition.tsx`](./src/lib/components/transition/Transition.tsx)。

<table>
<tr>
  <td width="33%" valign="top">
    <img src="./docs/readme/transition/TransitionRun-CrossDissolve.gif" alt="CROSS_DISSOLVE" width="240"><br>
    <code>CROSS_DISSOLVE</code><br>前後の両方がフェードする（sRGB 合成）
  </td>
  <td width="33%" valign="top">
    <img src="./docs/readme/transition/TransitionRun-LinearOverUnder.gif" alt="LINEAR_OVER_UNDER" width="240"><br>
    <code>LINEAR_OVER_UNDER</code><br>入る側だけフェードする（リニア空間合成）
  </td>
  <td width="33%"></td>
</tr>
</table>

**`transitionIn` は「その項目がどう入ってくるか」= その項目の _手前_ の境目**。  
N個の項目には境目が N-1 個あるので、`items[1]` 以降に書く（書かなければバツン切り替え）:

```tsx
<TransitionRun
  items={[
    { name: "A", startSec: 0, element: <A /> }, // 先頭 : 入りなし
    {
      name: "B",
      startSec: 2,
      // A → B の境目。durationSec は「前後がどれだけ重なるか」でもある
      transitionIn: { kinds: [TRANSITION_KINDS.FADE], durationSec: 0.6 },
      element: <B />,
    },
    {
      name: "C",
      startSec: 4.5,
      // B → C の境目（違う演出でよい）
      transitionIn: { kinds: [TRANSITION_KINDS.SLIDE_LEFT], durationSec: 0.4 },
      element: <C />,
    },
  ]}
  endSec={endSec}
  blend={TRANSITION_BLENDS.CROSS_DISSOLVE}
/>
```

止め絵の並びは `ImageCuts`、それ以外（セクション・キャラ・動画などの並び）は `TransitionRun` を直に使う。  
Storybook（`npm run storybook`）なら `slideRatio` や `blurPx` を触りながら確かめられる。

### `effects/` — 値を返すもの / 中身を包むもの

呼び方で2つに分かれる。**新しくエフェクトを足すときは、どちらかに寄せる。**

#### 値を返すもの（[`functions/`](./src/lib/effects/functions)）

`foo(必須引数..., options?)`。純粋関数なので、`<Html5Audio volume={(frame) => ...}>` のような**レンダー中でない場所からも呼べる**（フレームは引数で受け取る）。

<table>
<tr>
  <td width="33%" valign="top">
    <img src="./docs/readme/effects/LoopMotionEffect.gif" alt="loopMotionEffect" width="240"><br>
    <a href="./src/lib/effects/functions/LoopMotionEffect.ts"><code>loopMotionEffect</code></a><br>揺らす・跳ねる・回すの土台になるサイン波
  </td>
  <td width="33%" valign="top">
    <img src="./docs/readme/effects/AudioFadeEffect.gif" alt="fadeOutVolume" width="240"><br>
    <a href="./src/lib/effects/functions/AudioFadeEffect.ts"><code>fadeOutVolume</code></a><br>終わりでフェードアウトする音量
  </td>
  <td width="33%" valign="top">
    <img src="./docs/readme/effects/DropShadowEffect.png" alt="dropShadowEffect" width="240"><br>
    <a href="./src/lib/effects/functions/DropShadowEffect.ts"><code>dropShadowEffect</code></a><br>透過画像の輪郭に沿う落ち影
  </td>
</tr>
<tr>
  <td width="33%" valign="top">
    <img src="./docs/readme/effects/BounceEffect.gif" alt="bounceEffect" width="240"><br>
    <a href="./src/lib/effects/functions/BounceEffect.ts"><code>bounceEffect</code></a><br>一度だけ跳ねて元へ戻る変形
  </td>
  <td width="33%" valign="top">
    <img src="./docs/readme/effects/PopInEffect.gif" alt="usePopIn" width="240"><br>
    <a href="./src/lib/effects/functions/PopInEffect.ts"><code>usePopIn</code></a><br>バネで飛び出す登場の進み具合
  </td>
  <td width="33%" valign="top">
    <img src="./docs/readme/effects/ShakeEffect.gif" alt="useShake" width="240"><br>
    <a href="./src/lib/effects/functions/ShakeEffect.ts"><code>useShake</code></a><br>頭で大きく、すぐ収まる揺れ
  </td>
</tr>
</table>

#### 中身を包むもの（[`wrappers/`](./src/lib/effects/wrappers)）

`<XxxEffect>{children}</XxxEffect>`。値では表せないもの（過去フレームの描き直し・SVG フィルタの `<defs>`）がここに来る。

<table>
<tr>
  <td width="33%" valign="top">
    <img src="./docs/readme/effects/WiggleEffect.gif" alt="WiggleEffect" width="240"><br>
    <a href="./src/lib/effects/wrappers/WiggleEffect.tsx"><code>WiggleEffect</code></a><br>置いた場所で回転・移動・伸縮を繰り返す
  </td>
  <td width="33%" valign="top">
    <img src="./docs/readme/effects/MotionBlurEffect.gif" alt="MotionBlurEffect" width="240"><br>
    <a href="./src/lib/effects/wrappers/MotionBlurEffect.tsx"><code>MotionBlurEffect</code></a><br>過去フレームを薄く重ねて尾を引かせる
  </td>
  <td width="33%" valign="top">
    <img src="./docs/readme/effects/NightGlowEffect.gif" alt="NightGlowEffect" width="240"><br>
    <a href="./src/lib/effects/wrappers/NightGlowEffect.tsx"><code>NightGlowEffect</code></a><br>暗く落として白いところだけ光らせる
  </td>
</tr>
<tr>
  <td width="33%" valign="top">
    <img src="./docs/readme/effects/FloatEffect.gif" alt="FloatEffect" width="240"><br>
    <a href="./src/lib/effects/wrappers/FloatEffect.tsx"><code>FloatEffect</code></a><br>上下に漂わせながら左右に傾ける
  </td>
  <td width="33%" valign="top">
    <img src="./docs/readme/effects/GlitchEffect.gif" alt="GlitchEffect" width="240"><br>
    <a href="./src/lib/effects/wrappers/GlitchEffect.tsx"><code>GlitchEffect</code></a><br>帯をずらし、色をずらす
  </td>
  <td width="33%"></td>
</tr>
</table>

```tsx
// 値を返すもの : コールバックの中から（フックを呼ばないので使える）
<Html5Audio
  src={staticFile(audioSrc)}
  volume={(frame) => fadeOutVolume(frame, audioFrames, fadeOutFrames)}
/>;

// 値を返すもの : レンダーの中では薄いフックを使う。返るのは「そのフレームの値」だけ
const enter = usePopIn();
<AbsoluteFill style={{ opacity: enter }}>…</AbsoluteFill>;

// 中身を包むもの : 中身をそのまま包む。位置・大きさは style で渡す
<WiggleEffect rotateDeg={1.5} rotateSec={2.4} style={{ maxWidth: "70%" }}>
  <MeerkatTelop text={text} fontSize={fontSize} />
</WiggleEffect>;
```

調整値の束はどれも `<名前>Options`（`DropShadowOptions`, `MotionBlurOptions`, …）として export してあるので、カットやキャラのデータ側から `shadow={{ alpha: 0.2 }}` のようにそのまま渡せる。

> 画像を撮り直すときは、キャプチャ専用の入口（[`docs/readme/capture/`](./docs/readme/capture)）から Composition の id を指定してレンダーする（[`components/`](./docs/readme/components) [`transition/`](./docs/readme/transition) [`effects/`](./docs/readme/effects) とも同じ撮り方。  
> GIF は 320x180・15fps、点数の多いトランジションだけ 10fps（`--every-nth-frame=3`）、静止画は `remotion still` で 480x270）。  
> 撮ったあと ffmpeg でパレットを組み直すと3割ほど軽くなる（別名に書き出してから置き換える）:
>
> ```console
> npx remotion render docs/readme/capture/index.ts <id> docs/readme/<種類>/<id>.gif --codec=gif --every-nth-frame=2 --scale=0.5
> npx remotion ffmpeg -i docs/readme/<種類>/<id>.gif -filter_complex "split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" -loop 0 <一時ファイル>.gif
> ```

### `units/` — 拍・秒・フレーム・画面比の読み替え

```tsx
const toFrame = useSecToFrame();
// 区間の長さは「両端をそれぞれ丸めてから差を取る」
// （長さを先に丸めると誤差が積もってセクション間に隙間・重なりが出る）
const from = toFrame(section.startSec);
const durationInFrames = toFrame(endSec) - from + overlapFrames;

// 画面高さ基準の比率を短辺基準に読み替える（縦動画のはみ出し対策。横動画では 1）
const fontSize = height * SUBTITLE_FONT_SIZE_RATIO * useShortSideScale();
```

---

各パーツの Props・呼び出し側の責任・作法とより多くの使用例は [`docs/instructions/lib_guide.md`](./docs/instructions/lib_guide.md)、画の切り替えの詳細は [`docs/instructions/transition_guide.md`](./docs/instructions/transition_guide.md) を参照。
