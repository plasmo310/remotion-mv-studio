import type { Meta, StoryObj } from "@storybook/react-vite";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { NightGlowEffect } from "../../../../src/lib/effects/wrappers/NightGlowEffect";
import { StoryPlayer } from "../../../StoryPlayer";
import { SAMPLE_CUTOUT } from "../../../SampleAssets";

const meta = {
  title: "lib/effects/wrappers/NightGlowEffect",
  component: NightGlowEffect,
  render: (args) => (
    <StoryPlayer durationSec={4} backgroundColor="#c98fa6">
      <NightGlowEffect {...args}>
        <AbsoluteFill
          style={{ justifyContent: "center", alignItems: "center" }}
        >
          <Img src={staticFile(SAMPLE_CUTOUT)} style={{ height: 300 }} />
        </AbsoluteFill>
      </NightGlowEffect>
    </StoryPlayer>
  ),
} satisfies Meta<typeof NightGlowEffect>;

export default meta;

type Story = StoryObj<typeof meta>;

/** ③ ラッパー。全体を暗く落とし、白いところ（白目など）だけ明るいまま残す */
export const Default: Story = { args: { children: null, brightness: 0.4 } };

/** durationSec を渡すと、その秒までに元の明るさへ戻る */
export const FadesBack: Story = {
  args: { children: null, brightness: 0.4, durationSec: 2, fadeOutSec: 0.8 },
};
