import { useVideoConfig } from "remotion";

/**
 * 「画面高さに対する比率」を「画面の短辺に対する比率」に読み替えるための倍率。
 *
 * このプロジェクトの大きさはほぼすべて画面高さ基準で決めているが、
 * それは 16:9（短辺 = 高さ）を前提にした書き方になっている。
 * 9:16 のショート動画にそのまま持っていくと、高さが長辺になるぶん
 * 何もかもが画面幅からはみ出すので、はみ出しては困るものにこれを掛ける。
 *
 * 横動画では 1 を返すので、掛けても本編の見た目は変わらない
 */
export const useShortSideScale = () => {
  const { width, height } = useVideoConfig();

  return Math.min(width, height) / height;
};
