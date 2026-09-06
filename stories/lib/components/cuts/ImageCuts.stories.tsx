import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ImageCut,
  ImageCuts,
} from "../../../../src/lib/components/cuts/ImageCuts";
import { TRANSITION_KINDS } from "../../../../src/lib/components/transition/Transition";
import { StoryPlayer } from "../../../StoryPlayer";
import { SAMPLE_ARTS } from "../../../SampleAssets";

// 1カットの長さは次のカットが始まるまで（最後は Player の終わりまで）。
// 境目の演出は「入ってくる側」のカットの transitionIn に書くので、
// 3枚なら境目は2つ = cuts[1] と cuts[2] に書く（先頭は外側の TransitionLayer に任せる）
const CUTS: ImageCut[] = [
  {
    src: SAMPLE_ARTS[0],
    startSec: 0,
    motion: { from: { scale: 1 }, to: { scale: 1.08 } },
  },
  {
    src: SAMPLE_ARTS[1],
    startSec: 2,
    // 1枚目 → 2枚目 : 溶かす
    transitionIn: { kinds: [TRANSITION_KINDS.FADE], durationSec: 0.6 },
    motion: { from: { scale: 1.08 }, to: { scale: 1 } },
  },
  {
    src: SAMPLE_ARTS[2],
    startSec: 4,
    // 2枚目 → 3枚目 : 境目ごとに違う演出にできる（ここは左へ流す）
    transitionIn: {
      kinds: [TRANSITION_KINDS.SLIDE_LEFT],
      durationSec: 0.5,
      slideRatio: 0.4,
    },
    motion: { from: { scale: 1 }, to: { scale: 1.08 } },
  },
];

/** transitionIn を書かなければ演出なし（バツン切り替え） */
const HARD_CUTS: ImageCut[] = CUTS.map((cut) => ({
  ...cut,
  transitionIn: undefined,
}));

const meta = {
  title: "lib/components/cuts/ImageCuts",
  component: ImageCuts,
  render: (args) => (
    <StoryPlayer durationSec={6} backgroundColor="#000000">
      <ImageCuts {...args} />
    </StoryPlayer>
  ),
} satisfies Meta<typeof ImageCuts>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 境目ごとに違う演出を混ぜられる（1つ目は溶かす、2つ目は流す） */
export const MixedTransitions: Story = {
  args: { cuts: CUTS },
};

/** transitionIn を書かないカットの境目は演出なし */
export const HardCut: Story = {
  args: { cuts: HARD_CUTS },
};
