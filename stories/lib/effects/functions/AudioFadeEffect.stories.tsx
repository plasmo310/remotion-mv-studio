import type { Meta, StoryObj } from "@storybook/react-vite";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fadeOutVolume } from "../../../../src/lib/effects/functions/AudioFadeEffect";
import { StoryPlayer } from "../../../StoryPlayer";

/**
 * ① 計算関数。音は Storybook では確かめにくいので、
 * 返ってくる音量そのものをバーにして見せる（Audio の volume コールバックから呼ぶ値）
 */
const AudioFadeDemo = ({ fadeOutSec }: { fadeOutSec: number }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const volume = fadeOutVolume(
    frame,
    durationInFrames,
    Math.round(fadeOutSec * fps),
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
        color: "#ffffff",
        fontFamily: "monospace",
        fontSize: 32,
      }}
    >
      <div style={{ width: 400, height: 32, backgroundColor: "#4a4f5e" }}>
        <div
          style={{
            width: `${volume * 100}%`,
            height: "100%",
            backgroundColor: "#ffd45e",
          }}
        />
      </div>
      <div>volume {volume.toFixed(2)}</div>
    </AbsoluteFill>
  );
};

const meta = {
  title: "lib/effects/functions/AudioFadeEffect",
  component: AudioFadeDemo,
  render: (args) => (
    <StoryPlayer durationSec={4}>
      <AudioFadeDemo {...args} />
    </StoryPlayer>
  ),
} satisfies Meta<typeof AudioFadeDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 終わりの 1.5 秒だけ 1 → 0 に絞る */
export const Default: Story = { args: { fadeOutSec: 1.5 } };
