import type { Meta, StoryObj } from "@storybook/react-vite";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { MotionBlurEffect } from "../../../../src/lib/effects/wrappers/MotionBlurEffect";
import { loopMotionEffect } from "../../../../src/lib/effects/functions/LoopMotionEffect";
import { StoryPlayer } from "../../../StoryPlayer";

/**
 * 動きの計算は必ず children のコンポーネントの中で行う。
 * 残像は children を過去フレームで描き直して作るので、
 * 外で計算した transform を埋めた要素を渡すと残像が全部重なって何も起きない
 */
const MovingBox = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 20,
          backgroundColor: "#ffd45e",
          transform: `translateX(${
            loopMotionEffect.oscillate(frame / fps, 1.6) * 200
          }px)`,
        }}
      />
    </AbsoluteFill>
  );
};

const meta = {
  title: "lib/effects/wrappers/MotionBlurEffect",
  component: MotionBlurEffect,
  render: (args) => (
    <StoryPlayer durationSec={4}>
      <MotionBlurEffect {...args}>
        <MovingBox />
      </MotionBlurEffect>
    </StoryPlayer>
  ),
} satisfies Meta<typeof MotionBlurEffect>;

export default meta;

type Story = StoryObj<typeof meta>;

/** ③ ラッパー。過去フレームを薄く重ねて、動いている方向へ尾を引かせる */
export const Default: Story = {
  args: { children: null, layers: 12, frameOffset: 2, opacity: 0.15 },
};
