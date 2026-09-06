import type { Meta, StoryObj } from "@storybook/react-vite";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  bounceEffect,
  BounceOptions,
} from "../../../../src/lib/effects/functions/BounceEffect";
import { StoryPlayer } from "../../../StoryPlayer";

/** ① 計算関数。progress（0 → 1）を渡すと跳ねる transform 文字列が返る */
const BounceDemo = (options: BounceOptions) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // 0.6 秒ごとに 0 → 1 を繰り返して、跳ねを何度も見られるようにする
  const progress = ((frame / fps) % 0.6) / 0.6;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: 24,
          backgroundColor: "#ffd45e",
          transform: bounceEffect(progress, 140, options),
        }}
      />
    </AbsoluteFill>
  );
};

const meta = {
  title: "lib/effects/functions/BounceEffect",
  component: BounceDemo,
  render: (args) => (
    <StoryPlayer durationSec={3}>
      <BounceDemo {...args} />
    </StoryPlayer>
  ),
} satisfies Meta<typeof BounceDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 既定（少し持ち上げて、伸ばした分だけ横を縮める） */
export const Default: Story = { args: {} };

/** 大きく跳ねさせたところ */
export const Big: Story = { args: { liftRatio: 0.2, stretchRatio: 0.12 } };
