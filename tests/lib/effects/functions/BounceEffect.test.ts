import { describe, expect, it } from "vitest";
import { bounceEffect } from "../../../../src/lib/effects/functions/BounceEffect";

describe("bounceEffect", () => {
  it("跳ね始めと跳ね終わりは変形しない", () => {
    expect(bounceEffect(0, 100)).toContain("scale(1, 1)");
    expect(bounceEffect(1, 100)).toContain("scale(1, 1)");
  });

  it("頂点では持ち上げたぶんだけ縦に伸び、横に縮む", () => {
    expect(bounceEffect(0.5, 100)).toBe("translateY(-4px) scale(0.97, 1.03)");
  });

  it("持ち上げ量・伸縮量は絵の表示サイズに比例する", () => {
    expect(bounceEffect(0.5, 200)).toContain("translateY(-8px)");
  });

  it("options で跳ね方を上書きできる", () => {
    expect(bounceEffect(0.5, 100, { liftRatio: 0.1, stretchRatio: 0 })).toBe(
      "translateY(-10px) scale(1, 1)",
    );
  });
});
