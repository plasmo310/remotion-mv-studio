import type { Meta, StoryObj } from "@storybook/react-vite";
import { AbsoluteFill, Img, staticFile } from "remotion";
import {
  TRANSITION_KINDS,
  Transition,
  TransitionKind,
  TransitionLayer,
} from "../../../../src/lib/components/transition/Transition";
import { StoryPlayer } from "../../../StoryPlayer";
import { SAMPLE_ARTS } from "../../../SampleAssets";

/** 演出の長さ。入りと抜けで同じだけかけて、3秒のあいだに両方見えるようにする */
const DURATION_SEC = 0.8;

/**
 * 種類ごとの見本。
 * Record なので TRANSITION_KINDS に種類を足すと、ここを埋めるまで型エラーになる
 * （EN_TAKES と同じ「取りこぼしを型で防ぐ」書き方）
 */
const SAMPLES: Record<TransitionKind, Transition> = {
  [TRANSITION_KINDS.NONE]: {
    kinds: [TRANSITION_KINDS.NONE],
    durationSec: DURATION_SEC,
  },
  [TRANSITION_KINDS.FADE]: {
    kinds: [TRANSITION_KINDS.FADE],
    durationSec: DURATION_SEC,
  },
  [TRANSITION_KINDS.BLUR]: {
    kinds: [TRANSITION_KINDS.BLUR],
    durationSec: DURATION_SEC,
  },
  [TRANSITION_KINDS.SLIDE_LEFT]: {
    kinds: [TRANSITION_KINDS.SLIDE_LEFT],
    durationSec: DURATION_SEC,
  },
  [TRANSITION_KINDS.SLIDE_RIGHT]: {
    kinds: [TRANSITION_KINDS.SLIDE_RIGHT],
    durationSec: DURATION_SEC,
  },
  [TRANSITION_KINDS.SLIDE_UP]: {
    kinds: [TRANSITION_KINDS.SLIDE_UP],
    durationSec: DURATION_SEC,
  },
  [TRANSITION_KINDS.SLIDE_DOWN]: {
    kinds: [TRANSITION_KINDS.SLIDE_DOWN],
    durationSec: DURATION_SEC,
  },
  [TRANSITION_KINDS.ZOOM_IN]: {
    kinds: [TRANSITION_KINDS.ZOOM_IN],
    durationSec: DURATION_SEC,
  },
  [TRANSITION_KINDS.ZOOM_OUT]: {
    kinds: [TRANSITION_KINDS.ZOOM_OUT],
    durationSec: DURATION_SEC,
  },
};

/** 入りと抜けに同じ演出をかける。ストーリー間の違いを「種類」だけにする */
const buildArgs = (kind: TransitionKind) => ({
  children: null,
  enter: SAMPLES[kind],
  exit: SAMPLES[kind],
});

const meta = {
  title: "lib/components/transition/Transition",
  component: TransitionLayer,
  render: (args) => (
    // SLIDE / ZOOM は下地が見えないと動きが読めないので、黒ベタにしない
    <StoryPlayer durationSec={3}>
      <TransitionLayer {...args}>
        <AbsoluteFill>
          <Img
            src={staticFile(SAMPLE_ARTS[0])}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      </TransitionLayer>
    </StoryPlayer>
  ),
} satisfies Meta<typeof TransitionLayer>;

export default meta;

type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// TRANSITION_KINDS の9種類。Storybook は名前付き export しかストーリーにできないので、
// 表から自動生成せず素直に並べる（slideRatio / zoomAmount / blurPx はコントロールで触れる）
// ---------------------------------------------------------------------------

/** 演出なし。バツンと切り替わる */
export const None: Story = { args: buildArgs(TRANSITION_KINDS.NONE) };

/** 明るさで溶かす */
export const Fade: Story = { args: buildArgs(TRANSITION_KINDS.FADE) };

/** ぼかす（にじんだ画面端は 6% の拡大で隠している） */
export const Blur: Story = { args: buildArgs(TRANSITION_KINDS.BLUR) };

/** 左へ流す */
export const SlideLeft: Story = {
  args: buildArgs(TRANSITION_KINDS.SLIDE_LEFT),
};

/** 右へ流す */
export const SlideRight: Story = {
  args: buildArgs(TRANSITION_KINDS.SLIDE_RIGHT),
};

/** 上へ流す */
export const SlideUp: Story = { args: buildArgs(TRANSITION_KINDS.SLIDE_UP) };

/** 下へ流す */
export const SlideDown: Story = {
  args: buildArgs(TRANSITION_KINDS.SLIDE_DOWN),
};

/** 寄りながら */
export const ZoomIn: Story = { args: buildArgs(TRANSITION_KINDS.ZOOM_IN) };

/** 引きながら */
export const ZoomOut: Story = { args: buildArgs(TRANSITION_KINDS.ZOOM_OUT) };

// ---------------------------------------------------------------------------
// 重ねがけ。実際の MV のプリセット（MusicVideoFull.tsx の TRANSITIONS）がこの形
// ---------------------------------------------------------------------------

/** Bメロの入り方に近い形（左へ流しながら溶かす） */
export const FadeWithSlide: Story = {
  args: {
    children: null,
    enter: {
      kinds: [TRANSITION_KINDS.FADE, TRANSITION_KINDS.SLIDE_LEFT],
      durationSec: DURATION_SEC,
      slideRatio: 0.3,
    },
    exit: {
      kinds: [TRANSITION_KINDS.FADE, TRANSITION_KINDS.SLIDE_LEFT],
      durationSec: DURATION_SEC,
      slideRatio: 0.3,
    },
  },
};

/** Aメロの入り方に近い形（ぼかしながら寄る） */
export const BlurWithZoom: Story = {
  args: {
    children: null,
    enter: {
      kinds: [TRANSITION_KINDS.BLUR, TRANSITION_KINDS.ZOOM_IN],
      durationSec: DURATION_SEC,
    },
    exit: {
      kinds: [TRANSITION_KINDS.BLUR, TRANSITION_KINDS.ZOOM_IN],
      durationSec: DURATION_SEC,
    },
  },
};
