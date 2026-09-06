import type { Meta, StoryObj } from "@storybook/react-vite";
import { MovieCut } from "../../../../src/lib/components/cuts/MovieCut";
import { StoryPlayer } from "../../../StoryPlayer";
import { SAMPLE_MOVIE, SAMPLE_MOVIE_DURATION_SEC } from "../../../SampleAssets";

const meta = {
  title: "lib/components/cuts/MovieCut",
  component: MovieCut,
  render: (args) => (
    <StoryPlayer durationSec={6} backgroundColor="#4a7c59">
      <MovieCut {...args} />
    </StoryPlayer>
  ),
} satisfies Meta<typeof MovieCut>;

export default meta;

type Story = StoryObj<typeof meta>;

/** グリーンバックを抜いて再生する（下地の緑が透けていれば抜けている） */
export const Default: Story = {
  args: { src: SAMPLE_MOVIE, durationSec: SAMPLE_MOVIE_DURATION_SEC },
};

/** 抜かずにそのまま出す（グリーンバックでない動画はこちら） */
export const NoChromaKey: Story = {
  args: {
    src: SAMPLE_MOVIE,
    durationSec: SAMPLE_MOVIE_DURATION_SEC,
    chromaKey: null,
  },
};
