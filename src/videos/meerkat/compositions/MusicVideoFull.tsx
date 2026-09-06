import {
  AbsoluteFill,
  Composition,
  Html5Audio,
  Sequence,
  staticFile,
} from "remotion";
import { AUDIO_JA } from "../settings/Assets";
import { JA_LYRICS } from "../data/Lyrics";
import { LyricsData } from "../../../lib/components/text/Subtitle";
import {
  TRANSITION_KINDS,
  Transition,
} from "../../../lib/components/transition/Transition";
import {
  TRANSITION_BLENDS,
  TransitionRun,
  TransitionRunItem,
} from "../../../lib/components/transition/TransitionRun";
import {
  MeerkatSubtitle,
  SUBTITLE_MODES,
} from "../components/text/MeerkatSubtitle";
import { Intro, LEAD_IN_SEC } from "../sections/00_01_Intro";
import { Verse } from "../sections/01_01_Verse";
import { PreChorus } from "../sections/01_02_PreChorus";
import { Chorus } from "../sections/01_03_Chorus";
import { Verse2 } from "../sections/02_01_Verse";
import { PreChorus2 } from "../sections/02_02_PreChorus";
import { Chorus2 } from "../sections/02_03_Chorus";
import { Solo } from "../sections/03_01_Solo";
import { Chorus3 } from "../sections/03_02_Chorus";
import { Outro } from "../sections/03_03_Outro";
import { Closing } from "../sections/03_04_Closing";
import { Thanks } from "../sections/04_01_Thanks";

// ---------------------------------------------------------------------------
// 日本語版の本編。この MV の実装そのもの（並び・入り方・絵・秒）をここに書く。
// 別の言語版（MusicVideoFullEn.tsx）は、このファイルの SECTIONS と MusicVideoFull を読んで
// 「日本語版との差分」だけを持つ。
// ---------------------------------------------------------------------------

/** 全体のフレームレート。秒 → フレームの変換すべてがこれを基準にする */
export const FULL_VIDEO_FPS = 30;

/** イントロの終わり（= Aメロが始まる秒）。ショート（MusicVideoShort）の切り出しにも使う */
export const INTRO_END_SEC = 11.4;

/**
 * 曲が終わってから動画が終わるまでの余白。お礼のテロップを見せておく秒数。
 * セクションの並び方を固定するテスト（tests/.../SectionLayout.test.ts）からも参照する
 */
export const END_PAD_SEC = 5;

/** 本編の解像度（16:9）。言語版が増えてもここ1か所で決める */
export const FULL_VIDEO_SIZE = { width: 1920, height: 1080 };

/**
 * セクション1つ分の指定。
 * lib の TransitionRunItem そのもので、入り方（transitionIn）だけ必須にしてある
 * （name = タイムラインに出す名前、startSec = 曲の頭からの秒。負なら曲が始まる前から出す。
 * element = 描画するセクション。言語ごとに固有のタイミングを渡したいので要素で持つ）
 */
export type SectionEntry = TransitionRunItem & {
  /** ひとつ前のセクションからの切り替え方 */
  transitionIn: Transition;
};

/**
 * セクションの入り方のプリセット。
 * 「Aメロはこう入る」という演出の決めごとなので、同じ種類のセクションで使い回す
 */
const TRANSITIONS = {
  /** 曲の頭と締め。重ねる相手がいない／バシッと切り替える */
  CUT: { kinds: [TRANSITION_KINDS.NONE], durationSec: 0 },
  /** Aメロ : ぼかしながら溶かす */
  VERSE_IN: {
    kinds: [TRANSITION_KINDS.FADE, TRANSITION_KINDS.BLUR],
    durationSec: 0.6,
  },
  /** Bメロ : 画面ごと左へ押し出す */
  PRE_CHORUS_IN: {
    kinds: [TRANSITION_KINDS.SLIDE_LEFT],
    durationSec: 0.5,
  },
  /** サビ : 寄りながら溶かす */
  CHORUS_IN: {
    kinds: [TRANSITION_KINDS.FADE, TRANSITION_KINDS.ZOOM_IN],
    durationSec: 0.5,
    zoomAmount: 0.18,
  },
  /** 間奏・アウトロ・オチ : 歌が止まる／締めに向かうので、ぼかしながらゆっくり溶かす */
  SLOW_IN: {
    kinds: [TRANSITION_KINDS.FADE, TRANSITION_KINDS.BLUR],
    durationSec: 0.5,
  },
  /** ラストサビ : 間奏から引き上げるように、引きながら溶かす */
  LAST_CHORUS_IN: {
    kinds: [TRANSITION_KINDS.FADE, TRANSITION_KINDS.ZOOM_OUT],
    durationSec: 0.25,
    zoomAmount: 0.3,
  },
} satisfies Record<string, Transition>;

/**
 * 日本語版のセクションの並び。startSec は歌詞の切れ目に合わせている。
 * それぞれの長さは次のセクションが始まるまで（最後は 曲終わり + END_PAD_SEC まで）で、
 * 切り替え演出のぶんだけ後ろに引き伸ばして次のセクションと重ねる
 */
export const SECTIONS = [
  {
    name: "00_01_Intro",
    // 背景だけを見せておく区間ぶん、曲の頭より前（動画の頭）から始める。
    // ここを 0 より後ろにすると、その分だけ背景が出ず下地の色だけになる
    startSec: -LEAD_IN_SEC,
    transitionIn: TRANSITIONS.CUT,
    element: <Intro />,
  },
  {
    name: "01_01_Verse",
    startSec: INTRO_END_SEC,
    transitionIn: TRANSITIONS.VERSE_IN,
    element: <Verse />,
  },
  {
    name: "01_02_PreChorus",
    // 「右ヨシッ」の語頭から始める
    startSec: 23.58,
    transitionIn: TRANSITIONS.PRE_CHORUS_IN,
    element: <PreChorus />,
  },
  {
    name: "01_03_Chorus",
    startSec: 39,
    transitionIn: TRANSITIONS.CHORUS_IN,
    element: <Chorus />,
  },
  {
    name: "02_01_Verse",
    // 「あっちの あなから 頭ぴょこっ」を歌っている途中から。
    // 1番のAメロ（01_01_Verse）が「頭ぴょこっ」の行の終わり約3秒前で始まるのに合わせる
    startSec: 49.44,
    transitionIn: TRANSITIONS.VERSE_IN,
    element: <Verse2 />,
  },
  {
    name: "02_02_PreChorus",
    // 「前ヨシッ」の語頭から始める
    startSec: 61.82,
    transitionIn: TRANSITIONS.PRE_CHORUS_IN,
    element: <PreChorus2 />,
  },
  {
    name: "02_03_Chorus",
    startSec: 77,
    transitionIn: TRANSITIONS.CHORUS_IN,
    element: <Chorus2 />,
  },
  {
    name: "03_01_Solo",
    // 歌が止まって間奏に入るところ
    startSec: 88.1,
    transitionIn: TRANSITIONS.SLOW_IN,
    element: <Solo />,
  },
  {
    name: "03_02_Chorus",
    startSec: 100.5,
    transitionIn: TRANSITIONS.LAST_CHORUS_IN,
    element: <Chorus3 />,
  },
  {
    name: "03_03_Outro",
    // 「どんな きけんが きたってさ」の語頭から始める
    startSec: 111.66,
    transitionIn: TRANSITIONS.SLOW_IN,
    element: <Outro />,
  },
  {
    name: "03_04_Closing",
    // 「でも ちょっとだけ...」の語頭から始める
    startSec: 124.4,
    transitionIn: TRANSITIONS.SLOW_IN,
    element: <Closing />,
  },
  {
    name: "04_01_Thanks",
    // 曲が終わってから
    startSec: 135.65,
    transitionIn: TRANSITIONS.CUT,
    element: <Thanks />,
  },
] as const satisfies readonly SectionEntry[];

/** セクションの名前。別の言語版はこれを漏れなく埋めた表で差分を書く */
export type SectionName = (typeof SECTIONS)[number]["name"];

/**
 * 曲の長さから動画の長さ（フレーム数）を出す。
 * 最後の抜けの演出ぶんまで入れておかないと、フェードしきる前に動画が終わる
 * @param lyrics その言語の歌詞データ（duration を使う）
 * @param leadInSec 曲が始まる前に背景だけを見せておく秒数
 */
export const fullDurationInFrames = (lyrics: LyricsData, leadInSec: number) =>
  Math.ceil((leadInSec + lyrics.duration + END_PAD_SEC) * FULL_VIDEO_FPS);

export type MusicVideoFullProps = {
  /** 音源（public からの相対パス）。省略時は日本語版の音源 */
  audioSrc?: string;
  /** 歌詞データ（曲頭からの秒で持つ）。省略時は日本語版の歌詞 */
  lyrics?: LyricsData;
  /**
   * 曲が始まる前に背景だけを見せておく秒数。省略時 LEAD_IN_SEC。
   * 曲・歌詞・全セクションをまとめてこのぶん後ろへずらす（Intro の leadInSec と一致させること）
   */
  leadInSec?: number;
  /** セクションの並び。省略時は日本語版の SECTIONS */
  sections?: readonly SectionEntry[];
  /**
   * 字幕だけを追加でずらす秒。省略時 0。
   * Whisper 系のアライメントは無音明けの語頭を遅めに置きがちなので、
   * その曲の字幕全体が歌に対して遅れて見えるときに負の値で前へ寄せる
   */
  subtitleOffsetSec?: number;
};

/**
 * ミュージックビデオ本体。既定値がそのまま日本語版で、
 * 別の言語版は違うところ（音源・歌詞・秒）だけを Props で渡す
 * @param param0
 * @param param0.audioSrc 音源（public からの相対パス）
 * @param param0.lyrics 歌詞データ
 * @param param0.leadInSec 曲が始まる前に背景だけを見せておく秒数
 * @param param0.sections セクションの並び
 * @param param0.subtitleOffsetSec 字幕だけを追加でずらす秒
 */
export const MusicVideoFull = ({
  audioSrc = AUDIO_JA,
  lyrics = JA_LYRICS,
  leadInSec = LEAD_IN_SEC,
  sections = SECTIONS,
  subtitleOffsetSec = 0,
}: MusicVideoFullProps) => {
  // 曲が終わってからお礼のテロップを END_PAD_SEC だけ出しておく
  const sectionsEndSec = lyrics.duration + END_PAD_SEC;

  return (
    <AbsoluteFill
      style={{
        // セクションがまだない区間に見える下地の色
        backgroundColor: "#1b2b3a",
      }}
    >
      {/* 頭の背景だけの区間が終わってから曲を鳴らす */}
      <Sequence
        from={Math.round(leadInSec * FULL_VIDEO_FPS)}
        layout="none"
        name="BGM"
      >
        <Html5Audio src={staticFile(audioSrc)} />
      </Sequence>
      {/* 歌詞は曲の頭からの秒で持っているので、音と同じだけ後ろにずらす。
          さらに曲ごとの字幕補正（subtitleOffsetSec）を足す。
          タイムラインで BGM の隣に並べたいのでセクションより前に置く
          （絵は Subtitle 側が最前面に出るので、セクションに隠れない） */}
      <MeerkatSubtitle
        mode={SUBTITLE_MODES.KARAOKE}
        offsetInSeconds={leadInSec + subtitleOffsetSec}
        lyrics={lyrics}
      />
      {/* セクションの並べ方（頭出し・重なり・抜け方のペアリング）は TransitionRun が持つ。
          セクションの境目は前後の両方がフェードする CROSS_DISSOLVE */}
      <TransitionRun
        items={sections}
        offsetSec={leadInSec}
        endSec={sectionsEndSec}
        blend={TRANSITION_BLENDS.CROSS_DISSOLVE}
      />
    </AbsoluteFill>
  );
};

const MusicVideoFullJa = () => <MusicVideoFull />;

// Composition の id は Studio の一覧とレンダーコマンドでそのまま使う名前。
// MV が増えても衝突しないよう MV-<作品名>-<尺>-<言語> で名前空間を切る。
// Remotion は id に英数字とハイフンしか許さないので、区切りはアンダースコアではなくハイフン
export const MusicVideoFullComposition = () => {
  return (
    <Composition
      id="MV-Meerkats-Full-Ja"
      component={MusicVideoFullJa}
      durationInFrames={fullDurationInFrames(JA_LYRICS, LEAD_IN_SEC)}
      fps={FULL_VIDEO_FPS}
      width={FULL_VIDEO_SIZE.width}
      height={FULL_VIDEO_SIZE.height}
    />
  );
};
