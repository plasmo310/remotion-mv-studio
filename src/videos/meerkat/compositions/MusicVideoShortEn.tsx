import { Composition } from "remotion";
import { AUDIO_EN, LOGO_EN } from "../settings/Assets";
import { EN_LYRICS } from "../data/Lyrics";
import {
  EN_INTRO_END_SEC,
  EN_INTRO_POPUP_DELAY_SEC,
  EN_SUBTITLE_OFFSET_SEC,
} from "./MusicVideoFullEn";
import {
  MusicVideoShort,
  shortDurationInFrames,
  SHORT_VIDEO_FPS,
  SHORT_VIDEO_SIZE,
} from "./MusicVideoShort";

/**
 * 英語版ショート（"Looky Looky Meerkats"）。
 * 本編 MusicVideoFullEn と同じ音源・歌詞・ロゴ・テイク固有タイミングを使い、イントロだけを切り出す。
 * 日本語版ショート（MusicVideoShort.tsx）との差分だけをここに書く
 */
const MusicVideoShortEn = () => (
  <MusicVideoShort
    audioSrc={AUDIO_EN}
    lyrics={EN_LYRICS}
    introPopupDelaySec={EN_INTRO_POPUP_DELAY_SEC}
    logoSrc={LOGO_EN}
    subtitleOffsetSec={EN_SUBTITLE_OFFSET_SEC}
    fullVersionTelopText="Full version in the description"
    versionLabel="English Ver"
  />
);

export const MusicVideoShortEnComposition = () => {
  return (
    <Composition
      id="MV-Meerkats-Short-En"
      component={MusicVideoShortEn}
      durationInFrames={shortDurationInFrames(EN_INTRO_END_SEC)}
      fps={SHORT_VIDEO_FPS}
      width={SHORT_VIDEO_SIZE.width}
      height={SHORT_VIDEO_SIZE.height}
    />
  );
};
