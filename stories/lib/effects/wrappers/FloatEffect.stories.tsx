import type { Meta, StoryObj } from "@storybook/react-vite";
import { Img, staticFile } from "remotion";
import { FloatEffect } from "../../../../src/lib/effects/wrappers/FloatEffect";
import { StoryPlayer } from "../../../StoryPlayer";
import { SAMPLE_CUTOUT } from "../../../SampleAssets";

const meta = {
  title: "lib/effects/wrappers/FloatEffect",
  component: FloatEffect,
  args: {
    sizePx: 260,
    // 中身は 1辺 sizePx の箱いっぱいに広がるよう置く
    children: (
      <Img
        src={staticFile(SAMPLE_CUTOUT)}
        style={{ width: "100%", height: "100%" }}
      />
    ),
  },
  render: (args) => (
    <StoryPlayer durationSec={8}>
      <FloatEffect {...args} />
    </StoryPlayer>
  ),
} satisfies Meta<typeof FloatEffect>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 中身を包むだけ。自分で中央寄せするので、そのまま置ける */
export const Default: Story = {};

/** 他エフェクトの Options（落ち影・残像）をそのまま受け取れる */
export const WithShadowAndBlur: Story = {
  args: {
    baseTiltDeg: 20,
    shadow: { alpha: 0.2 },
    blur: { layers: 15, frameOffset: 2, opacity: 0.1 },
  },
};
