import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Transition } from "../transition/Transition";
import {
  TRANSITION_BLENDS,
  TransitionBlend,
  TransitionRun,
  TransitionRunItem,
  useTransitionSlot,
} from "../transition/TransitionRun";
import { loopMotionEffect } from "../../effects/functions/LoopMotionEffect";
import { ShakeOptions, useShake } from "../../effects/functions/ShakeEffect";
import { dropShadowEffect } from "../../effects/functions/DropShadowEffect";

// ---------------------------------------------------------------------------
// 入力の型
// ---------------------------------------------------------------------------

/**
 * カットの見せ方
 * COVER: 画面いっぱいに敷いてケン・バーンズで動かす（背景・1枚絵向け）
 * CUTOUT: 透過 PNG を中央に置いて見せる（キャラ切り抜き向け）
 */
export const IMAGE_CUT_KINDS = {
  COVER: "cover",
  CUTOUT: "cutout",
} as const;

export type ImageCutKind =
  (typeof IMAGE_CUT_KINDS)[keyof typeof IMAGE_CUT_KINDS];

/**
 * 寄り・移動の状態ひとつぶん。
 * motion の始点／終点にも、カットの基準 transform にも使う
 */
export type ImageCutKeyframe = {
  /** 拡大率。1 で等倍。省略時 1。移動を使うなら端が見えないよう 1 より大きめにする */
  scale?: number;
  /** 横のずらし量。画面幅に対する比率で、正=右へ。省略時 0 */
  translateX?: number;
  /** 縦のずらし量。画面高さに対する比率で、正=下へ。省略時 0 */
  translateY?: number;
};

/**
 * 1カットの間の寄り・移動。from → to をカット長いっぱいかけて補間する。
 * to を省略すると from のまま静止する
 */
export type ImageCutMotion = {
  from?: ImageCutKeyframe;
  to?: ImageCutKeyframe;
};

/**
 * カットの頭（motionIn）／尻（motionOut）に足す、一時的な寄り・移動。
 * durationSec の間だけ from → to へ動き、窓の外では定位置（省略した端は等倍・原点）で止まる。
 * motion とは別レイヤーで、scale は掛け算・移動は足し算で重なる
 */
export type ImageCutPhaseMotion = ImageCutMotion & {
  /** 効かせる長さ（秒）。motionIn はカットの頭から、motionOut は次カットとの切れ目まで */
  durationSec: number;
};

/**
 * カットの頭に足す、PerlinNoise ベースの揺れ（shake）。驚き・衝撃を出すとき使う。
 * durationSec の間だけ効き、揺れ幅はカットの頭で最大 → すぐ減衰して 0（振動が収まる感じ）。
 * translate は足し算・rotate は加算で重なり、scale は「揺れで端に下地が出ないための余白」として
 * 掛け算で重なる（減衰に合わせて等倍へ戻る）。
 * 計算そのものは lib/effects/functions/ShakeEffect が持っていて、ここは種をカットの画像パスにしているだけ
 */
export type ImageCutShake = Omit<ShakeOptions, "seed">;

/**
 * カットの表示中ずっと左右に首振りする、反復回転（スイング）。
 * -angleDeg 〜 +angleDeg をサイン波で往復するだけで、一周はしない。
 * shake の回転とは加算で重なる。COVER でも CUTOUT でも効く
 */
export type ImageCutSwing = {
  /** 振れ角（度）。0 を中心に -angleDeg 〜 +angleDeg を往復する */
  angleDeg: number;
  /** 1往復にかける秒数。小さいほど速い（スピードの指定はここで） */
  periodSec: number;
  /** 揺れ始めるまでの秒数（カットの頭から）。省略時 0 */
  startAfterSec?: number;
  /** 揺れ始めの助走にかける秒数。0 → 最大振れ角へなめらかに寄せる。省略時 0.5 */
  rampUpSec?: number;
};

/** 止め絵1カット分の指定 */
export type ImageCut = {
  /** 表示する画像のパス（public からの相対パス） */
  src: string;
  /** 表示を始める秒。並び全体（ラップした Sequence）の頭からの相対時間 */
  startSec: number;
  /**
   * ひとつ前のカットからの切り替え方。省略で演出なし（バツンと切り替わる）。
   * その durationSec のぶんだけ前のカットと重なり、その区間で入れ替わる。
   * 並びの頭（先頭のカット）は、ふつう外側の TransitionLayer に任せるので書かない
   */
  transitionIn?: Transition;
  /** 見せ方。省略時 COVER */
  kind?: ImageCutKind;
  /**
   * このカットの基準 transform（省略時は等倍・原点）。
   * scale はここに motion の scale が掛け合わされ、translateX / translateY は足し合わされる。
   * 位置・寄りの定位置だけ決めて motion で味付けする、という使い方ができる
   */
  transform?: ImageCutKeyframe;
  /** このカット中の寄り・移動（カット全体にかかる連続的なもの）。省略時は寄り・移動なし */
  motion?: ImageCutMotion;
  /** カットの頭に足す入りの寄り・移動。durationSec の間だけ効く */
  motionIn?: ImageCutPhaseMotion;
  /** カットの尻（次カットとの切れ目）に足す抜けの寄り・移動。durationSec の間だけ効く */
  motionOut?: ImageCutPhaseMotion;
  /** カットの頭に足す PerlinNoise の揺れ（shake）。durationSec の間だけ効く */
  shake?: ImageCutShake;
  /** カットの表示中ずっと左右に首振りする反復回転。省略時は振らない */
  swing?: ImageCutSwing;
  /**
   * COVER のとき、画像にかけるぼかし量（px）。ぼかした下地として敷くとき使う。
   * にじんだ画面端は motion の scale を 1 より大きくして隠す
   */
  blurPx?: number;
  /**
   * COVER のとき、縦横比の違いで切られる上下（左右）のどこを残すか。
   * 0 で上端（左端）寄せ、0.5 で中央、1 で下端（右端）寄せ。省略時は中央。
   * transform の translate は切り取ったあとの絵ごと動かすので端に下地が出てしまう。
   * 「切らずに残したいもの」を決めるのはこちら
   */
  focusRatio?: number;
  /** CUTOUT のとき、画面高さに対する画像の大きさの比率。省略時 0.8 */
  heightRatio?: number;
  /** CUTOUT のとき左右反転するか */
  flipped?: boolean;
  /** CUTOUT のとき、出てくる瞬間だけスプリングで弾ませるか */
  pop?: boolean;
};

// ---------------------------------------------------------------------------
// 表示調整用のパラメータ
// ---------------------------------------------------------------------------

/**
 * 寄り・移動に使うイージング。
 * カットごとに inOut をかけると、各カットが切れ目で速度ゼロまで減速し、
 * 次カットも速度ゼロから始まるため、クロス中に一瞬止まって見える。
 * カット内は等速にして、切れ目で速度がつながるようにする
 */
const CUT_MOTION_EASING = Easing.linear;

/**
 * motionIn / motionOut に使う補間オプション。
 * 窓の外で from / to のまま止めたいので両端 clamp（主 motion の extend と違う）
 */
const PHASE_INTERPOLATE_OPTIONS = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: CUT_MOTION_EASING,
} as const;

/** pop の沈み込み量。等倍の (1 - この値) 倍から戻ってくる */
const POP_DIP = 0.15;

// ---------------------------------------------------------------------------
// 寄り・移動の組み立て
// ---------------------------------------------------------------------------

/** 既定値で埋めたあとの寄り・移動。実際に画像へかける値 */
type CutTransform = Required<ImageCutKeyframe>;

/** useCutTransform が返す、画像にかける最終的な transform。rotate は shake と swing が動かす */
type CutMotionState = CutTransform & {
  /** 回転（度）。0 で無回転 */
  rotate: number;
};

/** ImageCutKeyframe を既定値（等倍・原点）で埋める */
const fillKeyframe = (keyframe?: ImageCutKeyframe): CutTransform => ({
  scale: keyframe?.scale ?? 1,
  translateX: keyframe?.translateX ?? 0,
  translateY: keyframe?.translateY ?? 0,
});

/** from → to を progress（0〜1）で補間して 1 レイヤーぶんの寄り・移動を出す */
const lerpKeyframe = (
  from: ImageCutKeyframe | undefined,
  to: ImageCutKeyframe | undefined,
  progress: number,
): CutTransform => {
  const start = fillKeyframe(from);
  const end = fillKeyframe(to);
  const at = (fromValue: number, toValue: number) =>
    interpolate(progress, [0, 1], [fromValue, toValue]);

  return {
    scale: at(start.scale, end.scale),
    translateX: at(start.translateX, end.translateX),
    translateY: at(start.translateY, end.translateY),
  };
};

/**
 * カットの基準 transform に、主 motion と motionIn / motionOut を重ねて、
 * 実際に使う scale / translateX / translateY を出す。
 * scale は掛け算、移動は足し算で重なる
 * @param cut 表示する画像と見せ方
 */
const useCutTransform = (cut: ImageCut): CutMotionState => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // 尻のトランジションで次のカットと重なっている尺。
  // 並び（TransitionRun）の外に置かれたときは重なりなしとして扱う
  const exitOverlapFrames = useTransitionSlot()?.exitOverlapFrames ?? 0;

  // 主 motion は「頭〜次カットとの切れ目」で 0 → 1。durationInFrames には尻の重なり分も
  // 入っているので、それを引いた切れ目で progress=1（= to）になるようにする。
  // 重なり区間はそのまま延長方向へ流れ続ける
  const motionEnd = Math.max(1, durationInFrames - exitOverlapFrames);
  const progress = interpolate(frame, [0, motionEnd], [0, 1], {
    extrapolateLeft: "clamp",
    // 出ていくカットはクロス中も止めず、to を通り過ぎてそのまま流す
    extrapolateRight: "extend",
    easing: CUT_MOTION_EASING,
  });

  // 長さ 0 だと補間できないので最低1フレームは確保する。
  // 指定がなければ from も to も定位置なので、動かないまま素通しになる
  const phaseFrames = (phase?: ImageCutPhaseMotion) =>
    Math.max(1, Math.round((phase?.durationSec ?? 0) * fps));

  // motionIn はカットの頭から、motionOut は切れ目までの durationSec の間だけ効く
  const inProgress = interpolate(
    frame,
    [0, phaseFrames(cut.motionIn)],
    [0, 1],
    PHASE_INTERPOLATE_OPTIONS,
  );
  const outProgress = interpolate(
    frame,
    [motionEnd - phaseFrames(cut.motionOut), motionEnd],
    [0, 1],
    PHASE_INTERPOLATE_OPTIONS,
  );

  const base = fillKeyframe(cut.transform);
  // 主 motion は to 省略で from のまま静止。motionIn / motionOut は省略した端が定位置に落ちる
  const main = lerpKeyframe(
    cut.motion?.from,
    cut.motion?.to ?? cut.motion?.from,
    progress,
  );
  const enter = lerpKeyframe(cut.motionIn?.from, cut.motionIn?.to, inProgress);
  const exit = lerpKeyframe(
    cut.motionOut?.from,
    cut.motionOut?.to,
    outProgress,
  );

  // shake: カットの頭から durationSec の間だけ揺らす。
  // 種を画像パスにしているので、同じ絵は毎回まったく同じ揺れ方になる
  const shake = useShake(
    cut.shake ? { ...cut.shake, seed: cut.src } : undefined,
  );

  // swing: startAfterSec から、-angleDeg 〜 +angleDeg をサイン波で往復し続ける（一周はしない）。
  // 頭の rampUpSec だけ振れ角を 0 → 最大へ寄せて、揺れ始めが急に振れないようにする
  const swing = cut.swing;
  const swingElapsedSec = swing ? frame / fps - (swing.startAfterSec ?? 0) : 0;
  const swingRamp = swing
    ? interpolate(swingElapsedSec, [0, swing.rampUpSec ?? 0.5], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const swingRotate =
    swing && swingElapsedSec > 0
      ? loopMotionEffect.oscillate(swingElapsedSec, swing.periodSec) *
        swing.angleDeg *
        swingRamp
      : 0;

  return {
    scale: base.scale * main.scale * enter.scale * exit.scale * shake.overscan,
    translateX:
      base.translateX +
      main.translateX +
      enter.translateX +
      exit.translateX +
      shake.x,
    translateY:
      base.translateY +
      main.translateY +
      enter.translateY +
      exit.translateY +
      shake.y,
    rotate: shake.rotate + swingRotate,
  };
};

// ---------------------------------------------------------------------------
// 表示
// ---------------------------------------------------------------------------

type ImageCutsProps = {
  /**
   * 順番に表示するカット。
   * 1カットの長さは次のカットが始まるまで（最後は並び全体の Sequence の終わりまで）なので、
   * startSec だけをいじれば見せる長さを調整できる。
   * 境目の演出は、入ってくる側のカットの transitionIn に書く
   */
  cuts: ImageCut[];
  /**
   * 重なっている区間の合成方式。省略時 LINEAR_OVER_UNDER。
   *
   * リニア合成の器（SVG フィルタの往復）は 8bit では完全な恒等ではなく、
   * 絵の明るさをわずかに変える（実測で最大 20/255）。
   * そのため**同じ画面に重ねる ImageCuts どうしは必ずそろえる**こと
   * （下地と手前で違えると、2枚の明るさが食い違って見える）
   */
  blend?: TransitionBlend;
};

/**
 * 止め絵を順番に見せる Sequence 群。
 * cuts の startSec だけで見せる長さを決められ、境目の演出は各カットの transitionIn で足す。
 * 並べ方そのもの（頭出し・重なり・合成）は TransitionRun が持ち、
 * ここは「カットの並び」をその形に読み替えるだけ
 * @param param0
 * @param param0.cuts 順番に表示するカット
 * @param param0.blend 重なっている区間の合成方式
 */
export const ImageCuts = ({
  cuts,
  blend = TRANSITION_BLENDS.LINEAR_OVER_UNDER,
}: ImageCutsProps) => {
  const items: TransitionRunItem[] = cuts.map((cut, index) => ({
    name: `Cut ${index + 1}`,
    startSec: cut.startSec,
    transitionIn: cut.transitionIn,
    // 寄り・移動の補間に要る重なりの尺は、ショットの中で useTransitionSlot() から読む
    element:
      cut.kind === IMAGE_CUT_KINDS.CUTOUT ? (
        <CutoutCut cut={cut} />
      ) : (
        <CoverCut cut={cut} />
      ),
  }));

  return <TransitionRun items={items} blend={blend} />;
};

type CutRenderProps = {
  /** 表示する画像と見せ方 */
  cut: ImageCut;
};

/**
 * 画面いっぱいのカット。motion の from → to を「頭〜次カットとの切れ目」で補間して動かす。
 * 頭と尻のフェード／ぼかしは TransitionLayer が持つのでここでは扱わない
 * @param param0
 * @param param0.cut 表示する画像と見せ方
 */
const CoverCut = ({ cut }: CutRenderProps) => {
  const { scale, translateX, translateY, rotate } = useCutTransform(cut);

  return (
    <AbsoluteFill>
      <Img
        src={staticFile(cut.src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `50% ${(cut.focusRatio ?? 0.5) * 100}%`,
          filter: cut.blurPx ? `blur(${cut.blurPx}px)` : undefined,
          transform: `translate(${translateX * 100}%, ${
            translateY * 100
          }%) scale(${scale}) rotate(${rotate}deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * 透過 PNG を中央に置くカット（キャラ切り抜き向け）。
 * translateX / translateY は画面サイズに対する移動量、scale は拡大率。
 * pop 指定時は出てくる瞬間だけスプリングで弾ませる。
 * 反転は transform の最後にかける。先にかけると移動する向きまで反転してしまう
 * @param param0
 * @param param0.cut 表示する画像と見せ方
 */
const CutoutCut = ({ cut }: CutRenderProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const { scale, translateX, translateY, rotate } = useCutTransform(cut);

  const size = height * (cut.heightRatio ?? 0.8);
  const flip = cut.flipped ? -1 : 1;

  // pop は静止スケールに掛ける。弾む長さはカット長を超えないよう丸める
  const pop = cut.pop
    ? spring({
        frame,
        fps,
        config: { damping: 14, mass: 0.6 },
        // 12 フレームで弾み切る。カット長がそれより短ければカット長に合わせる
        durationInFrames: Math.min(12, durationInFrames),
      })
    : 1;
  const popScale = cut.pop ? 1 - POP_DIP + pop * POP_DIP : 1;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <Img
        src={staticFile(cut.src)}
        style={{
          // 高さだけ決めて横は画像の比率に任せる。キャラも1枚絵も同じ書き方で扱える
          height: size,
          width: "auto",
          // AbsoluteFill は縦並びの flex なので、既定のままだと画面より高い画像が縮められ、
          // しかも画像そのものの解像度より小さくはならない（＝サイズが px で頭打ちになる）。
          // 画面の解像度を変えると寄り具合が変わってしまうので、縮小を止めて height を守らせる
          flexShrink: 0,
          // 透過 PNG の輪郭に沿う落ち影。Dance/Hover のキャラと同じものを共用
          filter: dropShadowEffect(size),
          transform: `translate(${translateX * width}px, ${
            translateY * height
          }px) scale(${scale * popScale}) rotate(${rotate}deg) scaleX(${flip})`,
        }}
      />
    </AbsoluteFill>
  );
};
