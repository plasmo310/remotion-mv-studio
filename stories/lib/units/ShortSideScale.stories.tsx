import type { Meta, StoryObj } from "@storybook/react-vite";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { useShortSideScale } from "../../../src/lib/units/ShortSideScale";
import { Telop } from "../../../src/lib/components/text/Telop";
import { StoryPlayer } from "../../StoryPlayer";

/**
 * 画面高さ基準の比率を短辺基準に読み替える倍率。
 * 横動画では 1 を返し、縦動画でだけ小さくなる（同じ比率でも文字がはみ出さない）
 */
const ShortSideScaleDemo = () => {
  const { width, height } = useVideoConfig();
  const scale = useShortSideScale();

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <Telop
        text={`${width}x${height}\nscale ${scale.toFixed(2)}`}
        // 字幕と同じ 0.072。短辺基準に読み替えると縦動画でだけ小さくなる
        fontSize={height * 0.072 * scale}
        style={{ textAlign: "center" }}
      />
    </AbsoluteFill>
  );
};

const meta = {
  title: "lib/units/ShortSideScale",
  component: ShortSideScaleDemo,
} satisfies Meta<typeof ShortSideScaleDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 横動画（16:9）。読み替えは効かない（倍率 1） */
export const Landscape: Story = {
  render: () => (
    <StoryPlayer durationSec={1}>
      <ShortSideScaleDemo />
    </StoryPlayer>
  ),
};

/** 縦動画（9:16）。短辺が幅になるので文字が小さくなる */
export const Portrait: Story = {
  render: () => (
    <StoryPlayer durationSec={1} width={270} height={480}>
      <ShortSideScaleDemo />
    </StoryPlayer>
  ),
};
