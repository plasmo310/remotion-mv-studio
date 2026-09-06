import {
  AbsoluteFill,
  Composition,
  Html5Audio,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { LyricsData } from "../../../lib/components/text/Subtitle";
import { AUDIO_JA } from "../settings/Assets";
import { JA_LYRICS } from "../data/Lyrics";
import { fadeOutVolume } from "../../../lib/effects/functions/AudioFadeEffect";
import { FullVersionTelop } from "../components/text/FullVersionTelop";
import {
  MeerkatSubtitle,
  SUBTITLE_MODES,
} from "../components/text/MeerkatSubtitle";
import { HOVER_START_SEC, Intro } from "../sections/00_01_Intro";
import { INTRO_END_SEC } from "./MusicVideoFull";

// ---------------------------------------------------------------------------
// 日本語版のショート（9:16）。本編のイントロだけを切り出したもの。
// 別の言語版（MusicVideoShortEn.tsx）は、このファイルの MusicVideoShort に差分だけを渡す。
// ---------------------------------------------------------------------------

/** 全体のフレームレート。本編（MusicVideoFull）と同じにして、見た目のタイミングをそろえる */
export const SHORT_VIDEO_FPS = 30;

/**
 * 曲が始まる前に背景だけを見せておく秒数。本編（1秒）より短くする。
 * ショートは最初の0.5秒でスワイプされるか決まるので、無地の時間を切り詰める。
 * 0 にすると背景の飾りが回転角0の止まった絵から始まってしまうため、少しだけ残す。
 * 言語によらず共通。
 */
export const SHORT_LEAD_IN_SEC = 0.25;

/**
 * ショート動画の長さ（フレーム数）。曲が始まる前の背景だけの区間ぶん、イントロより長くなる
 * @param introEndSec 切り出す範囲の終わり（曲の頭からの秒 = 本編でAメロが始まる秒）
 */
export const shortDurationInFrames = (introEndSec: number) =>
  Math.ceil((SHORT_LEAD_IN_SEC + introEndSec) * SHORT_VIDEO_FPS);

/** ショートの解像度（9:16）。言語版が増えてもここ1か所で決める */
export const SHORT_VIDEO_SIZE = { width: 1080, height: 1920 };

export type MusicVideoShortProps = {
  /** 音源（public からの相対パス）。省略時は日本語版の音源 */
  audioSrc?: string;
  /** 歌詞データ（曲頭からの秒で持つ）。省略時は日本語版の歌詞 */
  lyrics?: LyricsData;
  /**
   * イントロのキャラ登場を曲頭よりさらに遅らせる秒。省略時 0。
   * 本編（MusicVideoFull）で同じ値を使っているなら、ショートでも合わせる
   */
  introPopupDelaySec?: number;
  /** 左上に出すロゴの画像パス（public からの相対）。省略時は日本語ロゴ */
  logoSrc?: string;
  /** 字幕だけを追加でずらす秒。省略時 0（本編の subtitleOffsetSec と合わせる） */
  subtitleOffsetSec?: number;
  /** 本編へ誘導するテロップの文言。省略時は日本語 */
  fullVersionTelopText?: string;
  /** Hover 前の間だけ上部に出すバージョン表記。省略時は出さない（英語版は "English Ver"） */
  versionLabel?: string;
};

/**
 * YouTube ショート動画（9:16）の本体。イントロだけを切り出したもの。
 *
 * 中身は本編とまったく同じ Intro をそのまま使う。
 * 画面が縦長になると困るもの（背景の飾り・浮きキャラ・字幕・誘導テロップ）は、
 * それぞれのコンポーネント側で短辺基準に読み替えている（useShortSideScale）ので、
 * ここでは大きさの指定を持たない。
 * @param param0
 * @param param0.audioSrc 音源（public からの相対パス）
 * @param param0.lyrics 歌詞データ
 * @param param0.introPopupDelaySec イントロのキャラ登場を曲頭よりさらに遅らせる秒
 * @param param0.logoSrc 左上に出すロゴの画像パス
 * @param param0.subtitleOffsetSec 字幕だけを追加でずらす秒
 * @param param0.fullVersionTelopText 本編へ誘導するテロップの文言
 * @param param0.versionLabel Hover 前の間だけ上部に出すバージョン表記
 */
export const MusicVideoShort = ({
  audioSrc = AUDIO_JA,
  lyrics = JA_LYRICS,
  introPopupDelaySec = 0,
  logoSrc,
  subtitleOffsetSec = 0,
  fullVersionTelopText,
  versionLabel,
}: MusicVideoShortProps) => {
  const { fps, durationInFrames } = useVideoConfig();

  // 頭の背景だけの区間が終わってから曲を鳴らす（本編と同じ扱い）
  const audioStartFrame = Math.round(SHORT_LEAD_IN_SEC * fps);
  const audioFrames = durationInFrames - audioStartFrame;
  // 曲の途中で切るので、終わりはぶつ切りにせず 0.6 秒かけて音を絞る
  const fadeOutFrames = Math.round(0.6 * fps);

  return (
    <AbsoluteFill>
      <Sequence from={audioStartFrame} layout="none" name="BGM">
        <Html5Audio
          src={staticFile(audioSrc)}
          volume={(frame) => fadeOutVolume(frame, audioFrames, fadeOutFrames)}
        />
      </Sequence>
      {/* 歌詞は曲の頭からの秒で持っているので、音と同じだけ後ろにずらす（＋曲ごとの字幕補正）。
          本編と同じく、タイムラインで BGM の隣に並べたいので画より前に置く
          （絵は Subtitle 側が最前面に出るので、キャラや誘導テロップに隠れない） */}
      <MeerkatSubtitle
        mode={SUBTITLE_MODES.KARAOKE}
        lyrics={lyrics}
        offsetInSeconds={SHORT_LEAD_IN_SEC + subtitleOffsetSec}
        // ショートは下端の 300px ほどにタイトル・チャンネル名が重なる。
        // 本編の既定（0.06 = 115px）のままだとスマホで歌詞が完全に隠れる
        bottomRatio={0.19}
      />
      {/* 縦画面は横幅が本編の半分ちょっとしかなく、既定（0.4）だとロゴの文字が読めない。
          登場〜浮き〜誘導テロップは、本編と同じだけ後ろへずらす */}
      <Intro
        leadInSec={SHORT_LEAD_IN_SEC + introPopupDelaySec}
        logoWidthRatio={0.6}
        logoSrc={logoSrc}
        versionLabel={versionLabel}
      />
      {/* 歌詞が止まってキャラがふわふわ漂う区間。画に余白ができるので、
          ここから最後まで本編への誘導を出しておく */}
      <Sequence
        from={Math.round(
          (SHORT_LEAD_IN_SEC + introPopupDelaySec + HOVER_START_SEC) * fps,
        )}
        name="FullVersionTelop"
      >
        <FullVersionTelop text={fullVersionTelopText} />
      </Sequence>
    </AbsoluteFill>
  );
};

const MusicVideoShortJa = () => <MusicVideoShort />;

export const MusicVideoShortComposition = () => {
  return (
    <Composition
      id="MV-Meerkats-Short-Ja"
      component={MusicVideoShortJa}
      durationInFrames={shortDurationInFrames(INTRO_END_SEC)}
      fps={SHORT_VIDEO_FPS}
      width={SHORT_VIDEO_SIZE.width}
      height={SHORT_VIDEO_SIZE.height}
    />
  );
};
