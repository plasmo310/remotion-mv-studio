// ---------------------------------------------------------------------------
// キャプチャで使う見本アセット。stories/SampleAssets.ts と同じものを借りている
// （stories/ は Storybook の道具立てなので、こちらから import せず並べて持つ）。
// ---------------------------------------------------------------------------

export const SAMPLE = {
  /** 切り抜き（透過 PNG・正方形） */
  cutout: "assets/meerkat/images/Char_01_Front.png",
  /** 背景にばらまく飾り */
  prop: "assets/meerkat/images/Prop_01.png",
  /** 画面いっぱいに敷く1枚絵 */
  arts: [
    "assets/meerkat/images/Art_01.png",
    "assets/meerkat/images/Art_10.png",
    "assets/meerkat/images/Art_11.png",
  ],
  /** コマ送りの並び */
  danceFrames: [
    { src: "assets/meerkat/images/Char_01_Dance_01.png" },
    { src: "assets/meerkat/images/Char_01_Dance_02.png" },
  ],
  /** グリーンバック動画と、その素材尺（秒） */
  movie: "assets/meerkat/movie/AS_Char_01_Dance_01.mp4",
  movieDurationSec: 5.16,
};
