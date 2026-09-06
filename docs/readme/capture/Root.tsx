import { AbsoluteFill, Composition } from "remotion";
import {
  AudioFadeEffectStage,
  BounceEffectStage,
  DropShadowEffectStage,
  FloatEffectStage,
  GlitchEffectStage,
  LoopMotionEffectStage,
  MotionBlurEffectStage,
  NightGlowEffectStage,
  PopInEffectStage,
  ShakeEffectStage,
  WiggleEffectStage,
} from "./EffectStages";
import {
  CutoutStageStage,
  FrameAnimationStage,
  ImageCutsStage,
  MovieCutStage,
  SimpleBackgroundStage,
  SubtitleStage,
  TelopStage,
} from "./ComponentStages";
import {
  BLUR_WITH_ZOOM,
  FADE_WITH_SLIDE,
  TRANSITION_BLENDS,
  singleKind,
  transitionRunStage,
  transitionStage,
} from "./TransitionStages";
import { TRANSITION_KINDS } from "../../../src/lib/components/transition/Transition";

// ---------------------------------------------------------------------------
// docs/readme/ 用のキャプチャ専用ルート。動画の出力（src/index.ts）とは別の入口。
// 画面サイズ・fps・下地の色は stories/StoryPlayer.tsx にそろえる
// ---------------------------------------------------------------------------

const FPS = 30;
const WIDTH = 640;
const HEIGHT = 360;
const BACKGROUND_COLOR = "#2b2f3a";

/**
 * 舞台に下地を敷いた Composition の中身を作る。
 * component は props と違って JSON で運ばれないので、舞台はここで包んでおく
 * @param Stage 撮りたい舞台
 * @param backgroundColor 下地の色
 */
const captureStage = (Stage: React.ComponentType, backgroundColor: string) => {
  const CaptureStage = () => (
    <AbsoluteFill style={{ backgroundColor }}>
      <Stage />
    </AbsoluteFill>
  );

  return CaptureStage;
};

/**
 * キャプチャ1本ぶんの Composition を組み立てる
 * @param id 出力するファイル名にもなる Composition の id
 * @param Stage 撮りたい舞台
 * @param durationSec 長さ（秒）
 * @param backgroundColor 下地の色
 */
const captureComposition = (
  id: string,
  Stage: React.ComponentType,
  durationSec: number,
  backgroundColor: string = BACKGROUND_COLOR,
) => (
  <Composition
    id={id}
    component={captureStage(Stage, backgroundColor)}
    durationInFrames={Math.round(durationSec * FPS)}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);

// 演出の入り（0〜0.8秒）と抜け（1.6〜2.4秒）がちょうど収まる長さ
const TRANSITION_SEC = 2.4;

/** TRANSITION_KINDS の全種類と、MV で使っている重ねがけ。id がそのままファイル名になる */
const TRANSITION_ITEMS = [
  ["Transition-None", singleKind(TRANSITION_KINDS.NONE)],
  ["Transition-Fade", singleKind(TRANSITION_KINDS.FADE)],
  ["Transition-Blur", singleKind(TRANSITION_KINDS.BLUR)],
  ["Transition-SlideLeft", singleKind(TRANSITION_KINDS.SLIDE_LEFT)],
  ["Transition-SlideRight", singleKind(TRANSITION_KINDS.SLIDE_RIGHT)],
  ["Transition-SlideUp", singleKind(TRANSITION_KINDS.SLIDE_UP)],
  ["Transition-SlideDown", singleKind(TRANSITION_KINDS.SLIDE_DOWN)],
  ["Transition-ZoomIn", singleKind(TRANSITION_KINDS.ZOOM_IN)],
  ["Transition-ZoomOut", singleKind(TRANSITION_KINDS.ZOOM_OUT)],
  ["Transition-FadeWithSlide", FADE_WITH_SLIDE],
  ["Transition-BlurWithZoom", BLUR_WITH_ZOOM],
] as const;

export const CaptureRoot = () => (
  <>
    {captureComposition("FloatEffect", FloatEffectStage, 5.2)}
    {captureComposition("GlitchEffect", GlitchEffectStage, 3)}
    {captureComposition("MotionBlurEffect", MotionBlurEffectStage, 3.2)}
    {captureComposition("NightGlowEffect", NightGlowEffectStage, 4, "#c98fa6")}
    {captureComposition("WiggleEffect", WiggleEffectStage, 4.8)}
    {captureComposition("LoopMotionEffect", LoopMotionEffectStage, 4)}
    {captureComposition("AudioFadeEffect", AudioFadeEffectStage, 4)}
    {captureComposition(
      "DropShadowEffect",
      DropShadowEffectStage,
      1,
      "#e8e2d4",
    )}
    {captureComposition("BounceEffect", BounceEffectStage, 1.8)}
    {captureComposition("PopInEffect", PopInEffectStage, 2)}
    {captureComposition("ShakeEffect", ShakeEffectStage, 2)}

    {captureComposition("SimpleBackground", SimpleBackgroundStage, 6)}
    {captureComposition("ImageCuts", ImageCutsStage, 6, "#000000")}
    {captureComposition("MovieCut", MovieCutStage, 5.16, "#4a7c59")}
    {captureComposition("FrameAnimation", FrameAnimationStage, 2.4)}
    {captureComposition("CutoutStage", CutoutStageStage, 1)}
    {captureComposition("Subtitle", SubtitleStage, 4)}
    {captureComposition("Telop", TelopStage, 1)}

    {TRANSITION_ITEMS.map(([id, transition]) =>
      captureComposition(id, transitionStage(transition), TRANSITION_SEC),
    )}
    {captureComposition(
      "TransitionRun-CrossDissolve",
      transitionRunStage(TRANSITION_BLENDS.CROSS_DISSOLVE),
      4.5,
      "#c0392b",
    )}
    {captureComposition(
      "TransitionRun-LinearOverUnder",
      transitionRunStage(TRANSITION_BLENDS.LINEAR_OVER_UNDER),
      4.5,
      "#c0392b",
    )}
  </>
);
