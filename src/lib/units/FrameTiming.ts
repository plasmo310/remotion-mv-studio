import { useCallback } from "react";
import { useVideoConfig } from "remotion";

// ---------------------------------------------------------------------------
// 秒で書いたタイミングを、絶対フレームへ直すときの作法。
//
// 区間（Sequence の長さ）を出すときは、必ず
//   1. 両端をそれぞれ絶対フレームへ丸める
//   2. 丸めたあとの差を長さにする
// の順で行うこと。長さのほうを先に丸めると、丸め誤差が積もって
// 区間の間に1フレームの隙間ができたり、次の区間と重なってちらついたりする。
// ---------------------------------------------------------------------------

/**
 * 秒 → 絶対フレームの変換関数を返す。
 * 返す関数は fps と offsetSec が変わらないかぎり同じものなので、
 * useMemo の依存にそのまま渡せる
 * @param offsetSec 変換の前に足す秒。頭に無音・無地の区間を挟むときに使う。省略時 0
 */
export const useSecToFrame = (offsetSec: number = 0) => {
  const { fps } = useVideoConfig();

  return useCallback(
    (sec: number) => Math.round((sec + offsetSec) * fps),
    [fps, offsetSec],
  );
};
