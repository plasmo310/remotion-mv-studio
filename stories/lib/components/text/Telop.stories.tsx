import type { Meta, StoryObj } from "@storybook/react-vite";
import { AbsoluteFill } from "remotion";
import { Telop, TELOP_WRAPS } from "../../../../src/lib/components/text/Telop";
import { StoryPlayer } from "../../../StoryPlayer";

const meta = {
  title: "lib/components/text/Telop",
  component: Telop,
  render: (args) => (
    <StoryPlayer durationSec={2}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <Telop {...args} />
      </AbsoluteFill>
    </StoryPlayer>
  ),
} satisfies Meta<typeof Telop>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 既定（白文字＋黒縁）。置き場所は呼び出し側が style で決める */
export const Default: Story = {
  args: { text: "テロップの見本", fontSize: 56 },
};

/** 空白の位置で折り返す（keep-all なので語の途中では切れない） */
export const Wrapped: Story = {
  args: {
    text: "フルバージョンは 概要欄から",
    fontSize: 56,
    wrap: TELOP_WRAPS.WRAP,
    strokeColor: "#5a3413",
    style: { maxWidth: "60%", textAlign: "center", lineHeight: 1.3 },
  },
};
