# 新しい MV を1本足す手順

**MV 1 本＝`src/videos/<Name>/` フォルダ 1 個**、アセットは `public/assets/<Name>/`。
汎用エンジン（`src/lib/`）には触らずに済むのが基本。

## 手順

1. `src/videos/<Name>/` を作り、`components/ sections/ compositions/ data/ settings/ index.ts` を置く。
   既存の MV（`meerkat/`）をコピーして中身を差し替えるのが早い。
2. 音源を `public/assets/<Name>/audio/<lang>/`、画像を `public/assets/<Name>/images/`、
   動画を `public/assets/<Name>/movie/`、歌詞 JSON を
   `src/videos/<Name>/data/subtitle/<lang>/Lyrics.json` に置く。
   歌詞 JSON は[「記号トークンの補完」](./localization.md)まで済ませる。
3. `src/videos/<Name>/index.ts` に Composition を export し、`src/Root.tsx` に
   `<Folder name="<Name>">` を追加する。
4. Composition の id は `MV-<作品名>-<尺>-<言語>` にする（[命名の理由](./code_guide.md)）。
5. `docs/videos/<Name>.md` を作り、その MV 固有のこと（Composition 一覧・セクション構成・
   言語別テイクの値・守るべきフレーム数）を書く。
6. `npm run lint` を通す。

## 何を流用して、何を書き換えるか

**そのまま流用するもの**

- `compositions/MusicVideoFull.tsx` / `MusicVideoShort.tsx` の**骨格**
  （`SectionEntry` 型・`FULL_VIDEO_FPS`・`fullDurationInFrames`・`shortDurationInFrames`・描画部分）
- `components/text/<Name>Subtitle.tsx` / `FullVersionTelop.tsx`（文言・props だけ差し替え）
- `settings/Theme.ts` / `settings/Assets.ts` / `data/Lyrics.ts` の形
- `MusicVideoFull<Lang>.tsx` の「差分だけ書く」パターン（[`localization.md`](./localization.md)）

> ※ 描画部分が将来ほぼ全 MV で同一になったら `src/lib/` に昇格させる判断もあり。
> ただし現時点では MV ごとにコピーしておき、2 本目で本当に差分がないと確認できてから寄せる。

**書き換えるもの**

- `compositions/MusicVideoFull.tsx` の `SECTIONS` / `TRANSITIONS`（曲の構成そのものなので作り直し）
- `compositions/MusicVideoFull<Lang>.tsx` の秒の表
- `components/characters/*`（マスコットのポーズマップ・画像名定数。マスコットがなければフォルダごと削除し、
  `ImageCuts` / `MovieCut` を直接使う）
- `sections/*`（実際のショットなので大半は作り直し。`buildCheckCut` 等の共通ビルダーはコピーして流用）
- 画面に出る固定文言（謝辞セクションの `text`、`FullVersionTelop` の `text` など）

## その MV 側に置くもの

**素材（`components/`）→ ショット（`sections/`）→ 完成品（`compositions/`）** の3層で並べる。

| フォルダ                 | 層       | 中身                                                                                                                                                         |
| ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `components/characters/` | 素材     | キャラクターパーツ。汎用パーツに固有の見た目を渡す薄いラッパー（`CharaBackground`）もここ。名前は `Character` ではなく **`Chara` に統一**する                |
| `components/text/`       | 素材     | その MV の文字。`lib/components/text/` の `Subtitle` / `Telop` に歌詞・配色を渡す薄いラッパーと、その MV 固有のテロップ。**汎用パーツと同じ名前にしない**    |
| `sections/`              | ショット | 素材を組んだ1区間。曲の構成順に `00_01_Intro.tsx` のような連番で並べる。外側の `<Sequence>` は `TransitionRun` が付けるので自分では作らない                  |
| `compositions/`          | 完成品   | Composition 定義。日本語版のファイルに実装をそのまま書き、他の言語版は差分だけ持つ（[`localization.md`](./localization.md)）。共通の body ファイルは作らない |
| `data/`                  | データ   | JSON などの静的データ。歌詞は `data/subtitle/<lang>/Lyrics.json`、読み込みは `data/Lyrics.ts` 1か所                                                          |
| `settings/`              | データ   | 配色（`Theme.ts`）とアセットのパス（`Assets.ts`）のうち、**2か所以上から参照するもの**だけ。1つのカットでしか使わない画像はカット定義に直接書く              |

**`components/` のサブフォルダは、ラップ先の `lib/components/` に名前をそろえる。**
`lib/components/text/Subtitle` のラッパーは `components/text/` に置く。
`characters/` だけは lib に対応がない（その MV 固有のマスコットなので）。

```
src/lib/components/            background/  cuts/  transition/  text/
src/videos/<Name>/components/               characters/         text/
```

参照は下の層から上の層へ一方向にする（`sections/` が `components/` を読む。逆はしない）。

`src/lib/` への相対パスは `sections/` `compositions/` からは `../../../lib/...`、
1段深い `components/*/` からは `../../../../lib/...`。

## 留意点

- **`@remotion/google-fonts` の副作用**: `src/lib/components/text/TextStyle.ts` が import 時に
  `loadFont()` を呼ぶ。`Subtitle` / `Telop` はどちらもこれを import しているので、字幕かテロップが
  1つでも出ていれば読み込まれる。別の書体を使う MV では `TextStyle` に倣って、その MV 側で
  `loadFont` するモジュールを作る。
- **SVG フィルタの id**: 1画面に2つ置く可能性があるものは、`MovieCut` / `NightGlowEffect` のように
  **値から id を組み立てる**（固定 id にすると先に定義したほうだけが効く）。
  `ImageCuts` のリニア合成だけは「1画面に1つ」を前提に固定 id を使っている。
- **テンプレート化**: 2〜3 本作って「本当に共通なファイル」が見えたら `src/videos/_template/` を
  用意する。今は作らない（何が不変か決め打ちできない）。
