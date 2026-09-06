# 汎用エンジン（`src/lib/`）の使い方

全 MV で共有する部品。**曲・キャラ・作品名を知らない**ので、固有の値はすべて Props で渡す。
画像・音源のパスだけは既定値を持たない（アセットが `assets/<Name>/...` に分かれているため、必須 Props）。

中身は3つ:

| フォルダ      | 何か                                                   |
| ------------- | ------------------------------------------------------ |
| `components/` | 単体で置ける見た目パーツ                               |
| `effects/`    | 見た目・音に効く汎用ヘルパー（値を返すもの／包むもの） |
| `units/`      | 拍・秒・フレーム・画面比を別の基準へ読み替える作法     |

トランジション（`components/transition/`）だけは分量があるので
[`transition_guide.md`](./transition_guide.md) に分けてある。

コード例に出てくる `assets/meerkat/...` や `MeerkatSubtitle` は既存 MV の実例。
自分の MV では `assets/<Name>/...` と自分のラッパーに読み替える。

## `components/` — 単体で置ける見た目パーツ

`<Sequence>` や `AbsoluteFill` の中にそのまま置く。呼び出し側は「何をどこに出すか」だけ決める。
役割で `background/` / `cuts/` / `transition/` / `text/` の4つのサブフォルダに分かれる。

| パーツ                                       | 何を出すか                                                                                               | 呼び出し側の責任                                                                                                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SimpleBackground`                           | ベタ塗り＋飾りをばらまいてゆっくり回す背景                                                               | `propSrc`（飾り画像）は**必須**。色・大きさ・回転速度は Props で上書き                                                                                                     |
| `ImageCuts`                                  | 止め絵を順番に見せる Sequence 群                                                                         | `cuts[].startSec` だけで各カットの長さが決まる。境目の演出は入ってくる側の `cuts[].transitionIn` に書く。`ImageCut` の組み立ては MV 側の関数（[ルール3](./code_guide.md)） |
| `MovieCut`                                   | 動画を1カット再生する（グリーンバック抜きは既定で入る）                                                  | `durationSec` に素材の尺を渡す（Sequence が長ければこの尺で繰り返す）。緑を抜かない動画は `chromaKey={null}`                                                               |
| `FrameAnimation`                             | コマを順に切り替えて動かす切り抜き1体                                                                    | 「いつどのコマを出すか」だけ持つ。送る速さは秒（`frameInSeconds`）でも曲の拍（`tempo`）でも渡せる。切り替わりの見せ方は `motion` / `effect` で差し込む                     |
| `CutoutStage`（`FrameAnimation.tsx` に同居） | 切り抜き1枚を足元基準で置く台。コマ送りしないときはこちら                                                | `transform` を CSS 文字列で渡す                                                                                                                                            |
| `TransitionLayer`（`Transition.tsx`）        | 中身の頭と尻に**1つ分**の切り替え演出（`TRANSITION_KINDS`）をかけるラッパー                              | 重なる長さは呼び出し側が Sequence を伸ばして作る                                                                                                                           |
| `TransitionRun`                              | 秒で並べたものを**境目のトランジションで繋いで**並べる。頭出し・重なり・前後のペアリング・合成方式を持つ | 並び（`items`）と終わり（`endSec`）・合成方式（`blend`）を渡す。重なりの尺が要る中身は、その中で `useTransitionSlot()` を読む                                              |
| `Subtitle`                                   | 歌詞（`LyricsData`）をカラオケ／行送りで出す字幕                                                         | 歌詞データと配色は MV 側のラッパーから渡す                                                                                                                                 |
| `Telop`                                      | 画面に出す短い文言。縁取り・落ち影・折り返しの作法だけを持つ                                             | どこに置くか・どう出すかは `style` で渡す                                                                                                                                  |
| `TextStyle`（コンポーネントではない）        | 字幕とテロップで共通の文字の見た目（`ROUNDED_FONT_FAMILY` / `textOutlineStyle` / `TEXT_SHADOW`）         | import した時点で `loadFont()` が走る（副作用）                                                                                                                            |

### 使い方の例

**`SimpleBackground`** — 見た目を固定した薄いラッパーを MV 側に作る（`components/characters/CharaBackground.tsx`）:

```tsx
export const CharaBackground = () => {
  // 飾りの大きさは画面高さ基準なので、縦動画では短辺基準に読み替える
  const shortSideScale = useShortSideScale();

  return (
    <SimpleBackground
      backgroundColor="#FD94AC"
      // 画像パスは汎用側に既定値がないので必ず渡す
      propSrc="assets/meerkat/images/Prop_01.png"
      seed="meerkat-prop"
      propSizeRatioMin={0.15 * shortSideScale}
      propSizeRatioMax={0.25 * shortSideScale}
      propOpacity={0.95}
    />
  );
};
```

**`ImageCuts`** — カットの並びと、境目の演出を渡す。これがセクションの基本の形（`sections/03_01_Solo.tsx`）:

```tsx
// startSec だけで各カットの長さが決まる（次のカットが始まるまで）
const CUTS: ImageCut[] = [
  {
    src: "assets/meerkat/images/Art_10.png",
    startSec: 0,
    motion: { from: { scale: 1 }, to: { scale: 1.05 } },
  },
  {
    src: "assets/meerkat/images/Art_11.png",
    startSec: 3.2,
    // 境目の演出は「入ってくる側」のカットに書く（先頭のカットには書かない）
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

同じ形のカットが並ぶときは、違うところだけを引数に取る組み立て関数にする
（[ルール3](./code_guide.md)。`01_02_PreChorus.tsx` の `buildCheckCut(startSec, moveDirection)` が実例）。

**`FrameAnimation`** — 切り替わりの見せ方は effects を差し込む（`components/characters/CharaDance.tsx`）:

```tsx
<FrameAnimation
  frames={DANCE_FRAMES}
  // いつどのコマを出すか。省略すると frameInSeconds ごとの繰り返しになる
  poses={poses}
  heightRatio={heightRatio}
  bottomRatio={CHARA_BOTTOM_RATIO}
  shadow={{ alpha: 0.2 }}
  // 変形は A. 値を返すもの（progress / sizePx はコンポーネントから渡ってくる）
  motion={({ progress, sizePx }) => bounceEffect(progress, sizePx)}
  // 絵にかけるものは B. 中身を包むもの。いま出ているコマの絵を受け取って包む
  effect={(image) => <GlitchEffect>{image}</GlitchEffect>}
/>
```

送る速さは秒でも曲の拍でも書ける。曲に合わせるものは拍で書いておくと、
テンポを変えるときに BPM だけ差し替えられる:

```tsx
// 秒で送る（省略時 0.35 秒ごと）
<FrameAnimation frames={DANCE_FRAMES} frameInSeconds={0.3} />

// 拍で送る（tempo は frameInSeconds より優先。beats: 0.5 で裏拍も送る）
<FrameAnimation frames={DANCE_FRAMES} tempo={{ bpm: 150, beats: 0.5 }} />

// コマ割りそのものを拍で書く（間隔は「ひとつ前のコマから何拍後か」）
const POSES = toBeatAnimationPoses(
  [
    { offsetBeats: 0, src: MIHARI },
    { offsetBeats: 1, src: MIHARI, flipped: true },
    { offsetBeats: 0.5, src: FRONT, withEffect: true },
  ],
  150,
);
```

**`CutoutStage`** — コマ送りしない切り抜き1枚（`sections/00_01_Intro.tsx`）:

```tsx
<CutoutStage
  src={CHARA_IMAGES.FRONT}
  heightRatio={heightRatio}
  // 足元の余白は CharaDance と同じにする（そろえないと切り替わりで飛ぶ）
  bottomRatio={CHARA_BOTTOM_RATIO}
  // 足元を軸にして、地面から生えてくるように動かす
  transformOrigin="bottom center"
  transform={`translateY(${translateY}px)`}
  shadow={{ alpha: 0.25 }}
/>
```

**`MovieCut`** — `durationSec` は素材の尺（`sections/03_02_Chorus.tsx`）:

```tsx
<MovieCut
  src="assets/meerkat/movie/AS_Char_01_Dance_01.mp4"
  // 素材尺。置かれた Sequence のほうが長ければ、この長さで区切って繰り返す
  durationSec={5.16}
  speed={0.925}
/>
```

グリーンバック抜きは既定で入る。抜き具合は `chromaKey` で上書きし、**緑を抜く必要のない動画は
`chromaKey={null}`** にする（抜きのフィルタごと外れる）:

```tsx
// 抜き残しが出るときは threshold を下げる
<MovieCut src={src} durationSec={5.16} chromaKey={{ threshold: 0.03 }} />

// グリーンバックでない素材（実写・すでに透過している動画）
<MovieCut src={src} durationSec={5.16} chromaKey={null} />
```

**`Subtitle` / `Telop`** — 歌詞・配色は MV 側のラッパーで固定する（`components/text/MeerkatSubtitle.tsx`）:

```tsx
// ラッパー側 : 曲と配色を知っているのは MV 側だけ
<Subtitle
  lyrics={lyrics ?? JA_LYRICS}
  mode={mode}
  fontSizeRatio={SUBTITLE_FONT_SIZE_RATIO * shortSideScale}
  baseColor="#ffffff"
  sungColor="#ffd45e"
  strokeColor={OUTLINE_BROWN}
/>;

// 使う側 : 汎用パーツと同名にしていないので、別名 import が要らない
<MeerkatSubtitle
  mode={SUBTITLE_MODES.KARAOKE}
  offsetInSeconds={1.2}
  lyrics={lyrics}
/>;

// Telop は文字の見た目しか持たない。置き場所・登場の動きは style で渡す
<MeerkatTelop
  text={text}
  fontSize={fontSize}
  style={{ textAlign: "center", lineHeight: 1.3 }}
/>;
```

### 作法

- **種類分けは `as const` の定数オブジェクト経由で比較する**（[ルール2](./code_guide.md)）。`IMAGE_CUT_KINDS` / `TRANSITION_KINDS` / `SUBTITLE_MODES` / `TELOP_WRAPS`
- **画像・音源のパスに既定値を持たせない**。`SimpleBackground` の `propSrc` のように必須 Props にする
- **MV 側で固有の見た目を固定したいときは薄いラッパーを作る**（`CharaBackground` / `MeerkatSubtitle` / `MeerkatTelop`）。汎用パーツと**同じ名前にしない**
- **1画面に2つ置きうる SVG フィルタの id は値から組み立てる**（`MovieCut` / `NightGlowEffect`）。固定 id にすると先に定義したほうだけが効く
- **並びをトランジションで繋ぐときは `TransitionRun` を使う**。頭出し・重なりを自分で計算しない（丸め順序の作法がそこにしかない）
- **境目の演出は「入ってくる側」の項目の `transitionIn` に書く**（`SECTIONS` も `ImageCut` も同じ形）。境目ごとの並列配列は持たない — 項目を1つ挿すと以降が全部ずれ、型エラーにもならないため
- **同じ画面に重ねる `ImageCuts` どうしは `blend` をそろえる**。リニア合成の器（SVG フィルタの往復）の有無で絵の明るさが変わる（実測で最大 20/255）
- **`@remotion/google-fonts` の副作用に注意**。`components/text/TextStyle.ts` が import 時に `loadFont()` を呼ぶ。`Subtitle` / `Telop` はどちらもこれを import しているので、字幕かテロップが1つでも出ていれば読み込まれる。別の書体を使う MV では `TextStyle` に倣って、その MV 側で `loadFont` するモジュールを作る

## `effects/` — 使い方で2カテゴリ

`effects/` はサブフォルダが「**値を返すもの**」の `functions/` と「**中身を包むもの**」の `wrappers/` の2つ。
**新しくエフェクトを足すときは、どちらかに寄せる。**

| カテゴリ                         | 呼び方                              | 中身                                                                                                       |
| -------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `functions/`（A. 値を返すもの）  | `foo(必須引数..., options?)`        | `dropShadowEffect` / `bounceEffect` / `fadeOutVolume` / `loopMotionEffect` / `popInEffect` / `shakeEffect` |
| `wrappers/`（B. 中身を包むもの） | `<XxxEffect>{children}</XxxEffect>` | `WiggleEffect` / `MotionBlurEffect` / `NightGlowEffect` / `FloatEffect` / `GlitchEffect`                   |

2つに分かれるのは好みではなく、次の2軸が効くため。ここから外れる置き方はできない:

|                                          | 値を返す        | DOM を出す        |
| ---------------------------------------- | --------------- | ----------------- |
| **フックを呼べない**（コールバックの中） | A. 値を返すもの | 不可              |
| **フックを呼べる**（レンダーの中）       | A. 値を返すもの | B. 中身を包むもの |

- 値を返すものを**純粋関数として書く**のは、`<Html5Audio volume={(frame) => ...}>` や
  `FrameAnimation` の `motion={({ progress }) => ...}` のように、**レンダー中でない場所から呼ばれる**から。
  フックにした瞬間 React のルール違反になる（だからフレームは引数で受け取る）
- 一方 `MotionBlurEffect` は children を過去フレームで描き直し、`NightGlowEffect` は SVG フィルタの
  `<defs>` を吐くので、**値では表せない**。ここがコンポーネントである理由

### A. 値を返すもの（`functions/`） — `foo(必須引数..., options?)`。フレームが要るものは `use〜` も添える

| ファイル                        | 純粋関数                                           | フック     | 返すもの                                          |
| ------------------------------- | -------------------------------------------------- | ---------- | ------------------------------------------------- |
| `functions/LoopMotionEffect.ts` | `loopMotionEffect.{oscillate, bump, spinAngleDeg}` | —          | 数値（サイン波の土台）                            |
| `functions/AudioFadeEffect.ts`  | `fadeOutVolume`                                    | —          | そのフレームの音量                                |
| `functions/DropShadowEffect.ts` | `dropShadowEffect`                                 | —          | `drop-shadow(...)` の filter 文字列               |
| `functions/BounceEffect.ts`     | `bounceEffect`                                     | —          | 跳ねる transform 文字列                           |
| `functions/PopInEffect.ts`      | `popInEffect(frame, fps, options?)`                | `usePopIn` | バネの進み具合（0 → 1、途中で 1 を行き過ぎる）    |
| `functions/ShakeEffect.ts`      | `shakeEffect(frame, fps, options?)`                | `useShake` | `ShakeValue`（`x` / `y` / `rotate` / `overscan`） |

```tsx
// 中でフックを呼ばないので、コールバックの中からも呼べる
<Html5Audio
  src={staticFile(audioSrc)}
  volume={(frame) => fadeOutVolume(frame, audioFrames, fadeOutFrames)}
/>;

// FrameAnimation の motion（progress / sizePx はコンポーネントから渡ってくる）
motion={({ progress, sizePx }) => bounceEffect(progress, sizePx)}

// 経過秒は呼び出し側で作って渡す
const elapsedSec = frame / fps;
const rotation =
  prop.angle +
  loopMotionEffect.spinAngleDeg(elapsedSec, prop.rotationSec, prop.direction);

// 任意の調整値は最後の options 引数にまとめる
filter: dropShadowEffect(size, { alpha: 0.2 });
```

フレームが要るものは、レンダーの中から呼ぶための薄いフックを**同じファイルで**export する:

```tsx
// 既定のバネ（0.5 秒）。返るのは進み具合だけで、どう動かすかは呼び出し側が決める
const enter = usePopIn();
<AbsoluteFill style={{ opacity: enter }}>
  <MeerkatTelop
    text={text}
    fontSize={fontSize}
    style={{
      transform: `translateY(${interpolate(enter, [0, 1], [80, 0])}px)`,
    }}
  />
</AbsoluteFill>;

// バネの効きを変えたいときだけ options を渡す
const rise = usePopIn({ durationSec: POP_UP_SEC, damping: 11, mass: 0.6 });

// useShake は options を渡さなければ揺れない（= 効果なし）
const shake = useShake(cut.shake ? { ...cut.shake, seed: cut.src } : undefined);
return {
  // overscan は掛け算、x / y は足し算、rotate は加算で重ねる
  scale: base.scale * shake.overscan,
  translateX: base.translateX + shake.x,
  rotate: shake.rotate + swingRotate,
};
```

- フレーム・進み具合は**引数で受け取る**（中でフックを呼ばない）。だから `Audio` の `volume` コールバックや `FrameAnimation` の `motion` からも呼べる
- 任意の調整値は**最後の `options` 引数**にまとめ、中で `options.x ?? 既定値`。ここだけ分割代入にしないのは、JSDoc の `@param options` が `@param param2` になってしまうため
- **フックは中身を持たない**。`usePopIn` / `useShake` は `popInEffect(useCurrentFrame(), useVideoConfig().fps, options)` を呼ぶだけの1行にする。計算が純粋関数側にあるので `tests/lib/effects/functions/` で単体テストが書ける（`npm test`）
- 名前は、純粋関数が**ファイル名から先頭を小文字にしたもの**（`ShakeEffect.ts` → `shakeEffect`）、フックが `use` ＋ ファイル名から `Effect` を取ったもの（→ `useShake`）
- options 全体を省略で「効果なし」にする場合は早期 return（`shakeEffect`）
- `loopMotionEffect` だけ名前空間オブジェクトなのは、`oscillate` / `bump` が単体だと出どころの分からない名前だから

### B. 中身を包むもの（`wrappers/`） — `<XxxEffect>{children}</XxxEffect>`

| ファイル                        | export                                   | 包み方                                                                   |
| ------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `wrappers/WiggleEffect.tsx`     | `WiggleEffect` / `WiggleOptions`         | `<div style>`（置いた場所で揺らす）                                      |
| `wrappers/MotionBlurEffect.tsx` | `MotionBlurEffect` / `MotionBlurOptions` | `<AbsoluteFill style>`（重ねて描く）                                     |
| `wrappers/NightGlowEffect.tsx`  | `NightGlowEffect` / `NightGlowOptions`   | `<AbsoluteFill>`（全画面フィルタ）                                       |
| `wrappers/FloatEffect.tsx`      | `FloatEffect` / `FloatOptions`           | 自分で `AbsoluteFill` 中央寄せするので、そのまま置く                     |
| `wrappers/GlitchEffect.tsx`     | `GlitchEffect` / `GlitchOptions`         | 複製を絶対配置で重ねる。呼び出し側が `position: relative` の箱を用意する |

```tsx
// 位置・大きさは style で渡す（transform はラッパーが上書きするので書かない）
<WiggleEffect
  rotateDeg={1.5}
  rotateSec={2.4}
  offsetPx={[0, 6]}
  scaleAmount={0.03}
  style={{ maxWidth: "70%" }}
>
  <MeerkatTelop text={text} fontSize={fontSize} />
</WiggleEffect>;

// 中身をそのまま包むだけ。durationSec を過ぎたら元の明るさへ戻る
<NightGlowEffect durationSec={CHORUS_DANCE_SEC}>
  <Chorus />
</NightGlowEffect>;

// MotionBlurEffect : 動きの計算は必ず children のコンポーネントの中で行う
<MotionBlurEffect layers={15} frameOffset={2} opacity={0.1}>
  {/* ↓ この中で useCurrentFrame を見る */}
  <FloatBox sizePx={sizePx}>{children}</FloatBox>
</MotionBlurEffect>;

// FloatEffect : そのまま置くだけ。他エフェクトの Options をそのまま受け取れる。
// 中身は 1辺 sizePx の箱いっぱいに広がるよう置かれる
<FloatEffect
  sizePx={size}
  baseTiltDeg={22.5}
  scale={1.6}
  shadow={{ alpha: 0.2 }} // DropShadowOptions
  blur={{ layers: 15, frameOffset: 2, opacity: 0.1 }} // MotionBlurOptions
>
  <Img
    src={staticFile(CHARA_IMAGES.HOVER)}
    style={{ width: "100%", height: "100%" }}
  />
</FloatEffect>;

// GlitchEffect : 中身をそのまま出したうえに、色ずれと横帯の複製を重ねる。
// ずらし量は箱の幅に対する % なので、大きさを渡さなくてよい
<div style={{ position: "relative", width: size, height: size }}>
  <GlitchEffect>
    <Img src={staticFile(src)} style={{ width: "100%", height: "100%" }} />
  </GlitchEffect>
</div>;
```

- **エフェクト側で `Img` を出さない**。「この絵に掛ける」ものでも children で受け取れば、
  曲・キャラを知らないまま任意の中身に掛けられる（`GlitchEffect` から `src` / `sizePx` が消えたのはこのため）
- **大きさは可能なかぎり `%` で持つ**。`translateX` の `%` は要素自身の幅に解決されるので、
  px を受け取らなくても比率どおりにずらせる（`GlitchEffect`）。
  `FloatEffect` だけ `sizePx` が要るのは、`dropShadowEffect` が px を要るから
- **`MotionBlurEffect` の children では、動きの計算を必ず children のコンポーネントの中で行う**。残像は children を過去フレームで描き直して作るので、外で計算した transform を埋めた要素を渡すと残像が全部重なって何も起きない（`FloatEffect` が内側に `FloatBox` を切っているのはこのため）

### 両カテゴリ共通の作法

- **調整値の束は `<名前>Options` として `export` する**（型名に `Effect` は入れない）。`BounceOptions` / `DropShadowOptions` / `MotionBlurOptions` / `PopInOptions` / `ShakeOptions` / `WiggleOptions` / `NightGlowOptions` / `FloatOptions` / `GlitchOptions`。Props は `<名前>Options & { 必須のもの }` の形にする
  - こうしておくと、カットやキャラのデータ側から `shadow={{ alpha: 0.2 }}` `blur={{ layers: 15 }}` のように渡せる（`ImageCut.shake` / `FrameAnimation.shadow` / `FloatEffect.blur` がこの形）
- **ファイル名 ↔ export 名をそろえる**。`GlitchEffect.tsx` → `GlitchEffect`、`ShakeEffect.ts` → `shakeEffect` / `useShake`
- ばらつきの種（`seed`）を持つものは、**1画面に2つ置いても同じ動きにならないよう Props で差し替えられる**ようにする（`GlitchOptions.seed` / `ShakeOptions.seed`）

## `units/` — 拍・秒・フレーム・画面比の読み替え

エフェクトではなく「どの基準で数えるか」の読み替えなので `effects/` とは分ける。
拍・秒・フレームという時間の基準と、画面高さ・短辺という大きさの基準の2種類が入る。

```tsx
const toFrame = useSecToFrame();
// 区間の長さは「両端をそれぞれ丸めてから差を取る」。
// 長さのほうを先に丸めると誤差が積もって、セクション間に隙間や重なりが出る
const from = toFrame(section.startSec);
const durationInFrames = toFrame(endSec) - from + overlapFrames;

// 画面高さ基準の比率を短辺基準に読み替える。縦動画ではみ出しては困るものに掛ける
// （横動画では 1 を返すので、本編の見た目は変わらない）
const fontSize = height * SUBTITLE_FONT_SIZE_RATIO * useShortSideScale();
```

```tsx
// 曲の拍で書いた速さを秒に直す。拍で書いておくと、テンポを変えるとき BPM だけ直せばよい
const frameSec = beatTempoToSec({ bpm: 150, beats: 0.5 }); // 0.2 秒
```

- `useSecToFrame(offsetSec?)` : 秒 → 絶対フレーム。頭に無音・無地の区間を挟むときは `offsetSec` を渡す
- `useShortSideScale()` : 短辺基準への読み替え倍率
- `secPerBeat(bpm)` / `beatTempoToSec({ bpm, beats })` : BPM → 秒。`beats` は「ひとつぶんを何拍もたせるか」（省略時 1）
