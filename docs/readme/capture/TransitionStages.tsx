import { AbsoluteFill, Img, staticFile } from "remotion";
import {
  TRANSITION_KINDS,
  Transition,
  TransitionLayer,
} from "../../../src/lib/components/transition/Transition";
import {
  TRANSITION_BLENDS,
  TransitionBlend,
  TransitionRun,
  TransitionRunItem,
} from "../../../src/lib/components/transition/TransitionRun";
import { SAMPLE } from "./SampleAssets";

// ---------------------------------------------------------------------------
// transition/ の舞台。中身は stories/lib/components/transition/ の各ストーリーと同じ。
// 入りと抜けに同じ演出をかけ、舞台ごとの違いを「種類」だけにする。
// ---------------------------------------------------------------------------

/** 演出の長さ（秒）。入りと抜けで同じだけかける */
const DURATION_SEC = 0.8;

/**
 * 1枚絵に入り・抜けの演出をかけた舞台を作る
 * @param transition かける演出（入り・抜けに同じものを使う）
 */
export const transitionStage = (transition: Transition) => {
  const TransitionStage = () => (
    <TransitionLayer enter={transition} exit={transition}>
      <AbsoluteFill>
        <Img
          src={staticFile(SAMPLE.arts[0])}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    </TransitionLayer>
  );

  return TransitionStage;
};

/** 種類ひとつぶんの演出。調整値は既定のまま */
export const singleKind = (kind: Transition["kinds"][number]): Transition => ({
  kinds: [kind],
  durationSec: DURATION_SEC,
});

/** 重ねがけ（MusicVideoFull.tsx のプリセットと同じ形） */
export const FADE_WITH_SLIDE: Transition = {
  kinds: [TRANSITION_KINDS.FADE, TRANSITION_KINDS.SLIDE_LEFT],
  durationSec: DURATION_SEC,
  slideRatio: 0.3,
};

export const BLUR_WITH_ZOOM: Transition = {
  kinds: [TRANSITION_KINDS.BLUR, TRANSITION_KINDS.ZOOM_IN],
  durationSec: DURATION_SEC,
};

/** 板1枚。合成方式の違いは明るさの差で出るので、明暗のはっきりしたベタ塗りにする */
const Panel = ({ color, label }: { color: string; label: string }) => (
  <AbsoluteFill
    style={{
      backgroundColor: color,
      justifyContent: "center",
      alignItems: "center",
      color: "#ffffff",
      fontFamily: "monospace",
      fontSize: 48,
    }}
  >
    {label}
  </AbsoluteFill>
);

const ITEMS: TransitionRunItem[] = [
  { name: "1", startSec: 0, element: <Panel color="#101820" label="1" /> },
  {
    name: "2",
    startSec: 1.5,
    transitionIn: { kinds: [TRANSITION_KINDS.FADE], durationSec: 0.8 },
    element: <Panel color="#f2f2f2" label="2" />,
  },
  {
    name: "3",
    startSec: 3,
    transitionIn: { kinds: [TRANSITION_KINDS.FADE], durationSec: 0.8 },
    element: <Panel color="#101820" label="3" />,
  },
];

/**
 * 明暗の板を繋いだ並びの舞台を作る（合成方式の違いを見るためのもの）
 * @param blend 合成方式
 */
export const transitionRunStage = (blend: TransitionBlend) => {
  const TransitionRunStage = () => (
    <TransitionRun items={ITEMS} endSec={4.5} blend={blend} />
  );

  return TransitionRunStage;
};

export { TRANSITION_BLENDS };
