import type { Meta, StoryObj } from "@storybook/react-vite";
import { AbsoluteFill } from "remotion";
import {
  useShake,
  ShakeOptions,
} from "../../../../src/lib/effects/functions/ShakeEffect";
import { StoryPlayer } from "../../../StoryPlayer";

const SIZE_PX = 180;

/** ② フック。頭で大きく震えて、すぐ収まる（options を省略すると揺れない） */
const ShakeDemo = (options: ShakeOptions) => {
  const shake = useShake(options);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          width: SIZE_PX,
          height: SIZE_PX,
          borderRadius: 24,
          backgroundColor: "#ffd45e",
          // x / y は足し算、rotate は加算、overscan は掛け算で重ねる
          transform: `translate(${shake.x * SIZE_PX}px, ${
            shake.y * SIZE_PX
          }px) rotate(${shake.rotate}deg) scale(${shake.overscan})`,
        }}
      />
    </AbsoluteFill>
  );
};

const meta = {
  title: "lib/effects/functions/ShakeEffect",
  component: ShakeDemo,
  render: (args) => (
    <StoryPlayer durationSec={2}>
      <ShakeDemo {...args} />
    </StoryPlayer>
  ),
} satisfies Meta<typeof ShakeDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 驚いたときのひと揺れ（頭で最大 → すぐ収まる） */
export const Default: Story = {
  args: {
    seed: "story-shake",
    amplitude: 0.06,
    frequency: 14,
    durationSec: 1,
    rotateDeg: 4,
  },
};
