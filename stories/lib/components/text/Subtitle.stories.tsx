import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  LyricsData,
  Subtitle,
  SUBTITLE_MODES,
} from "../../../../src/lib/components/text/Subtitle";
import { StoryPlayer } from "../../../StoryPlayer";

/**
 * 見本の歌詞。words[] は「text の空白以外の全文字を1文字＝1トークンで並べたもの」で、
 * カラオケ塗りがこの並びと text の文字が一致することを前提にしている
 */
const SAMPLE_LYRICS: LyricsData = {
  duration: 4,
  offset: 0,
  lines: [
    {
      index: 0,
      lineno: 0,
      interpolated: false,
      text: "きょろきょろ",
      start: 0.2,
      end: 2,
      words: "きょろきょろ".split("").map((word, index) => ({
        word,
        start: 0.2 + index * 0.3,
        end: 0.5 + index * 0.3,
      })),
    },
  ],
};

const meta = {
  title: "lib/components/text/Subtitle",
  component: Subtitle,
  render: (args) => (
    <StoryPlayer durationSec={4}>
      <Subtitle {...args} />
    </StoryPlayer>
  ),
} satisfies Meta<typeof Subtitle>;

export default meta;

type Story = StoryObj<typeof meta>;

/** カラオケ（歌ったところから1文字ずつ色が変わる） */
export const Karaoke: Story = {
  args: { lyrics: SAMPLE_LYRICS, mode: SUBTITLE_MODES.KARAOKE },
};

/** 行送り（塗らずに1行まるごと出す） */
export const Line: Story = {
  args: { lyrics: SAMPLE_LYRICS, mode: SUBTITLE_MODES.LINE },
};
