import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/** 切り替えの動きに使うイージング。等速だと機械的に見えるので両端をなめらかにする */
const TRANSITION_EASING = Easing.inOut(Easing.ease);

/**
 * 切り替え方（セクション・カットどちらの境目にも使う）
 * NONE: 演出なし。バツンと切り替わる
 * FADE: 明るさで溶かす
 * BLUR: ぼかす
 * SLIDE_LEFT / SLIDE_RIGHT / SLIDE_UP / SLIDE_DOWN: その向きに画面を流す
 * ZOOM_IN: 寄りながら / ZOOM_OUT: 引きながら
 */
export const TRANSITION_KINDS = {
  NONE: "none",
  FADE: "fade",
  BLUR: "blur",
  SLIDE_LEFT: "slideLeft",
  SLIDE_RIGHT: "slideRight",
  SLIDE_UP: "slideUp",
  SLIDE_DOWN: "slideDown",
  ZOOM_IN: "zoomIn",
  ZOOM_OUT: "zoomOut",
} as const;

export type TransitionKind =
  (typeof TRANSITION_KINDS)[keyof typeof TRANSITION_KINDS];

/** 境目にかける演出の指定 */
export type Transition = {
  /** かける演出。複数書くと重ねがけになる（例: [FADE, SLIDE_LEFT]） */
  kinds: TransitionKind[];
  /** 演出の長さ（秒）。前後の中身はこの長さだけ重なる */
  durationSec: number;
  /** SLIDE で流す距離（画面サイズに対する比率）。省略時 1（画面1枚ぶん） */
  slideRatio?: number;
  /** ZOOM の強さ（拡大率の差分）。省略時 0.25 */
  zoomAmount?: number;
  /** BLUR のぼかし量（px）。省略時 30 */
  blurPx?: number;
};

// ---------------------------------------------------------------------------
// 演出の計算
// ---------------------------------------------------------------------------

/** ある時点での見た目 */
type TransitionLook = {
  opacity: number;
  blurPx: number;
  /** ぼかしの強さ 0→1（にじみ隠しの拡大量をこれに比例させ、blur が切れた瞬間に縮まないようにする） */
  blurAmount: number;
  /** 画面サイズに対する移動量の比率 */
  translateXRatio: number;
  translateYRatio: number;
  scale: number;
};

const INTERPOLATE_OPTIONS = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * 演出の進み具合から見た目を作る
 * @param transition かける演出。null なら素通し
 * @param progress 0（消えている）→ 1（出きっている）。明るさ・ぼかしに使う
 * @param motionProgress イージングをかけた progress。動きに使う
 * @param phase 入りなら +1、抜けなら -1
 */
const buildLook = (
  transition: Transition | null,
  progress: number,
  motionProgress: number,
  phase: number,
): TransitionLook => {
  const look: TransitionLook = {
    opacity: 1,
    blurPx: 0,
    blurAmount: 0,
    translateXRatio: 0,
    translateYRatio: 0,
    scale: 1,
  };

  if (transition === null) {
    return look;
  }

  const slideRatio = transition.slideRatio ?? 1;
  const zoomAmount = transition.zoomAmount ?? 0.25;
  const blurPx = transition.blurPx ?? 30;

  /**
   * 定位置からのずれ具合。
   * 入りは「離れた位置 → 定位置」、抜けは「定位置 → 反対側」と動かしたい。
   * ずれに phase を掛けることで、入りと抜けで動く向きがそろう
   * （SLIDE_LEFT なら、入ってくる側も出ていく側もどちらも左へ流れる）
   */
  const offset = (1 - motionProgress) * phase;

  for (const kind of transition.kinds) {
    switch (kind) {
      case TRANSITION_KINDS.FADE:
        look.opacity = Math.min(look.opacity, progress);
        break;
      case TRANSITION_KINDS.BLUR:
        look.blurAmount = Math.max(look.blurAmount, 1 - progress);
        look.blurPx = Math.max(look.blurPx, (1 - progress) * blurPx);
        break;
      case TRANSITION_KINDS.SLIDE_LEFT:
        look.translateXRatio += offset * slideRatio;
        break;
      case TRANSITION_KINDS.SLIDE_RIGHT:
        look.translateXRatio -= offset * slideRatio;
        break;
      case TRANSITION_KINDS.SLIDE_UP:
        look.translateYRatio += offset * slideRatio;
        break;
      case TRANSITION_KINDS.SLIDE_DOWN:
        look.translateYRatio -= offset * slideRatio;
        break;
      case TRANSITION_KINDS.ZOOM_IN:
        look.scale *= 1 - offset * zoomAmount;
        break;
      case TRANSITION_KINDS.ZOOM_OUT:
        look.scale *= 1 + offset * zoomAmount;
        break;
      default:
        break;
    }
  }

  return look;
};

// ---------------------------------------------------------------------------
// 表示
// ---------------------------------------------------------------------------

type TransitionLayerProps = {
  /** 中身の入り方。null なら演出なし */
  enter: Transition | null;
  /** 中身の抜け方。null なら演出なし */
  exit: Transition | null;
  /**
   * このレイヤーの手前に挟む SVG フィルタの id（例: リニア化フィルタ）。
   * opacity より前に効くので、外側で戻すフィルタと組にすると
   * クロスフェードの合成をリニア空間で行える。省略時はなし
   */
  colorFilterId?: string;
  children: React.ReactNode;
};

/**
 * 中身の頭と尻に切り替え演出をかけるラッパー。
 * セクション・カットどちらにも使える（前後を重ねて置き、
 * こちら側を薄く／ぼかし／動かすことで切り替える。
 * 重ねる長さは呼び出し側で Sequence を伸ばして作る）
 * @param param0
 * @param param0.enter 中身の入り方
 * @param param0.exit 中身の抜け方
 * @param param0.colorFilterId 手前に挟む SVG フィルタの id
 * @param param0.children 包む中身
 */
export const TransitionLayer = ({
  enter,
  exit,
  colorFilterId,
  children,
}: TransitionLayerProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enterFrames = enter === null ? 0 : Math.round(enter.durationSec * fps);
  const exitFrames = exit === null ? 0 : Math.round(exit.durationSec * fps);

  const enterRange: [number, number] = [0, enterFrames];
  const exitRange: [number, number] = [
    durationInFrames - exitFrames,
    durationInFrames,
  ];

  // 明るさは等速のまま。イージングをかけると前後のセクションの合計が 1 から外れ、
  // クロスフェードの途中で沈んだり明るくなったりする
  const enterProgress =
    enterFrames > 0
      ? interpolate(frame, enterRange, [0, 1], INTERPOLATE_OPTIONS)
      : 1;
  const exitProgress =
    exitFrames > 0
      ? interpolate(frame, exitRange, [1, 0], INTERPOLATE_OPTIONS)
      : 1;

  const enterMotion =
    enterFrames > 0
      ? interpolate(frame, enterRange, [0, 1], {
          ...INTERPOLATE_OPTIONS,
          easing: TRANSITION_EASING,
        })
      : 1;
  const exitMotion =
    exitFrames > 0
      ? interpolate(frame, exitRange, [1, 0], {
          ...INTERPOLATE_OPTIONS,
          easing: TRANSITION_EASING,
        })
      : 1;

  const enterLook = buildLook(enter, enterProgress, enterMotion, 1);
  const exitLook = buildLook(exit, exitProgress, exitMotion, -1);

  // 入りと抜けが重なることがあるので、強くかかっているほうを採用して足し合わせる
  const opacity = Math.min(enterLook.opacity, exitLook.opacity);
  const blurPx = Math.max(enterLook.blurPx, exitLook.blurPx);
  const blurAmount = Math.max(enterLook.blurAmount, exitLook.blurAmount);
  const translateXRatio = enterLook.translateXRatio + exitLook.translateXRatio;
  const translateYRatio = enterLook.translateYRatio + exitLook.translateYRatio;
  // ぼかすと画面端がにじむので、そのぶん 6% だけ拡大して隠す。
  // blurPx>0 で固定倍にすると blur が切れた瞬間に縮むので、ぼかしの強さに比例させる
  const scale = enterLook.scale * exitLook.scale * (1 + 0.06 * blurAmount);

  const isStill = translateXRatio === 0 && translateYRatio === 0 && scale === 1;

  // colorFilterId は opacity の前に効かせたいので filter の先頭に置く
  const filter =
    [
      colorFilterId ? `url(#${colorFilterId})` : null,
      blurPx > 0 ? `blur(${blurPx}px)` : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <AbsoluteFill
      style={{
        opacity,
        // 変化がないときに filter / transform を付けると無駄に合成が走るので外す
        filter,
        transform: isStill
          ? undefined
          : `translate(${translateXRatio * 100}%, ${
              translateYRatio * 100
            }%) scale(${scale})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
