import { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { dropShadowEffect } from "../../effects/functions/DropShadowEffect";
import { loopMotionEffect } from "../../effects/functions/LoopMotionEffect";
import { useSecToFrame } from "../../units/FrameTiming";
import {
  ROUNDED_FONT_FAMILY,
  TEXT_SHADOW,
  textOutlineStyle,
} from "./TextStyle";

/**
 * 画面高さに対する文字サイズ・下端からの余白の比率。
 * 字幕とテロップの位置をそろえたい呼び出し側からも参照する
 */
export const SUBTITLE_FONT_SIZE_RATIO = 0.072;
export const SUBTITLE_BOTTOM_RATIO = 0.06;

// ---------------------------------------------------------------------------
// 歌詞データ。
// ここから「表示」の見出しまでは React にも Remotion にも依存しない純粋な計算で、
// 歌詞 JSON の手直し（記号トークンの補完）で一番壊れやすいところ。
// Subtitle.test.ts から直接呼んで確かめられるよう export している
// ---------------------------------------------------------------------------

export type LyricWord = {
  word: string;
  start: number;
  end: number;
};

export type LyricLine = {
  index: number;
  lineno: number;
  text: string;
  start: number;
  end: number;
  interpolated: boolean;
  words: LyricWord[];
};

export type LyricsData = {
  duration: number;
  offset: number;
  lines: LyricLine[];
};

/** 1文字ぶんの表示情報 */
export type CharTiming = {
  char: string;
  start: number;
  end: number;
};

/** 画面に出す歌詞のひとかたまり（1行。間奏をはさむ行は複数に分かれる） */
export type SubtitleEntry = {
  lineIndex: number;
  segmentIndex: number;
  text: string;
  start: number;
  end: number;
  chars: CharTiming[];
};

/** buildSegments / buildEntries に渡す、行の分割に使うしきい値 */
export type SegmentOptions = {
  gapSec: number;
  minSegmentSec: number;
  holdOutSec: number;
};

/**
 * text の1文字ごとに words のタイミングを割り当てる。
 * words には空白や記号が含まれないため、対応の取れない文字（空白、「？」「...」など）は
 * 直前の文字と同じタイミングに寄せる。
 */
export const buildCharTimings = (line: LyricLine): CharTiming[] => {
  const chars: CharTiming[] = [];
  let wordIndex = 0;

  for (const char of Array.from(line.text)) {
    const word = line.words[wordIndex];

    if (word && word.word === char) {
      chars.push({
        char,
        start: word.start,
        end: Math.max(word.start, word.end),
      });
      wordIndex++;
      continue;
    }

    const previous = chars[chars.length - 1];
    const at = previous ? previous.end : line.start;
    chars.push({ char, start: at, end: at });
  }

  return chars;
};

/**
 * 文字の並びを、空白で区切ったかたまりに分ける。
 * カラオケ表示は1文字ずつ span に分けて塗るため、そのまま折り返すと
 * 「キョロキョロキョロ キョ / ロキョロ」のように語の途中で改行されてしまう。
 * かたまり単位で折り返せば、画面幅に収まらないときも歌詞の空白の位置で改行される
 */
const buildCharGroups = (chars: CharTiming[]): CharTiming[][] => {
  const groups: CharTiming[][] = [];
  let current: CharTiming[] = [];

  for (const charTiming of chars) {
    current.push(charTiming);

    // 空白は「ここで改行してよい」という印。
    // 次の行の頭が空白で始まらないよう、直前のかたまりの末尾に付けたまま切る
    if (charTiming.char.trim() === "") {
      groups.push(current);
      current = [];
    }
  }

  if (current.length > 0) {
    groups.push(current);
  }

  return groups;
};

/**
 * 1行を、歌っている区間ごとに分割する。
 * 行の途中に長い無音（間奏）を含む行があるため、そこで区切って表示を消す。
 */
export const buildSegments = (
  line: LyricLine,
  options: SegmentOptions,
): { start: number; end: number }[] => {
  if (line.words.length === 0) {
    return [{ start: line.start, end: line.end }];
  }

  const segments: { start: number; end: number }[] = [];
  let start = line.words[0].start;
  let end = line.words[0].end;

  for (const word of line.words.slice(1)) {
    if (word.start - end >= options.gapSec) {
      segments.push({ start, end });
      start = word.start;
    }

    end = Math.max(end, word.end);
  }

  segments.push({ start, end });

  if (segments.length === 1) {
    return segments;
  }

  // 短すぎる区間（ちらつきの原因）を捨てる。すべて短い場合は一番長いものだけ残す
  const longEnough = segments.filter(
    (segment) => segment.end - segment.start >= options.minSegmentSec,
  );

  if (longEnough.length > 0) {
    return longEnough;
  }

  return [
    segments.reduce((longest, segment) =>
      segment.end - segment.start >= longest.end - longest.start
        ? segment
        : longest,
    ),
  ];
};

export const buildEntries = (
  lines: LyricLine[],
  options: SegmentOptions,
): SubtitleEntry[] => {
  const entries: SubtitleEntry[] = [];

  for (const line of lines) {
    const chars = buildCharTimings(line);
    const segments = buildSegments(line, options);

    segments.forEach((segment, segmentIndex) => {
      const isLastSegment = segmentIndex === segments.length - 1;

      entries.push({
        lineIndex: line.index,
        segmentIndex,
        text: line.text,
        start: segment.start,
        end: segment.end + (isLastSegment ? options.holdOutSec : 0),
        chars,
      });
    });
  }

  // 余韻で次の歌詞と重ならないようにする
  for (let i = 0; i < entries.length - 1; i++) {
    entries[i].end = Math.min(entries[i].end, entries[i + 1].start);
  }

  return entries.filter((entry) => entry.end > entry.start);
};

// ---------------------------------------------------------------------------
// 表示
// ---------------------------------------------------------------------------

/**
 * 字幕モード
 * KARAOKE: 歌に合わせて1文字ずつ塗っていく
 * LINE: 行ごとにまとめて表示するだけ（文字単位の演出なし）
 */
export const SUBTITLE_MODES = {
  KARAOKE: "karaoke",
  LINE: "line",
} as const;

export type SubtitleMode = (typeof SUBTITLE_MODES)[keyof typeof SUBTITLE_MODES];

/**
 * 見た目まわりを1つにまとめた、解決済みの設定。
 * Props は個別の任意項目で受け取り、既定値で埋めてからこの形で子へ配る
 */
type SubtitleTheme = {
  fontFamily: string;
  fontSizeRatio: number;
  bottomRatio: number;
  strokeWidthRatio: number;
  baseColor: string;
  sungColor: string;
  strokeColor: string;
  lineColor: string;
};

type SubtitleProps = {
  /** 表示する歌詞データ。曲ごとに差し替える */
  lyrics: LyricsData;
  /** 表示モード。省略時はカラオケ（1文字ずつ塗る） */
  mode?: SubtitleMode;
  /** 歌詞全体のタイミング補正（秒）。+ で遅く、- で早くなる。省略時 0 */
  offsetInSeconds?: number;
  /** 1行の途中でこれ以上間があいたら歌詞を消す長さ（秒。間奏対策）。省略時 1.5 */
  gapSec?: number;
  /**
   * 分割された区間がこれより短ければ表示しない（秒）。省略時 1.2。
   * 認識ミスで行の先頭の数文字だけが本来より前に割り当てられていることがあり、
   * そのままだと次の歌詞が一瞬ちらっと見えてしまうため
   */
  minSegmentSec?: number;
  /** 歌い終わってから消えるまでの余韻（秒）。省略時 0.35 */
  holdOutSec?: number;
  /** フェードイン / フェードアウトの長さ（秒）。省略時 0.15 */
  fadeSec?: number;
  /**
   * フォントファミリー。省略時は ROUNDED_FONT_FAMILY（同梱の M PLUS Rounded 1c）。
   * 別の字体を渡す場合は、その読み込みを呼び出し側で行う
   */
  fontFamily?: string;
  /** 画面高さに対する文字サイズの比率。省略時 SUBTITLE_FONT_SIZE_RATIO */
  fontSizeRatio?: number;
  /** 画面高さに対する下端からの余白の比率。省略時 SUBTITLE_BOTTOM_RATIO */
  bottomRatio?: number;
  /**
   * 文字サイズに対するアウトラインの太さの比率。0 で縁取りなし。省略時 0.2。
   * 縁は文字の輪郭を中心に描かれ、内側半分は塗りで隠れるため、
   * 見た目の太さは指定値のおよそ半分になる
   */
  strokeWidthRatio?: number;
  /** まだ歌っていない文字の色。省略時 白 */
  baseColor?: string;
  /** 歌い終わった文字の色。省略時 黄色 */
  sungColor?: string;
  /** 縁取りの色。省略時 黒 */
  strokeColor?: string;
  /** mode="line" のときの文字色。省略時は baseColor と同じ */
  lineColor?: string;
};

/**
 * 歌詞を字幕として表示する。曲・見た目に依存する値はすべて Props で差し替えられ、
 * 省略時は白文字＋黄色で塗る既定の見た目になる
 * @param param0
 * @param param0.lyrics 表示する歌詞データ
 * @param param0.mode 表示モード（1文字ずつ塗る / 行ごと）
 * @param param0.offsetInSeconds 歌詞全体のタイミング補正（秒）
 * @param param0.gapSec 1行の途中で歌詞を消す無音の長さ（秒）
 * @param param0.minSegmentSec これより短い区間は表示しない（秒）
 * @param param0.holdOutSec 歌い終わってから消えるまでの余韻（秒）
 * @param param0.fadeSec フェードイン / フェードアウトの長さ（秒）
 * @param param0.fontFamily フォントファミリー（既定以外は呼び出し側で読み込む）
 * @param param0.fontSizeRatio 画面高さに対する文字サイズの比率
 * @param param0.bottomRatio 画面高さに対する下端からの余白の比率
 * @param param0.strokeWidthRatio 文字サイズに対するアウトラインの太さの比率
 * @param param0.baseColor まだ歌っていない文字の色
 * @param param0.sungColor 歌い終わった文字の色
 * @param param0.strokeColor 縁取りの色
 * @param param0.lineColor mode="line" のときの文字色
 */
export const Subtitle = ({
  lyrics,
  mode = SUBTITLE_MODES.KARAOKE,
  offsetInSeconds = 0,
  gapSec = 1.5,
  minSegmentSec = 1.2,
  holdOutSec = 0.35,
  fadeSec = 0.15,
  fontFamily = ROUNDED_FONT_FAMILY,
  fontSizeRatio = SUBTITLE_FONT_SIZE_RATIO,
  bottomRatio = SUBTITLE_BOTTOM_RATIO,
  strokeWidthRatio = 0.2,
  baseColor = "#ffffff",
  sungColor = "#ffd45e",
  strokeColor = "#000000",
  lineColor,
}: SubtitleProps) => {
  const entries = useMemo(
    () => buildEntries(lyrics.lines, { gapSec, minSegmentSec, holdOutSec }),
    [lyrics, gapSec, minSegmentSec, holdOutSec],
  );
  const timeOffset = lyrics.offset + offsetInSeconds;
  const toFrame = useSecToFrame(timeOffset);

  const theme: SubtitleTheme = {
    fontFamily,
    fontSizeRatio,
    bottomRatio,
    strokeWidthRatio,
    baseColor,
    sungColor,
    strokeColor,
    lineColor: lineColor ?? baseColor,
  };

  // 開始・終了の両方を絶対フレームに丸めてから区間を作る
  const ranges = useMemo(() => {
    const result = entries.map((entry) => ({
      from: toFrame(entry.start),
      to: toFrame(entry.end),
    }));

    // 丸めた結果で次の行と重なったら、重なりぶんを削って1フレームも重ねない
    for (let i = 0; i < result.length - 1; i++) {
      result[i].to = Math.min(result[i].to, result[i + 1].from);
    }

    return result;
  }, [entries, toFrame]);

  return (
    // 行ごとの Sequence が Studio のタイムラインに直に並ぶと曲全体の並びが見えなくなるので、
    // 名前をつけた入れ物でまとめる（layout="none" なので描画には出ない）
    <Sequence name="Subtitle" layout="none">
      {/* 字幕は同じ階層の中で最前面。こうしておくと呼び出し側は
          「絵の重なり」ではなく「タイムラインでの並び」で置く場所を決められる */}
      <AbsoluteFill style={{ zIndex: 1 }}>
        {entries.map((entry, entryIndex) => {
          const { from, to } = ranges[entryIndex];
          const durationInFrames = to - from;

          if (durationInFrames <= 0) {
            return null;
          }

          return (
            <Sequence
              key={`${entry.lineIndex}-${entry.segmentIndex}`}
              from={from}
              durationInFrames={durationInFrames}
              name={`Lyric ${entry.lineIndex}: ${entry.text}`}
            >
              <SubtitleLine
                entry={entry}
                mode={mode}
                startInFrames={from}
                timeOffset={timeOffset}
                fadeSec={fadeSec}
                theme={theme}
              />
            </Sequence>
          );
        })}
      </AbsoluteFill>
    </Sequence>
  );
};

type SubtitleLineProps = {
  entry: SubtitleEntry;
  mode: SubtitleMode;
  startInFrames: number;
  timeOffset: number;
  fadeSec: number;
  theme: SubtitleTheme;
};

const SubtitleLine = ({
  entry,
  mode,
  startInFrames,
  timeOffset,
  fadeSec,
  theme,
}: SubtitleLineProps) => {
  const frame = useCurrentFrame();
  const { fps, height, durationInFrames } = useVideoConfig();

  // 曲の先頭からの時間（歌詞データと同じ時間軸）
  const timeInSeconds = (startInFrames + frame) / fps - timeOffset;

  const fontSize = height * theme.fontSizeRatio;

  // 行の登場アニメーション
  const enter = spring({
    frame,
    fps,
    config: { damping: 18, mass: 0.5 },
    durationInFrames: Math.min(14, durationInFrames),
  });

  const fadeFrames = Math.max(
    1,
    Math.min(Math.round(fadeSec * fps), Math.floor(durationInFrames / 3)),
  );
  const opacity =
    durationInFrames >= fadeFrames * 3
      ? interpolate(
          frame,
          [0, fadeFrames, durationInFrames - fadeFrames, durationInFrames],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      : 1;

  const outline = textOutlineStyle(
    fontSize,
    theme.strokeWidthRatio,
    theme.strokeColor,
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: height * theme.bottomRatio,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: "88%",
          fontFamily: theme.fontFamily,
          fontSize,
          fontWeight: 700,
          lineHeight: 1.3,
          opacity,
          transform: `translateY(${(1 - enter) * fontSize * 0.45}px) scale(${
            0.94 + enter * 0.06
          })`,
          filter: dropShadowEffect(fontSize, TEXT_SHADOW),
        }}
      >
        {mode === SUBTITLE_MODES.KARAOKE ? (
          buildCharGroups(entry.chars).map((group, groupIndex) => (
            <div
              key={groupIndex}
              style={{
                display: "flex",
                // かたまりの中では折り返さないのが基本だが、
                // かたまり1つで画面幅を超えるときだけは、はみ出すより折り返す
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {group.map((charTiming, charIndex) => (
                <SubtitleChar
                  key={charIndex}
                  charTiming={charTiming}
                  timeInSeconds={timeInSeconds}
                  fontSize={fontSize}
                  outline={outline}
                  baseColor={theme.baseColor}
                  sungColor={theme.sungColor}
                />
              ))}
            </div>
          ))
        ) : (
          <span
            style={{
              ...outline,
              // 行表示も同じく、画面幅に収まらないときは空白の位置だけで改行する。
              // keep-all がないと、日本語は文字と文字の間ならどこでも改行されてしまう
              whiteSpace: "pre-wrap",
              wordBreak: "keep-all",
              color: theme.lineColor,
            }}
          >
            {entry.text}
          </span>
        )}
      </div>
    </AbsoluteFill>
  );
};

type SubtitleCharProps = {
  charTiming: CharTiming;
  timeInSeconds: number;
  fontSize: number;
  outline: React.CSSProperties;
  baseColor: string;
  sungColor: string;
};

/**
 * 字幕の1文字
 * @param param0
 * @param param0.charTiming 文字1つ分の表示タイミング（開始・終了秒とその文字）
 * @param param0.timeInSeconds 曲の先頭からの経過時間（秒）。塗り具合の判定に使う
 * @param param0.fontSize フォントサイズ（px）。跳ねる演出の振れ幅にも使う
 * @param param0.outline 縁取りなど文字に共通するスタイル
 * @param param0.baseColor まだ歌っていない文字の色
 * @param param0.sungColor 歌い終わった文字の色
 */
const SubtitleChar = ({
  charTiming,
  timeInSeconds,
  fontSize,
  outline,
  baseColor,
  sungColor,
}: SubtitleCharProps) => {
  const { char, start, end } = charTiming;

  // 歌い終えた割合（0 → 1）。長さのない文字は瞬時に切り替える
  const progress =
    end > start
      ? interpolate(timeInSeconds, [start, end], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : timeInSeconds >= end
        ? 1
        : 0;

  // 歌っている最中の文字だけ少し跳ねさせる
  const bump = loopMotionEffect.bump(progress);

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        whiteSpace: "pre",
        transform: `translateY(${-bump * fontSize * 0.08}px) scale(${
          1 + bump * 0.12
        })`,
      }}
    >
      <span style={{ ...outline, color: baseColor }}>{char}</span>
      {/* 歌った分だけ左から色を塗り重ねる（カラオケ風） */}
      <span
        style={{
          ...outline,
          position: "absolute",
          left: 0,
          top: 0,
          width: `${progress * 100}%`,
          overflow: "hidden",
          whiteSpace: "pre",
          color: sungColor,
        }}
      >
        {char}
      </span>
    </span>
  );
};
