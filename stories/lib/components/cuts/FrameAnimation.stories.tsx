import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  CutoutStage,
  FrameAnimation,
} from "../../../../src/lib/components/cuts/FrameAnimation";
import { bounceEffect } from "../../../../src/lib/effects/functions/BounceEffect";
import { StoryPlayer } from "../../../StoryPlayer";
import { SAMPLE_CUTOUT, SAMPLE_DANCE_FRAMES } from "../../../SampleAssets";

const meta = {
  title: "lib/components/cuts/FrameAnimation",
  component: FrameAnimation,
  render: (args) => (
    <StoryPlayer durationSec={4}>
      <FrameAnimation {...args} />
    </StoryPlayer>
  ),
} satisfies Meta<typeof FrameAnimation>;

export default meta;

type Story = StoryObj<typeof meta>;

/** frames を frameInSeconds ごとに繰り返すだけ（切り替わりは絵が入れ替わるだけ） */
export const Loop: Story = {
  args: { frames: SAMPLE_DANCE_FRAMES, frameInSeconds: 0.3, heightRatio: 0.7 },
};

/** 切り替わりの見せ方は motion で差し込む（跳ねる） */
export const WithBounce: Story = {
  args: {
    frames: SAMPLE_DANCE_FRAMES,
    frameInSeconds: 0.3,
    heightRatio: 0.7,
    motion: ({ progress, sizePx }) => bounceEffect(progress, sizePx),
  },
};

/** 秒ではなく曲の拍で送る（tempo）。150 BPM の1拍ごと = 0.4 秒ごと */
export const ByBeat: Story = {
  args: {
    frames: SAMPLE_DANCE_FRAMES,
    tempo: { bpm: 150 },
    heightRatio: 0.7,
    motion: ({ progress, sizePx }) => bounceEffect(progress, sizePx),
  },
};

/** 裏拍も送る（beats: 0.5）。BPM はそのままで倍の速さになる */
export const ByHalfBeat: Story = {
  args: {
    frames: SAMPLE_DANCE_FRAMES,
    tempo: { bpm: 150, beats: 0.5 },
    heightRatio: 0.7,
    motion: ({ progress, sizePx }) => bounceEffect(progress, sizePx),
  },
};

/** コマ送りしない切り抜き1枚は CutoutStage（同じ足元基準で置ける） */
export const Cutout: StoryObj<typeof CutoutStage> = {
  render: () => (
    <StoryPlayer durationSec={2}>
      <CutoutStage src={SAMPLE_CUTOUT} heightRatio={0.7} />
    </StoryPlayer>
  ),
};
