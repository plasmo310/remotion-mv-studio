import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import {
  CharaDance,
  KYOROKYORO_POSES,
} from "../components/characters/CharaDance";
import { CharaHover } from "../components/characters/CharaHover";
import { CharaBackground } from "../components/characters/CharaBackground";

/**
 * サビで横に並べるキャラの位置（画面幅に対する比率。+ で右）。
 * 数を増やしたければここに足す。中央を 0 にした左右対称の並びにしている
 */
const LINEUP_OFFSET_RATIOS = [-0.3, 0, 0.3];

/**
 * きょろきょろさせる秒数。
 * KYOROKYORO_POSES の最後のコマ（5.6秒）を少し見せてから、そのあとの見せ方へ渡す
 */
export const CHORUS_DANCE_SEC = 6.1;

/**
 * サビのきょろきょろ。同じコマ割りの CharaDance を横に並べているだけなので、
 * 全員がまったく同じ動きになる。ラストのサビからも使い回す。
 * 大きさはイントロの1匹と同じ（CharaDance の既定）にそろえていて、
 * 中央（offsetXRatio = 0）はイントロの1匹とまったく同じ見た目になる
 */
export const ChorusDance = () => {
  return (
    <>
      {LINEUP_OFFSET_RATIOS.map((offsetXRatio) => (
        <CharaDance
          key={offsetXRatio}
          poses={KYOROKYORO_POSES}
          offsetXRatio={offsetXRatio}
        />
      ))}
    </>
  );
};

/**
 * 1番のサビ。
 * イントロと同じ絵柄・同じ動きに戻して、サビが来たことを分かりやすくする。
 * イントロと違って下から出てくるところはなく、「キョロキョロ」から始める
 */
export const Chorus = () => {
  const { fps, durationInFrames } = useVideoConfig();

  // 尺が短いときは踊るところで打ち切る（浮きの Sequence が負の長さにならないように）
  const hoverStartFrame = Math.min(
    Math.round(CHORUS_DANCE_SEC * fps),
    durationInFrames,
  );

  return (
    <AbsoluteFill>
      <CharaBackground />
      <Sequence durationInFrames={hoverStartFrame} name="Dance">
        <ChorusDance />
      </Sequence>
      <Sequence
        from={hoverStartFrame}
        durationInFrames={durationInFrames - hoverStartFrame}
        name="Hover"
      >
        <CharaHover />
      </Sequence>
    </AbsoluteFill>
  );
};
