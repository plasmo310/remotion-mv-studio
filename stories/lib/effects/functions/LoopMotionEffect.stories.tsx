import type { Meta, StoryObj } from "@storybook/react-vite";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { loopMotionEffect } from "../../../../src/lib/effects/functions/LoopMotionEffect";
import { StoryPlayer } from "../../../StoryPlayer";

const BOX: React.CSSProperties = {
  width: 100,
  height: 100,
  borderRadius: 16,
  backgroundColor: "#ffd45e",
};

/** ① 計算関数。サイン波の土台3つ（往復・山ひとつ・回り続ける）を並べて見る */
const LoopMotionDemo = ({ periodSec }: { periodSec: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsedSec = frame / fps;

  return (
    <AbsoluteFill
      style={{
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
      }}
    >
      {/* oscillate: -1 〜 1 を往復し続ける */}
      <div
        style={{
          ...BOX,
          transform: `translateY(${
            loopMotionEffect.oscillate(elapsedSec, periodSec) * 60
          }px)`,
        }}
      />
      {/* bump: 0 → 1 → 0 と一度だけ山を描く（周期ごとに頭出しし直している） */}
      <div
        style={{
          ...BOX,
          transform: `scale(${
            1 +
            loopMotionEffect.bump((elapsedSec % periodSec) / periodSec) * 0.5
          })`,
        }}
      />
      {/* spinAngleDeg: 一定周期で回り続ける */}
      <div
        style={{
          ...BOX,
          transform: `rotate(${loopMotionEffect.spinAngleDeg(
            elapsedSec,
            periodSec,
          )}deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

const meta = {
  title: "lib/effects/functions/LoopMotionEffect",
  component: LoopMotionDemo,
  render: (args) => (
    <StoryPlayer durationSec={6}>
      <LoopMotionDemo {...args} />
    </StoryPlayer>
  ),
} satisfies Meta<typeof LoopMotionDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 左から oscillate（往復）・bump（山ひとつ）・spinAngleDeg（回り続ける） */
export const Default: Story = { args: { periodSec: 2 } };
