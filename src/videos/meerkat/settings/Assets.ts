// ---------------------------------------------------------------------------
// この MV（ミーアキャット）のアセットのうち、**2か所以上から参照するもの**。
// 1つのカットでしか使わない1枚絵（Art_10.png など）は、カット定義に直接書く。
// キャラクターの絵柄は characters/CharaDance.tsx の CHARA_IMAGES にある。
// ---------------------------------------------------------------------------

/** 日本語版の音源。本編（MusicVideoFull）とショート（MusicVideoShort）で使う */
export const AUDIO_JA = "assets/meerkat/audio/kyorokyoro_meerkat.wav";

/**
 * 英語版の音源。本編（MusicVideoFullEn）とショート（MusicVideoShortEn）で使う。
 * ファイル名のスペルが meercats（ほかは meerkat）なので、手書きすると片方だけ直して壊れる
 */
export const AUDIO_EN = "assets/meerkat/audio/en/looky_looky_meercats.wav";

/** 英語版のロゴ。2:1（日本語は 3:1）なので、置く側で幅比率を下げて高さをそろえる */
export const LOGO_EN = "assets/meerkat/images/en/Logo_01_en.png";

/** Aメロ・Bメロで下地に敷く1枚絵 */
export const BACKGROUND_ART = "assets/meerkat/images/BG_05.png";

/** アウトロとお礼で続けて出す、締めの1枚絵 */
export const ENDING_ART = "assets/meerkat/images/Art_21.png";
