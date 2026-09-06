import type { Meta, StoryObj } from "@storybook/react-vite";
import { AbsoluteFill } from "remotion";
import { TRANSITION_KINDS } from "../../../../src/lib/components/transition/Transition";
import {
  TRANSITION_BLENDS,
  TransitionRun,
  TransitionRunItem,
} from "../../../../src/lib/components/transition/TransitionRun";
import { StoryPlayer } from "../../../StoryPlayer";

/** 板1枚。合成方式の違いは明るさの差で出るので、明暗のはっきりしたベタ塗りにする */
const Panel = ({ color, label }: { color: string; label: string }) => (
  <AbsoluteFill
    style={{
      backgroundColor: color,
      justifyContent: "center",
      alignItems: "center",
      color: "#ffffff",
      fontFamily: "monospace",
      fontSize: 48,
    }}
  >
    {label}
  </AbsoluteFill>
);

/** 1.5 秒ごとに切り替わる3枚。境目には 0.8 秒のクロスフェードをかける */
const ITEMS: TransitionRunItem[] = [
  {
    name: "1",
    startSec: 0,
    element: <Panel color="#101820" label="1" />,
  },
  {
    name: "2",
    startSec: 1.5,
    transitionIn: { kinds: [TRANSITION_KINDS.FADE], durationSec: 0.8 },
    element: <Panel color="#f2f2f2" label="2" />,
  },
  {
    name: "3",
    startSec: 3,
    transitionIn: { kinds: [TRANSITION_KINDS.FADE], durationSec: 0.8 },
    element: <Panel color="#101820" label="3" />,
  },
];

const meta = {
  title: "lib/components/transition/TransitionRun",
  component: TransitionRun,
  render: (args) => (
    // 下地を赤にしてあるので、合成の途中で下地が透けるとすぐ分かる
    <StoryPlayer durationSec={4.5} backgroundColor="#c0392b">
      <TransitionRun {...args} />
    </StoryPlayer>
  ),
} satisfies Meta<typeof TransitionRun>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * セクションの境目で使っている方式。前後の両方がフェードする。
 * 明→暗の境目で、中間フレームに下地（赤）が透ける
 */
export const CrossDissolve: Story = {
  args: { items: ITEMS, blend: TRANSITION_BLENDS.CROSS_DISSOLVE },
};

/**
 * カットの境目（ImageCuts）で使っている方式。
 * 入る側だけフェードし、出る側は不透明のまま下に残るので下地が透けない。
 * さらにリニア空間で合成するので、明暗の差が大きくても中間調が沈まない
 */
export const LinearOverUnder: Story = {
  args: { items: ITEMS, blend: TRANSITION_BLENDS.LINEAR_OVER_UNDER },
};
