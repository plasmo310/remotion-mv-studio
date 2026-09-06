import { describe, expect, it } from "vitest";
import { dropShadowEffect } from "../../../../src/lib/effects/functions/DropShadowEffect";

describe("dropShadowEffect", () => {
  it("既定値では表示サイズに比例したオフセット・ぼかしになる", () => {
    expect(dropShadowEffect(100)).toBe(
      "drop-shadow(0 1.5px 3px rgba(0, 0, 0, 0.35))",
    );
  });

  it("表示サイズが倍になれば影も倍になる（見た目の比率がそろう）", () => {
    expect(dropShadowEffect(200)).toBe(
      "drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35))",
    );
  });

  it("options で濃さだけを上書きできる", () => {
    expect(dropShadowEffect(100, { alpha: 0.2 })).toBe(
      "drop-shadow(0 1.5px 3px rgba(0, 0, 0, 0.2))",
    );
  });
});
