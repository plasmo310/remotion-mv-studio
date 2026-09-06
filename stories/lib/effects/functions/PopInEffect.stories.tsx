import type { Meta, StoryObj } from "@storybook/react-vite";
import { AbsoluteFill, interpolate } from "remotion";
import {
  usePopIn,
  PopInOptions,
} from "../../../../src/lib/effects/functions/PopInEffect";
import { StoryPlayer } from "../../../StoryPlayer";

/** ② フック。返るのは進み具合（0 → 1、途中で 1 を行き過ぎる）だけ */
const PopInDemo = (options: PopInOptions) => {
  const enter = usePopIn(options);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: 24,
          backgroundColor: "#ffd45e",
          opacity: enter,
          // どう動かすかは呼び出し側が決める（ここでは下から跳ね上げる）
          transform: `translateY(${interpolate(enter, [0, 1], [120, 0])}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

const meta = {
  title: "lib/effects/functions/PopInEffect",
  component: PopInDemo,
  render: (args) => (
    <StoryPlayer durationSec={2}>
      <PopInDemo {...args} />
    </StoryPlayer>
  ),
} satisfies Meta<typeof PopInDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 既定のバネ（0.5 秒） */
export const Default: Story = { args: {} };

/** やわらかいバネ（大きく行き過ぎて揺れる） */
export const Soft: Story = { args: { durationSec: 1, damping: 6, mass: 1 } };
