import { Player } from "@remotion/player";
import { AbsoluteFill } from "remotion";

// ---------------------------------------------------------------------------
// ストーリー共通の再生台。
// lib のパーツはどれも useCurrentFrame / useVideoConfig を見るので、
// Remotion の文脈（= Player）の中に置かないと動かない。
// ---------------------------------------------------------------------------

/** ストーリー共通のフレームレート。MV 本編（30fps）にそろえる */
export const STORY_FPS = 30;

type StoryStageProps = {
  backgroundColor: string;
  children: React.ReactNode;
};

/** Player に渡す中身。Player は children ではなく component を取るので、いったん包む */
const StoryStage = ({ backgroundColor, children }: StoryStageProps) => (
  <AbsoluteFill style={{ backgroundColor }}>{children}</AbsoluteFill>
);

type StoryPlayerProps = {
  /** 確かめたいパーツ */
  children: React.ReactNode;
  /** ストーリーの長さ（秒）。省略時 4 */
  durationSec?: number;
  /** 画面の大きさ（px）。省略時 640x360（16:9）。縦動画の見え方を見るときだけ変える */
  width?: number;
  height?: number;
  /** 下地の色。透過 PNG や字幕の縁取りが見えるよう、既定は暗い色 */
  backgroundColor?: string;
};

/**
 * パーツ1つを Player に載せて、再生しながら確かめる
 * @param param0
 * @param param0.children 確かめたいパーツ
 * @param param0.durationSec ストーリーの長さ（秒）
 * @param param0.width 画面の幅（px）
 * @param param0.height 画面の高さ（px）
 * @param param0.backgroundColor 下地の色
 */
export const StoryPlayer = ({
  children,
  durationSec = 4,
  width = 640,
  height = 360,
  backgroundColor = "#2b2f3a",
}: StoryPlayerProps) => (
  <Player
    component={StoryStage}
    inputProps={{ backgroundColor, children }}
    durationInFrames={Math.round(durationSec * STORY_FPS)}
    compositionWidth={width}
    compositionHeight={height}
    fps={STORY_FPS}
    style={{ width, height }}
    controls
    loop
    autoPlay
  />
);
