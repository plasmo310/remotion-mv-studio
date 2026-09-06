// ---------------------------------------------------------------------------
// ストーリーで使う見本アセット。
// lib は特定の MV を知らないが、見本の絵を別に用意しても増えるだけなので、
// public/assets/meerkat/ のものを借りている（ここ1か所にまとめて、各ストーリーから読む）。
// ---------------------------------------------------------------------------

/** 切り抜き（透過 PNG・正方形）。CutoutStage / FloatEffect / GlitchEffect 用 */
export const SAMPLE_CUTOUT = "assets/meerkat/images/Char_01_Front.png";

/** 背景にばらまく飾り。SimpleBackground 用 */
export const SAMPLE_PROP = "assets/meerkat/images/Prop_01.png";

/** 画面いっぱいに敷く1枚絵。ImageCuts / Transition 用 */
export const SAMPLE_ARTS = [
  "assets/meerkat/images/Art_01.png",
  "assets/meerkat/images/Art_10.png",
  "assets/meerkat/images/Art_11.png",
];

/** コマ送りの並び。FrameAnimation 用 */
export const SAMPLE_DANCE_FRAMES = [
  { src: "assets/meerkat/images/Char_01_Dance_01.png" },
  { src: "assets/meerkat/images/Char_01_Dance_02.png" },
];

/** グリーンバック動画。MovieCut 用 */
export const SAMPLE_MOVIE = "assets/meerkat/movie/AS_Char_01_Dance_01.mp4";

/** 上の動画の素材尺（秒） */
export const SAMPLE_MOVIE_DURATION_SEC = 5.16;
