import type { Meta, StoryObj } from "@storybook/react-vite";
import { AbsoluteFill, Img, staticFile } from "remotion";
import {
  dropShadowEffect,
  DropShadowOptions,
} from "../../../../src/lib/effects/functions/DropShadowEffect";
import { StoryPlayer } from "../../../StoryPlayer";
import { SAMPLE_CUTOUT } from "../../../SampleAssets";

/** ① 計算関数。drop-shadow の filter 文字列を返すだけなので、掛ける先は呼び出し側が決める */
const DropShadowDemo = (options: DropShadowOptions) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <Img
      src={staticFile(SAMPLE_CUTOUT)}
      style={{ height: 240, filter: dropShadowEffect(240, options) }}
    />
  </AbsoluteFill>
);

const meta = {
  title: "lib/effects/functions/DropShadowEffect",
  component: DropShadowDemo,
  render: (args) => (
    <StoryPlayer durationSec={1} backgroundColor="#e8e2d4">
      <DropShadowDemo {...args} />
    </StoryPlayer>
  ),
} satisfies Meta<typeof DropShadowDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 既定の落ち影 */
export const Default: Story = { args: {} };

/** 濃く・大きく浮かせたところ */
export const Strong: Story = {
  args: { offsetRatio: 0.05, blurRatio: 0.06, alpha: 0.6 },
};
