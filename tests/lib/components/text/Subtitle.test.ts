import { describe, expect, it } from "vitest";
import {
  buildCharTimings,
  buildEntries,
  buildSegments,
  LyricLine,
} from "../../../../src/lib/components/text/Subtitle";

/**
 * テスト用の歌詞行を作る
 * @param text 表示する文字列
 * @param words [文字, 開始秒, 終了秒] の並び
 */
const makeLine = (
  text: string,
  words: [string, number, number][],
  index = 0,
): LyricLine => ({
  index,
  lineno: index,
  text,
  start: words[0]?.[1] ?? 0,
  end: words[words.length - 1]?.[2] ?? 0,
  interpolated: false,
  words: words.map(([word, start, end]) => ({ word, start, end })),
});

describe("buildCharTimings", () => {
  it("words の順に、text の1文字ずつへタイミングを割り当てる", () => {
    const chars = buildCharTimings(
      makeLine("ab", [
        ["a", 1, 1.5],
        ["b", 1.5, 2],
      ]),
    );

    expect(chars).toEqual([
      { char: "a", start: 1, end: 1.5 },
      { char: "b", start: 1.5, end: 2 },
    ]);
  });

  it("words に無い記号・空白は、直前の文字と同じタイミングに寄せる", () => {
    // 英語パイプラインは記号を落とすので、この形の行が実際に出てくる
    const chars = buildCharTimings(
      makeLine("a b!", [
        ["a", 1, 1.5],
        ["b", 2, 2.5],
      ]),
    );

    expect(chars).toEqual([
      { char: "a", start: 1, end: 1.5 },
      { char: " ", start: 1.5, end: 1.5 },
      { char: "b", start: 2, end: 2.5 },
      { char: "!", start: 2.5, end: 2.5 },
    ]);
  });

  it("先頭の文字が words と合わないときは行の開始に寄せる", () => {
    const chars = buildCharTimings(makeLine("♪a", [["a", 1, 1.5]]));

    expect(chars[0]).toEqual({ char: "♪", start: 1, end: 1 });
  });

  it("end が start より前に来ている壊れた word でも、長さを負にしない", () => {
    const chars = buildCharTimings(makeLine("a", [["a", 2, 1]]));

    expect(chars[0]).toEqual({ char: "a", start: 2, end: 2 });
  });
});

describe("buildSegments", () => {
  const options = { gapSec: 1.5, minSegmentSec: 1, holdOutSec: 0 };

  it("words が無い行は、行全体をひとつの区間にする", () => {
    const line = { ...makeLine("...", []), start: 3, end: 5 };

    expect(buildSegments(line, options)).toEqual([{ start: 3, end: 5 }]);
  });

  it("gapSec 未満の間しかなければ分けない", () => {
    const line = makeLine("ab", [
      ["a", 0, 1],
      ["b", 2, 3],
    ]);

    expect(buildSegments(line, options)).toEqual([{ start: 0, end: 3 }]);
  });

  it("gapSec 以上あいたところ（間奏）で区切る", () => {
    const line = makeLine("ab", [
      ["a", 0, 2],
      ["b", 5, 7],
    ]);

    expect(buildSegments(line, options)).toEqual([
      { start: 0, end: 2 },
      { start: 5, end: 7 },
    ]);
  });

  it("minSegmentSec より短い区間は捨てる（次の歌詞のちらつき対策）", () => {
    const line = makeLine("ab", [
      ["a", 0, 2],
      ["b", 5, 5.2],
    ]);

    expect(buildSegments(line, options)).toEqual([{ start: 0, end: 2 }]);
  });

  it("どの区間も短いときは、一番長いものだけ残す", () => {
    const line = makeLine("ab", [
      ["a", 0, 0.8],
      ["b", 5, 5.2],
    ]);

    expect(buildSegments(line, options)).toEqual([{ start: 0, end: 0.8 }]);
  });
});

describe("buildEntries", () => {
  const options = { gapSec: 1.5, minSegmentSec: 0, holdOutSec: 0.35 };

  it("区間の最後にだけ余韻（holdOutSec）を足す", () => {
    const line = makeLine("ab", [
      ["a", 0, 1],
      ["b", 5, 6],
    ]);
    const entries = buildEntries([line], options);

    expect(entries.map(({ start, end }) => ({ start, end }))).toEqual([
      { start: 0, end: 1 },
      { start: 5, end: 6.35 },
    ]);
  });

  it("余韻が次の行にかかるときは削って、行どうしを重ねない", () => {
    const entries = buildEntries(
      [makeLine("a", [["a", 0, 1]], 0), makeLine("b", [["b", 1.2, 2]], 1)],
      options,
    );

    expect(entries[0].end).toBe(1.2);
    expect(entries[0].end).toBeLessThanOrEqual(entries[1].start);
  });

  it("長さが残らなかった行は出さない", () => {
    const entries = buildEntries([makeLine("a", [["a", 1, 1]], 0)], {
      ...options,
      holdOutSec: 0,
    });

    expect(entries).toEqual([]);
  });
});
