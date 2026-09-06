import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { MovieCut } from "../../../lib/components/cuts/MovieCut";
import { CharaBackground } from "../components/characters/CharaBackground";
import { CHORUS_DANCE_SEC, ChorusDance } from "./01_03_Chorus";

/**
 * ラストのサビ。
 * きょろきょろまでは1番・2番のサビと同じで、
 * そのあとは浮かせる代わりにダンスの動画に切り替えて締めへ向かわせる
 */
export const Chorus3 = () => {
  const { fps, durationInFrames } = useVideoConfig();

  // 0.02 は1フレーム（0.033 秒）より短い引き算で、丸めた結果を1フレームだけ手前に倒すためのもの
  // （6.1 * 30 = 183 → 6.08 * 30 = 182）。ダンスの最後の1コマを見せずに動画へ渡す。
  // 尺が短いときは踊るところで打ち切る（動画の Sequence が負の長さにならないように）
  const movieStartFrame = Math.min(
    Math.round((CHORUS_DANCE_SEC - 0.02) * fps),
    durationInFrames,
  );

  return (
    <AbsoluteFill>
      <CharaBackground />
      <Sequence durationInFrames={movieStartFrame} name="Dance">
        <ChorusDance />
      </Sequence>
      <Sequence
        from={movieStartFrame}
        durationInFrames={durationInFrames - movieStartFrame}
        name="DanceMovie"
      >
        {/* グリーンバック素材。durationSec は素材尺で、この長さで区切って繰り返す */}
        <MovieCut
          src="assets/meerkat/movie/AS_Char_01_Dance_01.mp4"
          durationSec={5.16}
          speed={0.925}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
