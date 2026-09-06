import type { Meta, StoryObj } from "@storybook/react-vite";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { GlitchEffect } from "../../../../src/lib/effects/wrappers/GlitchEffect";
import { StoryPlayer } from "../../../StoryPlayer";
import { SAMPLE_CUTOUT } from "../../../SampleAssets";

const SIZE_PX = 280;

const meta = {
  title: "lib/effects/wrappers/GlitchEffect",
  component: GlitchEffect,
  args: {
    children: (
      <Img
        src={staticFile(SAMPLE_CUTOUT)}
        style={{ width: "100%", height: "100%" }}
      />
    ),
  },
  render: (args) => (
    <StoryPlayer durationSec={3}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {/* 複製を絶対配置で重ねるので、呼び出し側が position: relative の箱を用意する */}
        <div style={{ position: "relative", width: SIZE_PX, height: SIZE_PX }}>
          <GlitchEffect {...args} />
        </div>
      </AbsoluteFill>
    </StoryPlayer>
  ),
} satisfies Meta<typeof GlitchEffect>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 中身を包むだけ。ずらし量は箱の幅に対する比率なので、大きさを渡さなくてよい */
export const Default: Story = {};

/** 帯を粗く、ずれを大きくしたところ */
export const Rough: Story = {
  args: { slices: 4, sliceShiftRatio: 0.12, chromaticRatio: 0.04 },
};
