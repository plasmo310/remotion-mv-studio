import { LyricsData } from "../../../lib/components/text/Subtitle";
import jaLyricsJson from "./subtitle/Lyrics.json";
import enLyricsJson from "./subtitle/en/Lyrics.json";

// 歌詞 JSON の読み込みと LyricsData への変換をここ1か所に閉じる。
// 各所で `lyricsJson as LyricsData` と書くと、JSON の形が変わってもキャストが黙って通してしまう

/** 日本語版の歌詞 */
export const JA_LYRICS = jaLyricsJson as LyricsData;

/** 英語版（"Looky Looky Meerkats"）の歌詞 */
export const EN_LYRICS = enLyricsJson as LyricsData;
