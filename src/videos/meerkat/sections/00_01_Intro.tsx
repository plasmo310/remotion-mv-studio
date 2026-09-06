import {
  AbsoluteFill,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  CharaDance,
  CHARA_BOTTOM_RATIO,
  CHARA_HEIGHT_RATIO,
  CHARA_IMAGES,
  KYOROKYORO_POSES,
} from "../components/characters/CharaDance";
import { CutoutStage } from "../../../lib/components/cuts/FrameAnimation";
import { TELOP_WRAPS } from "../../../lib/components/text/Telop";
import { usePopIn } from "../../../lib/effects/functions/PopInEffect";
import { useSecToFrame } from "../../../lib/units/FrameTiming";
import { MeerkatTelop } from "../components/text/MeerkatTelop";
import { CharaHover } from "../components/characters/CharaHover";
import { CharaBackground } from "../components/characters/CharaBackground";
import { WiggleEffect } from "../../../lib/effects/wrappers/WiggleEffect";
import { dropShadowEffect } from "../../../lib/effects/functions/DropShadowEffect";
import { useShortSideScale } from "../../../lib/units/ShortSideScale";

/**
 * 曲が始まる前に、背景だけを見せておく秒数の既定値（本編の値）。
 * このセクションだけ曲の頭より前（動画の頭）から始めて、背景を先に流しておく。
 * 背景の飾りは経過フレームで回しているので、別の Sequence で先に出すと
 * キャラが出る瞬間に回転がリセットされて飛ぶ。ここで待たせれば回りっぱなしにできる。
 * 曲・ほかのセクション・字幕もまとめてこのぶん後ろにずれる（MusicVideoFull が参照する）
 */
export const LEAD_IN_SEC = 1;

/** 歌い始めの秒（曲の頭から）。ここまでがアップのカット、ここから CharaDance になる */
const SING_START_SEC = 0.9275;
/**
 * ふわふわ浮かせ始める秒（曲の頭から）。「ミーアキャット」を歌い終わったあたり。
 * ショート動画は浮きに合わせて本編への誘導を出すので、そちらからも参照する
 */
export const HOVER_START_SEC = 7;

/** 下からにょきっと出てくるのにかける秒数。引き始めの計算でも使う */
const POP_UP_SEC = 0.25;

type IntroProps = {
  /**
   * 曲が始まる前に背景だけを見せておく秒数。省略時 LEAD_IN_SEC。
   * ショートは頭の無地が長いとスワイプされるので、短い値を渡す。
   * 呼び出し側も、曲・歌詞をずらす量をこれと同じにすること
   */
  leadInSec?: number;
  /**
   * 浮きの間に左上へ出すロゴの大きさ（画面幅に対する比率）。省略時 0.4。
   * 縦動画は画面が狭くて文字がつぶれるので、ショート側から大きめの値を渡す
   */
  logoWidthRatio?: number;
  /**
   * 左上へ出すロゴの画像パス（public からの相対）。省略時は日本語ロゴ。
   * 英語版など、言語別ロゴに差し替えるときに渡す
   */
  logoSrc?: string;
  /**
   * Hover に入る前（登場〜きょろきょろ）の間だけ画面上部に出すバージョン表記。
   * 省略時は出さない。英語版は "English Ver" を渡す
   */
  versionLabel?: string;
};

/**
 * イントロ。
 * アップで出てきたキャラが歌に合わせてきょろきょろし、Aメロ前はふわふわ漂う
 * @param param0
 * @param param0.leadInSec 曲が始まる前に背景だけを見せておく秒数
 * @param param0.logoWidthRatio 左上へ出すロゴの大きさ（画面幅に対する比率）
 * @param param0.logoSrc 左上へ出すロゴの画像パス
 * @param param0.versionLabel Hover 前の間だけ上部に出すバージョン表記
 */
export const Intro = ({
  leadInSec = LEAD_IN_SEC,
  logoWidthRatio,
  logoSrc,
  versionLabel,
}: IntroProps) => {
  const { durationInFrames } = useVideoConfig();

  // SING_START_SEC / HOVER_START_SEC は曲の頭からの秒なので、
  // 背景だけの区間（leadInSec）ぶん足してからフレームに直す
  const toFrame = useSecToFrame(leadInSec);
  const leadInFrame = toFrame(0);
  const singStartFrame = toFrame(SING_START_SEC);
  const hoverStartFrame = toFrame(HOVER_START_SEC);

  return (
    <AbsoluteFill>
      <CharaBackground />
      <Sequence
        from={leadInFrame}
        durationInFrames={singStartFrame - leadInFrame}
        name="PopUp"
      >
        <IntroPopUp />
      </Sequence>
      <Sequence
        from={singStartFrame}
        durationInFrames={hoverStartFrame - singStartFrame}
        name="Dance"
      >
        {/* イントロは1匹だけ。歌詞に合わせてきょろきょろする */}
        <CharaDance poses={KYOROKYORO_POSES} />
      </Sequence>
      {versionLabel && hoverStartFrame > 0 ? (
        <Sequence durationInFrames={hoverStartFrame} name="VersionLabel">
          <IntroVersionLabel text={versionLabel} />
        </Sequence>
      ) : null}
      <Sequence
        from={hoverStartFrame}
        durationInFrames={durationInFrames - hoverStartFrame}
        name="Logo"
      >
        <IntroHoverLogo widthRatio={logoWidthRatio} src={logoSrc} />
      </Sequence>
      <Sequence
        from={hoverStartFrame}
        durationInFrames={durationInFrames - hoverStartFrame}
        name="Hover"
      >
        <CharaHover />
      </Sequence>
    </AbsoluteFill>
  );
};

type IntroVersionLabelProps = {
  /** 表示する文言 */
  text: string;
};

/**
 * 登場〜きょろきょろ（Hover 前）の間だけ画面上部に出す、バージョン表記のバッジ。
 * 書体・茶色の縁取り・落ち影は歌詞・ロゴにそろえ、同じ作品の文字として見せる
 * @param param0
 * @param param0.text 表示する文言
 */
const IntroVersionLabel = ({ text }: IntroVersionLabelProps) => {
  const { height } = useVideoConfig();

  // 画面高さ基準だと縦動画で大きくなりすぎるので、字幕・ロゴと同じく短辺基準に読み替える
  const fontSize = height * 0.068 * useShortSideScale();

  // 上から下りてきて、行き過ぎてから戻るバネで貼り付ける
  const enter = usePopIn({ durationSec: 0.45, mass: 0.6 });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: height * 0.06,
      }}
    >
      <WiggleEffect
        // ゆっくり傾きを揺らして「貼ったシール」感を出す
        rotateDeg={2}
        rotateSec={2.6}
        offsetPx={[4, 4]}
        offsetSec={[5, 4]}
        style={{
          opacity: enter,
          transform: `translateY(${interpolate(
            enter,
            [0, 1],
            [-fontSize * 1.4, 0],
          )}px) rotate(-4deg) scale(${0.85 + enter * 0.15})`,
        }}
      >
        <MeerkatTelop
          text={text}
          fontSize={fontSize}
          // バッジなので折り返さず1行のまま出す
          wrap={TELOP_WRAPS.NOWRAP}
          // 上に貼るぶん、字幕より少し濃くぼかして背景から浮かせる
          shadow={{ blurRatio: 0.12, alpha: 0.4 }}
        />
      </WiggleEffect>
    </AbsoluteFill>
  );
};

type IntroHoverLogoProps = {
  /** ロゴの大きさ（画面幅に対する比率）。省略時 0.4 */
  widthRatio?: number;
  /** ロゴの画像パス（public からの相対）。省略時は日本語ロゴ */
  src?: string;
};

/**
 * 浮きの間、左上にロゴを出してゆっくり揺らす（反復回転＋オフセット移動）。
 * @param param0
 * @param param0.widthRatio ロゴの大きさ（画面幅に対する比率）
 * @param param0.src ロゴの画像パス
 */
const IntroHoverLogo = ({
  widthRatio = 0.4,
  src = "assets/meerkat/images/Logo_01.png",
}: IntroHoverLogoProps) => {
  const { width, height } = useVideoConfig();

  // 画面幅に対する比率で置くので、影の大きさもここから出す
  const logoWidth = width * widthRatio;

  return (
    <AbsoluteFill>
      <WiggleEffect
        // 左右に2度だけ、2秒かけて往復させる
        rotateDeg={2}
        rotateSec={2}
        // 移動は X と Y で周期をずらして、往復ではなく漂って見せる
        offsetPx={[6, 5]}
        offsetSec={[6, 8]}
        style={{
          position: "absolute",
          // 画面の左上角からの位置。画面サイズに対する比率で置く
          left: width * 0.035,
          top: height * 0.085,
          width: logoWidth,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            display: "block",
            // 透過 PNG の輪郭に沿う落ち影。キャラと同じ比率で影を落とすため、
            // 幅ではなく表示される高さ（Logo_01 は 3:1 なので幅の 1/3）を基準にする
            filter: dropShadowEffect(logoWidth / 2),
          }}
        />
      </WiggleEffect>
    </AbsoluteFill>
  );
};

/**
 * 歌い始めまでのカット。正面の絵がアップのまま画面の下からにょきっと出てくる
 */
const IntroPopUp = () => {
  const frame = useCurrentFrame();
  const { fps, height, durationInFrames } = useVideoConfig();

  // 行き過ぎてから戻るバネで持ち上げて「にょきっと」感を出す
  const rise = usePopIn({ durationSec: POP_UP_SEC, damping: 11, mass: 0.6 });

  // 出きった形を 0.35 秒見せてから引き始める。
  // 引き終わりはカットの最後のフレームに固定して、CharaDance との段差をなくす
  const lastFrame = durationInFrames - 1;
  const pullBackStartFrame = Math.min(
    Math.round((POP_UP_SEC + 0.35) * fps),
    // 止める時間を長くしすぎても、引く区間が最低1フレームは残るようにする
    lastFrame - 1,
  );
  const pullBack = interpolate(frame, [pullBackStartFrame, lastFrame], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 画面からはみ出すくらいのアップ（1.8）から、CharaDance と同じ大きさへ引く
  const heightRatio = interpolate(pullBack, [0, 1], [1.8, CHARA_HEIGHT_RATIO]);
  const size = height * heightRatio;

  // 「出てくる前 → 出てきた後」の縦位置（キャラの大きさに対する比率、+ で下）。
  // 画像1枚ぶん下（1）から、半分だけ埋まった位置（0.5）へバネで持ち上げる。
  // バネは 1 を行き過ぎるので、ここは clamp せずに行き過ぎぶんも変形に効かせる
  const risenYRatio = interpolate(rise, [0, 1], [1, 0.5]);

  // 引きでは大きさだけでなく縦位置も CharaDance と同じ状態（ずれなし）へ戻す。
  // こうしておけば「出てきた後」をどこにずらしても、つなぎ目で飛ばない
  const translateY = interpolate(pullBack, [0, 1], [risenYRatio * size, 0]);

  return (
    <CutoutStage
      src={CHARA_IMAGES.FRONT}
      heightRatio={heightRatio}
      // 足元の余白は CharaDance と同じにする（そろえないとダンスへ移る瞬間に飛ぶ）
      bottomRatio={CHARA_BOTTOM_RATIO}
      // 足元を軸にして、地面から生えてくるように動かす
      transformOrigin="bottom center"
      transform={`translateY(${translateY}px)`}
      shadow={{ alpha: 0.25 }}
    />
  );
};
