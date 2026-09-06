import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BeatTempo, beatTempoToSec, secPerBeat } from "../../units/BeatTiming";
import {
  dropShadowEffect,
  DropShadowOptions,
} from "../../effects/functions/DropShadowEffect";

// ---------------------------------------------------------------------------
// コマ送り（パラパラ）アニメーションの枠組みと、その置き台。
// 「何枚目の絵をいつ出すか」「どこに置くか」の計算だけをここに置き、
// 絵柄・タイミング・重ねるエフェクトは呼び出し側が持つ。
// ---------------------------------------------------------------------------

/**
 * 画面高さに対する既定の大きさ・下端からの余白の比率。
 * 呼び出し側が CutoutStage と FrameAnimation で置き方をそろえたいときに参照する
 */
export const CUTOUT_HEIGHT_RATIO = 0.8;
export const CUTOUT_BOTTOM_RATIO = 0.02;

/** 表示するコマ1枚 */
export type AnimationFrame = {
  /** 表示する画像のパス（public からの相対パス） */
  src: string;
  /** 左右反転するか */
  flipped?: boolean;
};

/** 切り替わる時刻を指定したコマ1枚 */
export type AnimationPose = AnimationFrame & {
  /** 切り替わる秒。コンポーネントの頭からの相対時間 */
  startSec: number;
  /** 切り替わった瞬間に、FrameAnimation に渡したエフェクトを一瞬かけるか */
  withEffect?: boolean;
};

/** 切り替える時刻を「ひとつ前のコマからの間隔」で書いたコマ1枚 */
export type AnimationPoseCue = AnimationFrame & {
  /**
   * ひとつ前のコマから何秒後に切り替えるか（先頭はアニメーションの頭からの秒）。
   * 相対で持っているので、途中の1つを直せば、それ以降は直さなくても一緒にずれる
   */
  offsetSec: number;
  /** 切り替わった瞬間に、FrameAnimation に渡したエフェクトを一瞬かけるか */
  withEffect?: boolean;
};

/**
 * 間隔で書いた並びを、FrameAnimation に渡す時刻（アニメーションの頭からの相対秒）に直す
 * @param cues 間隔で書いたコマの並び
 */
export const toAnimationPoses = (cues: AnimationPoseCue[]): AnimationPose[] => {
  let startSec = 0;

  return cues.map(({ offsetSec, ...frame }) => {
    startSec += offsetSec;
    return { ...frame, startSec };
  });
};

/** 切り替える時刻を「ひとつ前のコマからの拍数」で書いたコマ1枚 */
export type AnimationPoseBeatCue = AnimationFrame & {
  /**
   * ひとつ前のコマから何拍後に切り替えるか（先頭はアニメーションの頭からの拍数）。
   * 0.5 で裏拍。拍で書いておくと、曲の速さを直すときに BPM だけ差し替えられる
   */
  offsetBeats: number;
  /** 切り替わった瞬間に、FrameAnimation に渡したエフェクトを一瞬かけるか */
  withEffect?: boolean;
};

/**
 * 拍で書いた並びを、FrameAnimation に渡す時刻（アニメーションの頭からの相対秒）に直す
 * @param cues 拍で書いたコマの並び
 * @param bpm 曲の速さ（1分あたりの拍数）
 */
export const toBeatAnimationPoses = (
  cues: AnimationPoseBeatCue[],
  bpm: number,
): AnimationPose[] => {
  const beatSec = secPerBeat(bpm);

  return toAnimationPoses(
    cues.map(({ offsetBeats, ...frame }) => ({
      ...frame,
      offsetSec: offsetBeats * beatSec,
    })),
  );
};

/** いま出ているコマと、そのコマに切り替わってからの経過時間 */
type CurrentFrameState = {
  src: string;
  flipped: boolean;
  withEffect: boolean;
  /** コマが切り替わってからの経過秒。切り替わりの見せ方とエフェクトの長さに使う */
  sinceSwitchSec: number;
};

/**
 * タイムライン指定のとき、いま出ているコマを探す。
 * 曲に合わせて間隔がばらつくので、周期から求めずに「最後に始まったコマ」を拾う
 */
const pickPose = (
  poses: AnimationPose[],
  elapsedSec: number,
): CurrentFrameState => {
  // 先頭のコマより前のフレームでは、先頭のコマをそのまま出しておく
  let current = poses[0];

  for (const pose of poses) {
    if (pose.startSec <= elapsedSec) {
      current = pose;
    }
  }

  return {
    src: current.src,
    flipped: current.flipped ?? false,
    withEffect: current.withEffect ?? false,
    sinceSwitchSec: Math.max(elapsedSec - current.startSec, 0),
  };
};

/** タイムライン指定がないとき、一定間隔でコマを回す */
const pickLoopFrame = (
  frames: AnimationFrame[],
  elapsedSec: number,
  frameInSeconds: number,
): CurrentFrameState => {
  const framePosition = elapsedSec / frameInSeconds;
  const { src, flipped } = frames[Math.floor(framePosition) % frames.length];

  return {
    src,
    flipped: flipped ?? false,
    withEffect: false,
    sinceSwitchSec: (framePosition % 1) * frameInSeconds,
  };
};

type FrameAnimationProps = {
  /** 繰り返し表示するコマの並び。poses を渡したときは使われない */
  frames: AnimationFrame[];
  /**
   * 切り替えるタイミングを曲に合わせて指定する。
   * 省略すると frames を frameInSeconds ごとに繰り返す
   */
  poses?: AnimationPose[];
  /** コマ1枚あたりの表示時間（秒）。省略時 0.35 */
  frameInSeconds?: number;
  /**
   * コマ1枚あたりの表示時間を、秒ではなく曲の拍で指定する。
   * 渡すと frameInSeconds より優先される（曲に合わせるときはこちら）
   */
  tempo?: BeatTempo;
  /** 画面高さに対する絵の大きさの比率。省略時 CUTOUT_HEIGHT_RATIO */
  heightRatio?: number;
  /** 画面高さに対する下端からの余白の比率。省略時 CUTOUT_BOTTOM_RATIO */
  bottomRatio?: number;
  /**
   * 画面の中央からの横のずらし量（画面幅に対する比率）。+ で右。
   * 何体か横に並べたいときは、呼び出し側でずらし量ちがいのこれを並べる
   */
  offsetXRatio?: number;
  /** 落ち影の強さの上書き。省略時は共通の既定値 */
  shadow?: DropShadowOptions;
  /**
   * コマが切り替わるたびに絵にかける変形（跳ねる、ずれる、など）。
   * progress は「切り替わってからコマ1枚ぶん（frameInSeconds / tempo）進んだら 1」。
   * 省略すると、切り替わりは絵が入れ替わるだけになる
   */
  motion?: (params: { progress: number; sizePx: number }) => string;
  /**
   * withEffect のコマに切り替わった瞬間、絵にかけるエフェクト。
   * いま出ているコマの絵を受け取り、それを包んだものを返す
   * （GlitchEffect のように複製を重ねるラッパーを想定している）
   */
  effect?: (image: React.ReactNode) => React.ReactNode;
  /** エフェクトをかけ続ける秒数。省略時 0.2（「一瞬」だけ） */
  effectDurationSec?: number;
};

/**
 * コマを順に切り替えて動かす切り抜き1体。
 * 決めるのは「いつどのコマを出すか」だけで、切り替わりをどう見せるかは
 * motion（変形）と effect（絵を包むもの）で呼び出し側から差し込む
 * @param param0
 * @param param0.frames 繰り返し表示するコマの並び
 * @param param0.poses 切り替えるタイミングを曲に合わせて指定する
 * @param param0.frameInSeconds コマ1枚あたりの表示時間（秒）
 * @param param0.tempo コマ1枚あたりの表示時間を曲の拍で指定する
 * @param param0.heightRatio 画面高さに対する絵の大きさの比率
 * @param param0.bottomRatio 画面高さに対する下端からの余白の比率
 * @param param0.offsetXRatio 画面の中央からの横のずらし量（画面幅に対する比率）
 * @param param0.shadow 落ち影の強さの上書き
 * @param param0.motion コマが切り替わるたびに絵にかける変形
 * @param param0.effect コマに切り替わった瞬間、絵にかけるエフェクト
 * @param param0.effectDurationSec エフェクトをかけ続ける秒数
 */
export const FrameAnimation = ({
  frames,
  poses,
  frameInSeconds = 0.35,
  tempo,
  heightRatio = CUTOUT_HEIGHT_RATIO,
  bottomRatio,
  offsetXRatio,
  shadow,
  motion,
  effect,
  effectDurationSec = 0.2,
}: FrameAnimationProps) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  // 拍で指定されたときだけ秒に直す。この先はどちらの指定でも同じ扱いになる
  const frameSec = tempo ? beatTempoToSec(tempo) : frameInSeconds;

  const elapsedSec = frame / fps;
  const current = poses
    ? pickPose(poses, elapsedSec)
    : pickLoopFrame(frames, elapsedSec, frameSec);

  // 切り替わってからの進み具合。1 でコマ1枚ぶんの時間が経った状態
  const progress = current.sinceSwitchSec / frameSec;
  const size = height * heightRatio;

  return (
    <CutoutStage
      src={current.src}
      heightRatio={heightRatio}
      bottomRatio={bottomRatio}
      offsetXRatio={offsetXRatio}
      shadow={shadow}
      wrap={
        effect &&
        current.withEffect &&
        current.sinceSwitchSec < effectDurationSec
          ? effect
          : undefined
      }
      // 反転は最後にかける。先にかけると motion の動く向きまで反転してしまう
      transform={[
        motion?.({ progress, sizePx: size }),
        `scaleX(${current.flipped ? -1 : 1})`,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
};

type CutoutStageProps = {
  /** 表示する画像のパス（public からの相対パス） */
  src: string;
  /** 画面高さに対する画像の大きさの比率。省略時 CUTOUT_HEIGHT_RATIO */
  heightRatio?: number;
  /** 画面高さに対する下端からの余白の比率。省略時 CUTOUT_BOTTOM_RATIO */
  bottomRatio?: number;
  /** 画像にかける変形。跳ねる動きも登場の動きも、ここに CSS の文字列で渡す */
  transform?: string;
  /** 変形の基準点。足元を軸に動かしたいときは "bottom center" を渡す */
  transformOrigin?: string;
  /** 画面の中央からの横のずらし量（画面幅に対する比率）。+ で右。横に並べるときに使う */
  offsetXRatio?: number;
  /** 落ち影の強さの上書き。省略時は共通の既定値 */
  shadow?: DropShadowOptions;
  /**
   * 画像にかけるエフェクト。画像を受け取り、それを包んだものを返す。
   * 画像と同じ大きさ・同じ変形がかかった position: relative の箱の中で呼ばれるので、
   * 複製を重ねるもの（GlitchEffect など）はそこを基準に絶対配置できる
   */
  wrap?: (image: React.ReactNode) => React.ReactNode;
};

/**
 * 切り抜き（透過 PNG）を画面の下端にそろえて置く土台。
 * 置き方（大きさの決め方・足元の位置）をここ1か所にまとめておくことで、
 * 動きのちがうカットどうしでも同じ位置・同じ大きさになり、カットの切り替わりで飛ばない。
 *
 * **正方形の透過 PNG を前提にしている**。heightRatio から出した1辺の正方形に
 * width/height 100% で流し込むので、正方形でない画像を渡すと縦横比が崩れる
 * （縦横比を保ちたいカットは ImageCuts の CUTOUT を使う。あちらは height 基準・width 自動）
 * @param param0
 * @param param0.src 表示する画像のパス（public からの相対パス）
 * @param param0.heightRatio 画面高さに対する画像の大きさの比率
 * @param param0.bottomRatio 画面高さに対する下端からの余白の比率
 * @param param0.transform 画像にかける変形
 * @param param0.transformOrigin 変形の基準点
 * @param param0.offsetXRatio 画面の中央からの横のずらし量（画面幅に対する比率）
 * @param param0.shadow 落ち影の強さの上書き
 * @param param0.wrap 画像にかけるエフェクト
 */
export const CutoutStage = ({
  src,
  heightRatio = CUTOUT_HEIGHT_RATIO,
  bottomRatio = CUTOUT_BOTTOM_RATIO,
  transform,
  transformOrigin,
  offsetXRatio = 0,
  shadow,
  wrap,
}: CutoutStageProps) => {
  const { height } = useVideoConfig();

  const size = height * heightRatio;
  const image = (
    <Img src={staticFile(src)} style={{ width: "100%", height: "100%" }} />
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: height * bottomRatio,
        // 横位置は土台ごとずらす。中の箱の transform（跳ね・反転）と混ざらないようにする
        transform: `translateX(${offsetXRatio * 100}%)`,
      }}
    >
      {/* エフェクトが複製を重ねられるよう、変形は画像ではなく外側の箱にかける */}
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          transform,
          transformOrigin,
          // 透過 PNG の輪郭に沿う落ち影。強さは呼び出し側で上書きできる
          filter: dropShadowEffect(size, shadow),
        }}
      >
        {wrap ? wrap(image) : image}
      </div>
    </AbsoluteFill>
  );
};
