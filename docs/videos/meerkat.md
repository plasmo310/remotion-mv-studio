# meerkat（きょろきょろミーアキャット / Looky Looky Meerkats）

この MV 固有のこと。汎用の作法は [`docs/instructions/`](../instructions/) を参照。

- 実装: `src/videos/meerkat/`
- アセット: `public/assets/meerkat/`
- テスト: `tests/videos/meerkat/compositions/`（`SectionLayout.test.ts` / `VideoDuration.test.ts`）

日本語版・英語版、それぞれ本編と YouTube ショートを持つ。

## Composition

| id                     | 内容                                               | 解像度    | fps |
| ---------------------- | -------------------------------------------------- | --------- | --- |
| `MV-Meerkats-Full-Ja`  | 本編（日本語「きょろきょろミーアキャット」）       | 1920x1080 | 30  |
| `MV-Meerkats-Full-En`  | 本編（英語「Looky Looky Meerkats」）               | 1920x1080 | 30  |
| `MV-Meerkats-Short-Ja` | YouTube ショート用にイントロだけ切り出し（日本語） | 1080x1920 | 30  |
| `MV-Meerkats-Short-En` | 同・英語                                           | 1080x1920 | 30  |

Studio では `src/Root.tsx` の `<Folder name="meerkat">` によってグルーピングされる。
書き出しは id を指定する:

```console
npx remotion render MV-Meerkats-Full-En out/looky-looky-meerkats.mp4
```

## セクションの並び（`compositions/MusicVideoFull.tsx` の `SECTIONS`）

`startSec` は**日本語版**の値。並び・`name`・`transitionIn` はここが唯一の定義で、
他の言語版はこの表に秒だけを上書きする。

| name              | 日本語 `startSec` | 入り方（`transitionIn`） | 中身                     |
| ----------------- | ----------------- | ------------------------ | ------------------------ |
| `00_01_Intro`     | `-LEAD_IN_SEC`    | `CUT`                    | 登場〜きょろきょろ〜浮き |
| `01_01_Verse`     | `INTRO_END_SEC`   | `VERSE_IN`               | 1番Aメロ                 |
| `01_02_PreChorus` | 23.58             | `PRE_CHORUS_IN`          | 「右ヨシッ」から         |
| `01_03_Chorus`    | 39                | `CHORUS_IN`              | 1番サビ（Dance → Hover） |
| `02_01_Verse`     | 49.44             | `VERSE_IN`               | 2番Aメロ                 |
| `02_02_PreChorus` | 61.82             | `PRE_CHORUS_IN`          | 「前ヨシッ」から         |
| `02_03_Chorus`    | 77                | `CHORUS_IN`              | 2番サビ                  |
| `03_01_Solo`      | 88.1              | `SLOW_IN`                | 間奏（止め絵の並び）     |
| `03_02_Chorus`    | 100.5             | `LAST_CHORUS_IN`         | ラストサビ（Dance 動画） |
| `03_03_Outro`     | 111.66            | `SLOW_IN`                | アウトロ                 |
| `03_04_Closing`   | 124.4             | `SLOW_IN`                | オチ                     |
| `04_01_Thanks`    | 135.65            | `CUT`                    | お礼のテロップ           |

主な定数（すべて `MusicVideoFull.tsx` / `MusicVideoShort.tsx` から export）:

| 定数                                 | 値                   | 意味                                         |
| ------------------------------------ | -------------------- | -------------------------------------------- |
| `FULL_VIDEO_FPS` / `SHORT_VIDEO_FPS` | 30                   | 秒 → フレーム変換の基準                      |
| `FULL_VIDEO_SIZE`                    | 1920x1080            | 本編の解像度                                 |
| `SHORT_VIDEO_SIZE`                   | 1080x1920            | ショートの解像度                             |
| `INTRO_END_SEC`                      | 11.4                 | イントロの終わり。ショートの切り出しにも使う |
| `END_PAD_SEC`                        | 5                    | 曲が終わってからお礼テロップを見せておく秒数 |
| `LEAD_IN_SEC`                        | 1.0（`00_01_Intro`） | 曲頭までに背景だけを見せておく秒数（本編）   |
| `SHORT_LEAD_IN_SEC`                  | 0.25                 | ショートは頭の無地を切り詰める               |

長さの式:

- 本編 `fullDurationInFrames(lyrics, leadInSec)` = `ceil((leadInSec + lyrics.duration + END_PAD_SEC) * 30)`
- ショート `shortDurationInFrames(introEndSec)` = `ceil((SHORT_LEAD_IN_SEC + introEndSec) * 30)`

## 入り方のプリセット（`TRANSITIONS`）

「Aメロはこう入る」という単位で決めてあり、同じ種類のセクションで使い回す。

| プリセット       | 演出                       | `durationSec` |
| ---------------- | -------------------------- | ------------- |
| `CUT`            | `NONE`（バツン）           | 0             |
| `VERSE_IN`       | `FADE` + `BLUR`            | 0.6           |
| `PRE_CHORUS_IN`  | `SLIDE_LEFT`               | 0.5           |
| `CHORUS_IN`      | `FADE` + `ZOOM_IN`（0.18） | 0.5           |
| `SLOW_IN`        | `FADE` + `BLUR`            | 0.5           |
| `LAST_CHORUS_IN` | `FADE` + `ZOOM_OUT`（0.3） | 0.25          |

演出の種類そのものの説明は [`transition_guide.md`](../instructions/transition_guide.md)。

## キャラクター（`components/characters/`）

- 名前は `Character` ではなく **`Chara` に統一**する（`CharaDance` / `CharaHover` / `CharaBackground`）。
- 絵柄の定数は `CharaDance.tsx` の `CHARA_IMAGES`、ポーズの並びは `KYOROKYORO_POSE_CUES` など。
- `CharaBackground` は `SimpleBackground` に配色（`#FD94AC`）と飾り画像を固定した薄いラッパー。

## 文字（`components/text/`）

`components/characters/` と並ぶもう一方の素材。`lib/components/text/` にこの MV の配色を固定して渡す。

| ファイル               | 中身                                                                                                                                                                                                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MeerkatSubtitle.tsx`  | `lib` の `Subtitle` に歌詞（`JA_LYRICS` 既定）と配色を渡すラッパー。白 `#ffffff` → 黄 `#ffd45e`、縁は `OUTLINE_BROWN`。レイアウト定数（`SUBTITLE_FONT_SIZE_RATIO` / `SUBTITLE_BOTTOM_RATIO`）を再 export し、`04_01_Thanks` と `FullVersionTelop` が字幕と位置・大きさをそろえるのに使う |
| `MeerkatTelop.tsx`     | `lib` の `Telop` に `strokeColor={OUTLINE_BROWN}` を固定するだけの1行ラッパー。`00_01_Intro` のバージョン表記と `04_01_Thanks` から使う                                                                                                                                                  |
| `FullVersionTelop.tsx` | ショートから本編へ誘導するテロップ。字幕と同じ大きさ・書体で、`usePopIn` で下から跳ね上げ `WiggleEffect` で揺らす。下端 20% はショートの UI を避けた位置                                                                                                                                 |

`MeerkatSubtitle` / `MeerkatTelop` は `<Sequence>` を作らない**素材**で、`sections/` からも
`compositions/` からも組み込まれる。`FullVersionTelop` だけは `MusicVideoShort` からしか使わない完成品。

## 配色・アセット（`settings/`）

2か所以上から参照するものだけを置く。1つのカットでしか使わない1枚絵はカット定義に直接書く。

| 定数                    | 値                                                 |
| ----------------------- | -------------------------------------------------- |
| `Theme.OUTLINE_BROWN`   | `#5a3413`（字幕・テロップの縁取り）                |
| `Theme.FADE_BASE_COLOR` | `#000000`（止め絵セクションの下地。透け対策）      |
| `Assets.AUDIO_JA`       | `assets/meerkat/audio/kyorokyoro_meerkat.wav`      |
| `Assets.AUDIO_EN`       | `assets/meerkat/audio/en/looky_looky_meercats.wav` |
| `Assets.LOGO_EN`        | `assets/meerkat/images/en/Logo_01_en.png`          |
| `Assets.BACKGROUND_ART` | `assets/meerkat/images/BG_05.png`                  |
| `Assets.ENDING_ART`     | `assets/meerkat/images/Art_21.png`                 |

> 英語音源のファイル名だけスペルが **meercats**（ほかは meerkat）。手書きすると片方だけ直して壊れるので、
> 必ず `Assets.ts` の定数を経由する。

`MusicVideoFull` の下地色は `#1b2b3a`（セクションがまだない区間に見える色）。

## 英語版（`compositions/MusicVideoFullEn.tsx` / `MusicVideoShortEn.tsx`）

仕組みは [`localization.md`](../instructions/localization.md)。**英語のタイミング調整は `MusicVideoFullEn.tsx` で行う**
（ショートも同じ定数を読む）。

| 定数                       | 値    | 意味                                             |
| -------------------------- | ----- | ------------------------------------------------ |
| `EN_LEAD_IN_SEC`           | 1     | 本編の頭の無地（日本語の `LEAD_IN_SEC` と同じ）  |
| `EN_INTRO_POPUP_DELAY_SEC` | 0.75  | 登場（PopUp）を曲頭よりさらに遅らせる秒          |
| `EN_INTRO_END_SEC`         | 12.6  | イントロの終わり。ショートの切り出し範囲にも使う |
| `EN_SUBTITLE_OFFSET_SEC`   | -0.25 | 字幕全体を前へ寄せる補正                         |

- 秒の表は `EN_TAKES`（`Record<SectionName, { startSec, element? }>`）。
  セクションの取りこぼしと名前の typo は型エラーになる。
- 日本語の既定タイミングのままでは破綻する要素だけ、`element` で Props を渡している:
  `<Verse artCutStartSec={1.9} />` / `<PreChorus cutStartSecs={[0, 0.84, 1.38, 3.3]} />` /
  `<PreChorus2 cutStartSecs={[0, 0.8, 1.3, 3.44, 8.38]} />` /
  `<Thanks text="Thanks for watching!!" />`。
- イントロのロゴは `Logo_01_en.png`。2:1（日本語は 3:1）なので `logoWidthRatio={0.32}` で高さをそろえる。
- ショートだけ `versionLabel="English Ver"` を出す（本編・日本語版には渡さない）。
  誘導テロップは `fullVersionTelopText="Full version in the description"`。
- 歌詞 JSON は `data/subtitle/en/Lyrics.json`。英語パイプラインが落とす記号（`!` `?` `,` `'`）は
  直前の文字と同じタイミングで補完済み（[歌詞 JSON の作法](../instructions/localization.md)）。

## 日本語版を壊さない

日本語の `MV-Meerkats-Full-Ja` / `MV-Meerkats-Short-Ja` の解像度・fps・数値・
`durationInFrames` の式は変えない。リファクタで出力が1フレームも変わらないことを確認する。

| Composition            | フレーム数 |
| ---------------------- | ---------- |
| `MV-Meerkats-Short-Ja` | 350        |
| `MV-Meerkats-Full-Ja`  | 4318       |

検証は静止画で取る（mp4 はエンコードが run 間で bit 一致しない）。リファクタの前に撮っておき、
あとで `cmp` で突き合わせる:

```console
npx remotion still MV-Meerkats-Full-Ja before.png --frame=1500 --image-format=png
```

セクションの頭出しを変えるカット（Bメロなど）を触ったときは、そのセクションに当たるフレームを選ぶこと。
フレーム数の式は `npm test`（`tests/videos/meerkat/compositions/VideoDuration.test.ts`）でも固定してある。

## 既知の粗さ

- **セクションの境目が `CROSS_DISSOLVE` のまま。** `LINEAR_OVER_UNDER` のほうが素直な見え方になるが、
  変えると日本語版の出力が変わる。直すなら別途、目視で判断する。
- **バツン切り替えのまま残っている箇所**: `01_03_Chorus`（Dance → Hover）・
  `03_02_Chorus`（Dance → DanceMovie）・`00_01_Intro`（5つの手置き Sequence）。
  `TransitionRun` に置き換えれば `transitionIn` を書くだけで演出を足せる
  （[セクションの中の並びにも使える](../instructions/transition_guide.md)）。
- **`ImageCuts` が付けるタイムライン名が `Cut 1` / `Cut 2` …** なので、Studio でどの絵か分からない。
  絵の名前で追いたい並びは `TransitionRun` を直に使って `name` を付ける。
