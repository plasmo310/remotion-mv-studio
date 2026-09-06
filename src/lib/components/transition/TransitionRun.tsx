import { createContext, useContext } from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { TRANSITION_KINDS, Transition, TransitionLayer } from "./Transition";
import { useSecToFrame } from "../../units/FrameTiming";

// ---------------------------------------------------------------------------
// 秒で並べたものを、境目のトランジションで繋いで Sequence に並べる。
//
// 「1つの境目にどんな演出をかけるか」は Transition.tsx が持ち、
// ここは「並び全体をどう繋ぐか」（頭出し・重なり・前後のペアリング・合成方式）だけを持つ。
// セクションの並び（MusicVideoFull）とカットの並び（ImageCuts）が同じものを使う。
// ---------------------------------------------------------------------------

/**
 * 重なっている区間の合成方式。
 * どちらも見た目が違うので、並びごとに選ぶ（混ぜると同じ演出でも印象が変わる）
 * CROSS_DISSOLVE: 前後の両方がフェードする。素直だが、中間フレームで下地が透ける
 * LINEAR_OVER_UNDER: 入る側だけフェードし、出る側は不透明のまま下に残る。
 *   さらに合成をリニア空間で行うので、明るさの違う2枚でも中間調が沈まない
 */
export const TRANSITION_BLENDS = {
  CROSS_DISSOLVE: "crossDissolve",
  LINEAR_OVER_UNDER: "linearOverUnder",
} as const;

export type TransitionBlend =
  (typeof TRANSITION_BLENDS)[keyof typeof TRANSITION_BLENDS];

/**
 * リニア合成用の SVG フィルタ id。
 * 各項目に LINEARIZE を手前でかけ、重ねる器に DECODE をかけると、
 * 項目同士の合成（opacity によるブレンド）が数値上リニア空間で行われる。
 * sRGB のまま混ぜると、明るさの違う2枚の中間フレームで中間調が沈むのを防ぐ
 */
const LINEARIZE_FILTER_ID = "transition-run-linearize";
const DECODE_FILTER_ID = "transition-run-decode";
/** sRGB ↔ リニア変換に使う近似ガンマ */
const SRGB_GAMMA = 2.2;

// ---------------------------------------------------------------------------
// 置き場所の計算（フックを呼ばないので tests/ から直接呼べる）
// ---------------------------------------------------------------------------

/** 並びの1項目のうち、置き場所の計算に要るぶんだけ */
export type TransitionRunTiming = {
  /** 始まる秒。並びの頭からの相対時間 */
  startSec: number;
  /** ひとつ前の項目からの切り替え方。null / 省略で演出なし */
  transitionIn?: Transition | null;
};

/** 1項目ぶんの置き場所 */
export type TransitionRunSlot = {
  /** 始まる絶対フレーム */
  from: number;
  /** 長さ（フレーム）。次の項目と重なるぶんを含む */
  durationInFrames: number;
  /** 尻のトランジションで次の項目と重なっている尺（フレーム） */
  exitOverlapFrames: number;
  /** この項目の入り方（blend を反映済み） */
  enter: Transition | null;
  /** この項目の抜け方（blend を反映済み） */
  exit: Transition | null;
};

type BuildTransitionRunSlotsOptions = {
  /** 秒 → 絶対フレーム。頭に無地の区間を挟むときは useSecToFrame(offset) を渡す */
  toFrame: (sec: number) => number;
  /** フレームレート。重なりの尺を秒から出すのに使う */
  fps: number;
  /** 並び全体の終わり（絶対フレーム）。最後の項目はここまで */
  endFrame: number;
  /** 最後の項目の抜け方。省略時は演出なし */
  endTransition?: Transition | null;
  /** 重なっている区間の合成方式 */
  blend: TransitionBlend;
};

/** 入ってくる側の演出。クロスフェードは必ず要るので、書かれていなければ足す */
const withFade = (transition: Transition): Transition =>
  transition.kinds.includes(TRANSITION_KINDS.FADE)
    ? transition
    : { ...transition, kinds: [TRANSITION_KINDS.FADE, ...transition.kinds] };

/**
 * 出ていく側の演出。
 * 出ていく側は不透明のまま（合成の重みで自然に消える）にしたいのでフェード成分を抜く。
 * ここにフェードアウトも足すと前後の合計が 1 を割り、下地が透けて中盤で暗くなる。
 * 抜いた結果なにも残らなければ演出なし
 */
const withoutFade = (transition: Transition): Transition | null => {
  const kinds = transition.kinds.filter(
    (kind) => kind !== TRANSITION_KINDS.FADE,
  );
  return kinds.length === 0 ? null : { ...transition, kinds };
};

/**
 * 秒で書いた並びから、各項目の置き場所を出す。
 *
 * 長さは「両端をそれぞれ絶対フレームへ丸めてから差を取る」（useSecToFrame の作法）。
 * 長さのほうを先に丸めると誤差が積もって、項目の間に隙間や重なりが出る
 * @param items 並び（startSec と transitionIn しか見ない）
 * @param options 変換と合成方式
 * @returns 各項目の置き場所。長さが 0 以下になる項目は null（描かない）
 */
export const buildTransitionRunSlots = (
  items: readonly TransitionRunTiming[],
  options: BuildTransitionRunSlotsOptions,
): (TransitionRunSlot | null)[] => {
  const isOverUnder = options.blend === TRANSITION_BLENDS.LINEAR_OVER_UNDER;

  // 開始フレームを先に丸めてから、その差分を各項目の長さにする
  const boundaries = items.map((item) => options.toFrame(item.startSec));

  return items.map((item, index) => {
    const isLast = index === items.length - 1;

    // 境目の演出は前後どちらの項目にも効かせる（遷移は2つの“間”にかかるもの）。
    // 並びの端（先頭・末尾）は、外側に置かれた TransitionLayer に任せる
    const enterTransition = item.transitionIn ?? null;
    const exitTransition = isLast
      ? (options.endTransition ?? null)
      : (items[index + 1].transitionIn ?? null);

    // 重なりの尺は blend で書き換える**前**の演出から出すこと。
    // LINEAR_OVER_UNDER は出ていく側から FADE を抜くので、
    // 抜いた結果（FADE だけの境目なら null）から計算すると重なりが 0 になり、
    // 次の項目が入りきる前にこちらが消えて画が飛ぶ
    const exitOverlapFrames = exitTransition
      ? Math.round(exitTransition.durationSec * options.fps)
      : 0;

    const from = boundaries[index];
    const baseTo = isLast ? options.endFrame : boundaries[index + 1];
    const to = baseTo + exitOverlapFrames;

    if (to <= from) {
      return null;
    }

    return {
      from,
      durationInFrames: to - from,
      exitOverlapFrames,
      enter:
        enterTransition &&
        (isOverUnder ? withFade(enterTransition) : enterTransition),
      exit:
        exitTransition &&
        (isOverUnder ? withoutFade(exitTransition) : exitTransition),
    };
  });
};

// ---------------------------------------------------------------------------
// 表示
// ---------------------------------------------------------------------------

/**
 * いま描かれている項目の置き場所。
 * element に関数を受け取る形にすると SectionEntry と型がそろわなくなるので、
 * 重なりの尺が要る中身（ImageCuts のショットなど）は context から読む
 */
const TransitionSlotContext = createContext<TransitionRunSlot | null>(null);

/**
 * いま置かれている項目の置き場所（重なりの尺など）を読む。
 * TransitionRun の外に置かれたときは null
 */
export const useTransitionSlot = () => useContext(TransitionSlotContext);

/**
 * リニア合成用の SVG フィルタ定義。画面には出さず id を参照させるだけ。
 * feComponentTransfer をエンコード値そのものに効かせたいので
 * color-interpolation-filters は sRGB（＝ブラウザの自動リニア変換を切る）にする
 */
const LinearBlendFilters = () => (
  <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden>
    <defs>
      <filter id={LINEARIZE_FILTER_ID} colorInterpolationFilters="sRGB">
        <feComponentTransfer>
          <feFuncR type="gamma" exponent={SRGB_GAMMA} />
          <feFuncG type="gamma" exponent={SRGB_GAMMA} />
          <feFuncB type="gamma" exponent={SRGB_GAMMA} />
        </feComponentTransfer>
      </filter>
      <filter id={DECODE_FILTER_ID} colorInterpolationFilters="sRGB">
        <feComponentTransfer>
          <feFuncR type="gamma" exponent={1 / SRGB_GAMMA} />
          <feFuncG type="gamma" exponent={1 / SRGB_GAMMA} />
          <feFuncB type="gamma" exponent={1 / SRGB_GAMMA} />
        </feComponentTransfer>
      </filter>
    </defs>
  </svg>
);

/** 並びの1項目 */
export type TransitionRunItem = TransitionRunTiming & {
  /** Remotion Studio のタイムラインに出す名前。React の key にも使う（並びの中で重複させない） */
  name: string;
  /**
   * 描くもの。
   * 重なりの尺など置き場所の情報が要る中身は、その中で useTransitionSlot() を読む
   */
  element: React.ReactNode;
};

type TransitionRunProps = {
  /** 順番に見せる項目。長さは次の項目が始まるまで */
  items: readonly TransitionRunItem[];
  /**
   * 並び全体の終わり（秒）。最後の項目はここまで見せる。
   * 省略すると、置かれた Sequence の終わりまで
   */
  endSec?: number;
  /** startSec を絶対フレームに直す前に足す秒。頭に無地の区間を挟むときに使う。省略時 0 */
  offsetSec?: number;
  /** 最後の項目の抜け方。省略時は演出なし */
  endTransition?: Transition | null;
  /** 重なっている区間の合成方式。省略時 CROSS_DISSOLVE */
  blend?: TransitionBlend;
};

/**
 * 秒で並べた項目を、境目のトランジションで繋いで並べる。
 * 各項目は次の項目の入り方のぶんだけ後ろに引き伸ばされ、その区間で入れ替わる
 * @param param0
 * @param param0.items 順番に見せる項目
 * @param param0.endSec 並び全体の終わり（秒）
 * @param param0.offsetSec startSec を絶対フレームに直す前に足す秒
 * @param param0.endTransition 最後の項目の抜け方
 * @param param0.blend 重なっている区間の合成方式
 */
export const TransitionRun = ({
  items,
  endSec,
  offsetSec = 0,
  endTransition,
  blend = TRANSITION_BLENDS.CROSS_DISSOLVE,
}: TransitionRunProps) => {
  const { fps, durationInFrames } = useVideoConfig();
  const toFrame = useSecToFrame(offsetSec);

  const isOverUnder = blend === TRANSITION_BLENDS.LINEAR_OVER_UNDER;

  const slots = buildTransitionRunSlots(items, {
    toFrame,
    fps,
    endFrame: endSec === undefined ? durationInFrames : toFrame(endSec),
    endTransition,
    blend,
  });

  const body = items.map((item, index) => {
    const slot = slots[index];

    if (slot === null) {
      return null;
    }

    return (
      <Sequence
        key={item.name}
        from={slot.from}
        durationInFrames={slot.durationInFrames}
        name={item.name}
        // Studio は「同じ JSX から作られた Sequence」をコードの位置で見分けるので、
        // ここで並べたものは全部ひとつの複製とみなされ、タイムラインでは
        // 先頭の項目（00_01_Intro）1行にまとめられてしまう。
        // 項目ごとに違う印をつけて、それぞれ自分の名前で並ぶようにする。
        // 印はコードの位置として読めない文字列にすること。
        // `:` を挟むとファイル名付きのスタック行として読まれてしまい、
        // Studio がそのソースを取りに行って失敗し、コンソールにエラーが出る
        _remotionInternalStack={`TransitionRun item ${item.name}`}
      >
        {/* Provider は Sequence の内側に置く。外に置くと全項目が同じ slot を共有してしまう */}
        <TransitionSlotContext.Provider value={slot}>
          <TransitionLayer
            enter={slot.enter}
            exit={slot.exit}
            colorFilterId={isOverUnder ? LINEARIZE_FILTER_ID : undefined}
          >
            {item.element}
          </TransitionLayer>
        </TransitionSlotContext.Provider>
      </Sequence>
    );
  });

  if (!isOverUnder) {
    return <>{body}</>;
  }

  return (
    <>
      <LinearBlendFilters />
      {/* この器の中で項目同士がリニア空間で合成される（各項目は linearize 済み） */}
      <AbsoluteFill style={{ filter: `url(#${DECODE_FILTER_ID})` }}>
        {body}
      </AbsoluteFill>
    </>
  );
};
