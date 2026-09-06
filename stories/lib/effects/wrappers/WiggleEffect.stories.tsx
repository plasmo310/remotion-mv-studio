import type { Meta, StoryObj } from "@storybook/react-vite";
import { AbsoluteFill } from "remotion";
import { WiggleEffect } from "../../../../src/lib/effects/wrappers/WiggleEffect";
import { Telop } from "../../../../src/lib/components/text/Telop";
import { StoryPlayer } from "../../../StoryPlayer";

const meta = {
  title: "lib/effects/wrappers/WiggleEffect",
  component: WiggleEffect,
  render: (args) => (
    <StoryPlayer durationSec={8}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {/* 位置・大きさは style で渡す（transform はラッパーが上書きするので書かない） */}
        <WiggleEffect {...args}>
          <Telop text="ゆらゆら" fontSize={64} />
        </WiggleEffect>
      </AbsoluteFill>
    </StoryPlayer>
  ),
} satisfies Meta<typeof WiggleEffect>;

export default meta;

type Story = StoryObj<typeof meta>;

/** ③ ラッパー。中身をゆっくり反復回転＋オフセット移動＋伸縮させ続ける */
export const Default: Story = {
  args: {
    children: null,
    rotateDeg: 3,
    rotateSec: 2.4,
    offsetPx: [10, 14],
    scaleAmount: 0.05,
  },
};
