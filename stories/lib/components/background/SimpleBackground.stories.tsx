import type { Meta, StoryObj } from "@storybook/react-vite";
import { SimpleBackground } from "../../../../src/lib/components/background/SimpleBackground";
import { StoryPlayer } from "../../../StoryPlayer";
import { SAMPLE_PROP } from "../../../SampleAssets";

const meta = {
  title: "lib/components/background/SimpleBackground",
  component: SimpleBackground,
  render: (args) => (
    <StoryPlayer durationSec={8}>
      <SimpleBackground {...args} />
    </StoryPlayer>
  ),
} satisfies Meta<typeof SimpleBackground>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 既定の見た目（ピンクの下地に飾りをばらまいてゆっくり回す） */
export const Default: Story = {
  args: { propSrc: SAMPLE_PROP },
};

/** 色と大きさを差し替えたところ（MV 側は薄いラッパーでこれを固定する） */
export const Customized: Story = {
  args: {
    propSrc: SAMPLE_PROP,
    backgroundColor: "#7ec8e3",
    propSizeRatioMin: 0.08,
    propSizeRatioMax: 0.14,
    propOpacity: 0.6,
  },
};
