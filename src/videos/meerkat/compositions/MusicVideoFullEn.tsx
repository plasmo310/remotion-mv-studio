import { Composition } from "remotion";
import { AUDIO_EN, LOGO_EN } from "../settings/Assets";
import { EN_LYRICS } from "../data/Lyrics";
import {
  MusicVideoFull,
  fullDurationInFrames,
  FULL_VIDEO_FPS,
  FULL_VIDEO_SIZE,
  SECTIONS,
  SectionEntry,
  SectionName,
} from "./MusicVideoFull";
import { Intro } from "../sections/00_01_Intro";
import { Verse } from "../sections/01_01_Verse";
import { PreChorus } from "../sections/01_02_PreChorus";
import { PreChorus2 } from "../sections/02_02_PreChorus";
import { Thanks } from "../sections/04_01_Thanks";

// ---------------------------------------------------------------------------
// 英語版（"Looky Looky Meerkats"）。絵・演出・並び・入り方は日本語版（MusicVideoFull.tsx）と同じで、
// このファイルが持つのは日本語版との差分（頭出しの秒・テイク固有のタイミング・文言）だけ。
// 音源・歌詞・ロゴのパスは Assets.ts / data/Lyrics.ts にあり、ショート（MusicVideoShortEn）も同じものを読む。
// テイク固有のタイミングはショートでも使うので、ここから export する。
// ---------------------------------------------------------------------------

/**
 * 動画の頭に置く、背景だけを流しておく区間の秒数（日本語版の LEAD_IN_SEC は 1.0）。
 * 本編で使う。ショートは頭の無地を切り詰めるので SHORT_LEAD_IN_SEC（別の値）を使う。
 */
export const EN_LEAD_IN_SEC = 1;

/**
 * イントロのキャラ登場（PopUp）を、曲頭よりさらに何秒あとにするか。
 * 英語テイクは登場〜きょろきょろの動きが曲頭ぴったりより 0.75 秒あとで合う。
 * 背景（CharaBackground）はイントロのセクション頭から出るので、
 * これを足しても動画の頭の無地は増えない（登場だけが後ろへずれる）。
 */
export const EN_INTRO_POPUP_DELAY_SEC = 0.75;

/**
 * イントロの終わり（曲頭からの秒 = Aメロ本体が始まる秒）。
 * 本編の 01_01_Verse の頭出し、およびショートの切り出し範囲に使う。
 */
export const EN_INTRO_END_SEC = 12.6;

/**
 * 字幕だけを追加でずらす秒。
 * 英語のアライメントは無音明けの語頭を遅めに置きがちなので、負の値で字幕全体を前へ寄せる。
 */
export const EN_SUBTITLE_OFFSET_SEC = -0.25;

/**
 * 英語版のセクションの頭出しと、日本語の既定タイミングのままでは破綻する要素の差し替え。
 * 並び・入り方・既定の絵は MusicVideoFull.tsx の SECTIONS のままなので、ここには書かない。
 * 手直しした歌詞 JSON（src/videos/meerkat/data/subtitle/en/Lyrics.json）の行位置に合わせてあり、
 * Remotion Studio で英語音源の波形・耳に合わせてさらに追い込む前提。
 * 名前をキーにした表なので、セクションを足し忘れる・名前を間違えると型エラーになる
 */
const EN_TAKES: Record<
  SectionName,
  { startSec: number; element?: React.ReactNode }
> = {
  "00_01_Intro": {
    // 動画の頭（フレーム0）から背景を出す。ここを 0 より後ろにすると、その分だけ背景が出ず下地の色だけになる
    startSec: -EN_LEAD_IN_SEC,
    // Intro に渡す leadInSec は「セクション頭から PopUp までの秒数」。
    // EN_LEAD_IN_SEC（曲頭までの無地）＋ EN_INTRO_POPUP_DELAY_SEC（登場を曲頭よりさらに遅らせる）。
    // 背景はセクション頭から出るので、遅らせても動画の頭の無地は増えない
    element: (
      <Intro
        leadInSec={EN_LEAD_IN_SEC + EN_INTRO_POPUP_DELAY_SEC}
        logoSrc={LOGO_EN}
        logoWidthRatio={0.32}
      />
    ),
  },
  "01_01_Verse": {
    // イントロは長めにとって浮き＋ロゴを見せきる。EN_INTRO_END_SEC（12.6）は
    // 英語の Aメロ本体（"Poppin' up from a little hole"）が始まる秒で、歌詞 JSON もそこへ寄せた。
    // ここを変えるときは EN_INTRO_END_SEC を変える（ショートの切り出しにも効く）
    startSec: EN_INTRO_END_SEC,
    // Art_01（頭ぴょこっ）は "Poppin' up from a little hole" の "hole"（音源で 14.5s、
    // セクション頭 12.6 から 1.9s）に合わせて寄り始める。日本語の既定値（2.5）だと早すぎる
    element: <Verse artCutStartSec={1.9} />,
  },
  "01_02_PreChorus": {
    // "Right! Left! All clear!"（23.68）の語頭
    startSec: 23.6,
    // カットの拍を Right(0.0) / Left(0.84) / All clear(1.38) / But we can't…(3.3) に合わせる
    element: <PreChorus cutStartSecs={[0, 0.84, 1.38, 3.3]} />,
  },
  // フック "Looky looky looky"。2番サビの譜割りから逆算して 36.18 開始（歌詞 JSON も同じ）
  "01_03_Chorus": { startSec: 36.6 },
  "02_01_Verse": {
    // 2番Aメロ本体（"Poppin' up from another hole" 46〜、歌詞 JSON をそこへ寄せ直した）の少し手前。
    // "Poppin'"（元データの 42.0）に合わせると1番サビの Hover が潰れて2番Aメロ頭と重なる
    startSec: 47,
  },
  "02_02_PreChorus": {
    // "Front! Back! Not clear?!"（58.83）の語頭
    startSec: 58.7,
    // Front(0.0) / Back(0.8) / Not clear?!(1.3) / But we're ready…(3.44) / Quietly hide away…(8.38)
    element: <PreChorus2 cutStartSecs={[0, 0.8, 1.3, 3.44, 8.38]} />,
  },
  // "Looky looky looky..."（71.29）
  "02_03_Chorus": { startSec: 71.65 },
  // 間奏。2番サビのフック（〜77.1）のあと。歌詞 JSON の "Looky…" は
  // ラストサビ本体（フック頭 94.74）へ2番サビの譜割りで寄せ直したので、この区間は字幕なし
  "03_01_Solo": { startSec: 83.2 },
  // ラストサビ。きょろきょろ → ダンス動画。フックのボーカルは 94.74〜（"watchin'" 99.02 から逆算）。
  // "Looky looky looky / Looky looky" がきょろきょろ中に、"watchin' meerkats" が動画側に乗るよう頭出し
  "03_02_Chorus": { startSec: 95.0 },
  // "Whatever danger comes our way"（100.64）
  "03_03_Outro": { startSec: 100.6 },
  // "We look around for everyone" 〜 "My neck is stiff..."（109.05〜）
  "03_04_Closing": { startSec: 113.5 },
  "04_01_Thanks": {
    // 最終歌詞（118.84）の後、アウトロ演奏に重ねて
    startSec: 124.5,
    element: <Thanks text="Thanks for watching!!" />,
  },
};

/** 日本語版の並びに、英語版の秒と差し替える要素だけを上書きしたもの */
const SECTIONS_EN: SectionEntry[] = SECTIONS.map((section) => ({
  ...section,
  ...EN_TAKES[section.name],
}));

const MusicVideoFullEn = () => (
  <MusicVideoFull
    audioSrc={AUDIO_EN}
    lyrics={EN_LYRICS}
    leadInSec={EN_LEAD_IN_SEC}
    sections={SECTIONS_EN}
    subtitleOffsetSec={EN_SUBTITLE_OFFSET_SEC}
  />
);

export const MusicVideoFullEnComposition = () => {
  return (
    <Composition
      id="MV-Meerkats-Full-En"
      component={MusicVideoFullEn}
      durationInFrames={fullDurationInFrames(EN_LYRICS, EN_LEAD_IN_SEC)}
      fps={FULL_VIDEO_FPS}
      width={FULL_VIDEO_SIZE.width}
      height={FULL_VIDEO_SIZE.height}
    />
  );
};
