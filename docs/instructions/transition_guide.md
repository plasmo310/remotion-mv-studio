# トランジション — 画の切り替え

MV の印象を決める要素なので、層に分かれている。**下の層ほど「1つの境目」の話**:

| ファイル                                  | 何を持つか                                                                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `components/transition/Transition.tsx`    | **1つの境目**の演出の定義（`Transition` 型・`TRANSITION_KINDS`）と、それを中身にかけるラッパー `TransitionLayer` |
| `components/transition/TransitionRun.tsx` | **並び全体**の繋ぎ方。頭出し・重なり・前後のペアリング・合成方式（`blend`）                                      |
| `components/cuts/ImageCuts.tsx`           | 止め絵の並び専用の入口。`ImageCut[]` を `TransitionRun` の項目に詰め替えて渡す                                   |

**トランジションの実装は `TransitionRun` にしかない。** `ImageCuts` は自前で並べているのではなく、
カットを項目に読み替えて `TransitionRun` に渡すだけの薄い層:

```tsx
// ImageCuts.tsx（抜粋）— これが全部
const items: TransitionRunItem[] = cuts.map((cut, index) => ({
  name: `Cut ${index + 1}`,
  startSec: cut.startSec,
  transitionIn: cut.transitionIn,
  element:
    cut.kind === IMAGE_CUT_KINDS.CUTOUT ? (
      <CutoutCut cut={cut} />
    ) : (
      <CoverCut cut={cut} />
    ),
}));

return <TransitionRun items={items} blend={blend} />;
```

なので**セクション（`MusicVideoFull`）もカット（`ImageCuts`）も、並べているのは同じエンジン**。
頭出しと重なりの計算・丸め順序の作法は `TransitionRun` の1か所にしかない。

並びを作るときに直に `TransitionLayer` を使わないこと（重なりを自分で計算することになる）。
`TransitionLayer` を単独で使うのは、並びを作らず1つの塊にだけ演出をかけるとき。

**新しい並び方の仕組みは `TransitionRun` にだけ足すこと**。`ImageCuts` に並べ方を書き足さない。

## 演出の種類（`TRANSITION_KINDS`）

| 種類                                                     | 何が起きるか                                   | 調整値（省略時）                |
| -------------------------------------------------------- | ---------------------------------------------- | ------------------------------- |
| `NONE`                                                   | 演出なし。バツンと切り替わる                   | —                               |
| `FADE`                                                   | 明るさで溶かす                                 | —                               |
| `BLUR`                                                   | ぼかす。にじんだ画面端は自動で 6% 拡大して隠す | `blurPx`（30）                  |
| `SLIDE_LEFT` / `SLIDE_RIGHT` / `SLIDE_UP` / `SLIDE_DOWN` | その向きに画面を流す                           | `slideRatio`（1 = 画面1枚ぶん） |
| `ZOOM_IN` / `ZOOM_OUT`                                   | 寄りながら / 引きながら                        | `zoomAmount`（0.25）            |

`kinds` は配列なので**重ねがけできる**。入りと抜けの向きはそろうので、
`SLIDE_LEFT` なら入ってくる側も出ていく側もどちらも左へ流れる。

```tsx
// 「ぼかしながら溶かす」を 0.6 秒かけて
const VERSE_IN: Transition = {
  kinds: [TRANSITION_KINDS.FADE, TRANSITION_KINDS.BLUR],
  durationSec: 0.6,
};
```

`durationSec` は**前後がどれだけ重なるか**でもある。`TransitionRun` が
そのぶんだけ前の項目を後ろへ引き伸ばし、その区間で入れ替える。

「Aメロはこう入る」という単位で MV 側にプリセットをまとめておくとよい
（meerkat は `compositions/MusicVideoFull.tsx` の `TRANSITIONS`。
[`docs/videos/meerkat.md`](../videos/meerkat.md) 参照）。

## 合成方式（`blend`）

重なっている区間の混ぜ方が2つあり、**見た目が違う**。並びごとに選ぶ:

|                | `CROSS_DISSOLVE`                                     | `LINEAR_OVER_UNDER`                                                  |
| -------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| 使っている場所 | セクションの境目（`MusicVideoFull`）                 | カットの境目（`ImageCuts`）                                          |
| 合成           | 前後の両方がフェードする（sRGB）                     | 入る側だけフェードし、出る側は不透明のまま下に残る。合成はリニア空間 |
| 下地           | 中間フレームで透ける（下地色を敷いておく必要がある） | 透けない                                                             |
| 中間調         | 明暗差の大きい2枚だと中間フレームで沈む              | 沈まない                                                             |

`LINEAR_OVER_UNDER` のほうが素直な見え方になるが、セクション側を今から変えると
既存 MV の出力が変わってしまうため `CROSS_DISSOLVE` のままにしてある
（[「既存 MV の出力を壊さない」](./code_guide.md)）。
`ImageCuts` を使うセクションが下地色（meerkat では `FADE_BASE_COLOR`）を敷いているのは、この透けの対策。

## 並びに適用する

**`transitionIn` は「その項目がどう入ってくるか」= その項目の _手前_ の境目**。
N個の項目には境目が N-1 個あるので、`items[1]` 以降に書く
（先頭は並びの頭なので、ふつう書かない。外側の `TransitionLayer` に任せる）。

同じなのは **`transitionIn` の意味と置き場所**（入ってくる側の項目に書く）で、
項目そのものの形は違う:

|                 | 並びを渡す prop | 項目の形                                                |
| --------------- | --------------- | ------------------------------------------------------- |
| `TransitionRun` | `items`         | `{ name, startSec, element, transitionIn? }`            |
| `ImageCuts`     | `cuts`          | `{ src, startSec, transitionIn?, …（寄り・揺れなど） }` |

**入口が2つあるのは、中身の作り方が違うから。**

- `TransitionRunItem` は「任意の中身」なので、`element`（描くもの）と `name`
  （Studio のタイムラインに出す名前）を呼び出し側が書く。`SectionEntry` はこれそのもので、
  入り方（`transitionIn`）を必須にしただけ
- `ImageCut` は「止め絵ショットの**データ**」。`src` と寄り・揺れの指定から
  `element` を組み立てるのが `ImageCuts` の仕事なので、書かなくてよい。
  `name` も `Cut 1` / `Cut 2` … と自動で付く

つまり `ImageCut` は `TransitionRunItem` の特殊化で、`ImageCuts` はその詰め替え係。
**同じ概念（`startSec` / `transitionIn`）は同じ名前・同じ意味**で、
違うのは「中身を渡すか、中身の作り方を渡すか」だけ。

使い分け:

| 並べたいもの                                   | 使うもの                                |
| ---------------------------------------------- | --------------------------------------- |
| 止め絵（1枚絵・切り抜き）の並び                | `ImageCuts`（`ImageCut[]` を書く）      |
| それ以外（セクション・キャラ・動画などの並び） | `TransitionRun`（`items` に要素を書く） |

止め絵と他のものを1つの並びに混ぜたいときは `TransitionRun` 側に寄せて、
止め絵の項目だけ `element` に書く。

> **既知の粗さ**: `ImageCuts` が付ける名前は `Cut 1` / `Cut 2` … なので、
> Studio のタイムラインでどの絵か分からない。絵の名前で追いたい並びは
> `TransitionRun` を直に使って `name` を付ける。

```tsx
// 3つ並べて、境目ごとに違う演出を混ぜる
<TransitionRun
  items={[
    { name: "A", startSec: 0, element: <A /> }, // 先頭 : 入りなし
    {
      name: "B",
      startSec: 2,
      // A → B の境目
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
/>;

// ImageCuts : 項目が ImageCut になるだけで、transitionIn の書き方は変わらない
const CUTS: ImageCut[] = [
  { src: A, startSec: 0 },
  {
    src: B,
    startSec: 2,
    transitionIn: { kinds: [TRANSITION_KINDS.FADE], durationSec: 0.6 },
  },
  {
    src: C,
    startSec: 4.5,
    transitionIn: { kinds: [TRANSITION_KINDS.SLIDE_LEFT], durationSec: 0.4 },
  },
];
```

作法:

- **1つの境目に演出は1つ。** 抜け側は「次の項目の `transitionIn`」から自動で作られるので、
  「A はフェードで消えつつ B はスライドで入る」という指定はできない
- **書かなければ演出なし**（バツン切り替え）。`{ kinds: [NONE], durationSec: 0 }` を
  埋める必要はない
- 並び全体の**最後**の抜けは `TransitionRun` の `endTransition` prop
  （`ImageCuts` は外側の `TransitionLayer` に任せる）
- **同じ画面に重ねる `ImageCuts` どうしは `blend` をそろえる。**
  リニア合成の器の有無で絵の明るさが変わるので、下地と手前で違えると2枚が食い違う

## セクションの中の並びにも使える

セクションの中で `<Sequence>` を手で並べると、重なりがないので必ずバツン切り替えになる。
`TransitionRun` に置き換えると `transitionIn` を書くだけで演出を足せる:

```tsx
// 手で並べる（切り替えは常にバツン）
<Sequence durationInFrames={hoverStartFrame} name="Dance">
  <ChorusDance />
</Sequence>
<Sequence from={hoverStartFrame} name="Hover">
  <CharaHover />
</Sequence>

// TransitionRun にすると、あとから transitionIn を足すだけで溶かせる
// （endSec を省略すると、置かれた Sequence = そのセクションの終わりまで）
<TransitionRun
  items={[
    { name: "Dance", startSec: 0, element: <ChorusDance /> },
    { name: "Hover", startSec: CHORUS_DANCE_SEC, element: <CharaHover /> },
  ]}
/>;
```

`<Sequence>` をコンポーネントに切り出す必要はない。`TransitionRun` が `<Sequence>` を
作るので、渡すのはその**中身**だけ。中身の側で重なりの尺（次の項目と重なっているフレーム数）が
要るときだけ、`useTransitionSlot()` でその項目の置き場所を読む
（`ImageCuts` のショットが寄り・移動の補間窓を出すのにこれを使っている）。

## 使い方

```tsx
// セクションの並び（compositions/MusicVideoFull.tsx）
// items は { name, startSec, element, transitionIn } の並び
<TransitionRun
  items={sections}
  offsetSec={leadInSec} // 頭に無地の区間を挟むぶん、並び全体を後ろへずらす
  endSec={sectionsEndSec}
  blend={TRANSITION_BLENDS.CROSS_DISSOLVE}
/>

// カットの並びは ImageCuts が内部で TransitionRun を呼ぶので、
// セクション側は cuts を宣言するだけ（lib_guide.md の Solo の例）
```

**種類ごとの見え方は Storybook で全部確認できる**（`npm run storybook` →
`lib/components/transition/Transition` に9種類 + 重ねがけ2つ、
`lib/components/transition/TransitionRun` に合成方式2つ）。
