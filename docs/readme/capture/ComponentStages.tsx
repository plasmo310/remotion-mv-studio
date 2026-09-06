import { AbsoluteFill } from "remotion";
import { SimpleBackground } from "../../../src/lib/components/background/SimpleBackground";
import {
  ImageCut,
  ImageCuts,
} from "../../../src/lib/components/cuts/ImageCuts";
import { MovieCut } from "../../../src/lib/components/cuts/MovieCut";
import {
  CutoutStage,
  FrameAnimation,
} from "../../../src/lib/components/cuts/FrameAnimation";
import {
  LyricsData,
  Subtitle,
  SUBTITLE_MODES,
} from "../../../src/lib/components/text/Subtitle";
import { Telop } from "../../../src/lib/components/text/Telop";
import { TRANSITION_KINDS } from "../../../src/lib/components/transition/Transition";
import { SAMPLE } from "./SampleAssets";

// ---------------------------------------------------------------------------
// components/ の舞台。中身は stories/lib/components/ の各ストーリーと同じ。
// ---------------------------------------------------------------------------

export const SimpleBackgroundStage = () => (
  <SimpleBackground propSrc={SAMPLE.prop} />
);

const CUTS: ImageCut[] = [
  {
    src: SAMPLE.arts[0],
    startSec: 0,
    motion: { from: { scale: 1 }, to: { scale: 1.08 } },
  },
  {
    src: SAMPLE.arts[1],
    startSec: 2,
    transitionIn: { kinds: [TRANSITION_KINDS.FADE], durationSec: 0.6 },
    motion: { from: { scale: 1.08 }, to: { scale: 1 } },
  },
  {
    src: SAMPLE.arts[2],
    startSec: 4,
    transitionIn: {
      kinds: [TRANSITION_KINDS.SLIDE_LEFT],
      durationSec: 0.5,
      slideRatio: 0.4,
    },
    motion: { from: { scale: 1 }, to: { scale: 1.08 } },
  },
];

export const ImageCutsStage = () => <ImageCuts cuts={CUTS} />;

export const MovieCutStage = () => (
  <MovieCut src={SAMPLE.movie} durationSec={SAMPLE.movieDurationSec} />
);

export const FrameAnimationStage = () => (
  <FrameAnimation
    frames={SAMPLE.danceFrames}
    frameInSeconds={0.3}
    heightRatio={0.7}
  />
);

export const CutoutStageStage = () => (
  <CutoutStage src={SAMPLE.cutout} heightRatio={0.7} />
);

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

export const SubtitleStage = () => (
  <Subtitle lyrics={SAMPLE_LYRICS} mode={SUBTITLE_MODES.KARAOKE} />
);

export const TelopStage = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <Telop text="テロップの見本" fontSize={56} />
  </AbsoluteFill>
);
