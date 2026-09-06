import { Img, staticFile, useVideoConfig } from "remotion";
import { CHARA_IMAGES } from "./CharaDance";
import { FloatEffect } from "../../../../lib/effects/wrappers/FloatEffect";
import { useShortSideScale } from "../../../../lib/units/ShortSideScale";

type CharaHoverProps = {
  /** 画面高さに対するキャラの大きさの比率。省略時 0.55 */
  heightRatio?: number;
};

/**
 * 宙に浮いたキャラクターをふわふわ漂わせる
 * @param param0
 * @param param0.heightRatio 画面高さに対するキャラの大きさの比率
 */
export const CharaHover = ({ heightRatio = 0.55 }: CharaHoverProps) => {
  const { height } = useVideoConfig();

  // 斜めに構えたうえ 1.6 倍に広げて見せるので、縦動画で画面高さ基準のままだと
  // 左右がはみ出す。短辺基準に読み替える（横動画では倍率 1 で変わらない）
  const size = height * heightRatio * useShortSideScale();

  return (
    <FloatEffect
      sizePx={size}
      // 絵が斜めを向いているので、そこを中心に傾きを振らせる
      baseTiltDeg={22.5}
      // 絵の余白が広く、そのままだと小さく見えるので広げて使う
      scale={1.6}
      // 切り抜きカット（Closing）と同じ落ち影を共用
      shadow={{ alpha: 0.2 }}
      // ふわふわは1フレームあたり数 px しか動かないので、これくらい遡らないと尾が見えない。
      // 刻みを空けると残像が1枚ずつ段になって見えるので、刻みは1フレームのまま枚数で伸ばす
      blur={{ layers: 15, frameOffset: 2, opacity: 0.1 }}
    >
      <Img
        src={staticFile(CHARA_IMAGES.HOVER)}
        style={{ width: "100%", height: "100%" }}
      />
    </FloatEffect>
  );
};
