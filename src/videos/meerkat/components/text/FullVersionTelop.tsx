import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import { WiggleEffect } from "../../../../lib/effects/wrappers/WiggleEffect";
import { usePopIn } from "../../../../lib/effects/functions/PopInEffect";
import { MeerkatTelop } from "./MeerkatTelop";
import { useShortSideScale } from "../../../../lib/units/ShortSideScale";
import { SUBTITLE_FONT_SIZE_RATIO } from "./MeerkatSubtitle";

type FullVersionTelopProps = {
  /** 出す文言。省略時「フルバージョンは 概要欄から」 */
  text?: string;
};

/**
 * ショート動画から本編（フルバージョン）へ誘導するテロップ。
 * 書体・白文字＋茶色の縁取りは歌詞（字幕）にそろえて、同じ作品の文字として見せる
 * @param param0
 * @param param0.text 出す文言
 */
export const FullVersionTelop = ({
  text = "フルバージョンは 概要欄から",
}: FullVersionTelopProps) => {
  const { height } = useVideoConfig();

  // 歌詞とまったく同じ大きさにして、字幕の続きとして読ませる。
  // 縦動画では画面高さ基準のままだと大きすぎるので、字幕と同じく短辺基準に読み替える
  const fontSize = height * SUBTITLE_FONT_SIZE_RATIO * useShortSideScale();

  // 下から跳ね上げて出す。行き過ぎてから戻るバネで、浮きの止まった画に動きを足す
  const enter = usePopIn();

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        // ショートは下端の 300px ほどにタイトル・チャンネル名が重なるので、
        // そこを避けた高さに置く（本編の字幕は 0.06 = 下から 115px で、そのままだと隠れる）
        paddingBottom: height * 0.2,
        opacity: enter,
      }}
    >
      <WiggleEffect
        // 目を引かせたいので、ロゴ（2度 / 2秒）より速く、伸縮も足して揺らす
        rotateDeg={1.5}
        rotateSec={2.4}
        offsetPx={[0, 6]}
        offsetSec={[5, 3]}
        scaleAmount={0.03}
        scaleSec={2.4}
        // 1行のままだと右のボタン列（右 160px ほど）に文字端が届くので、
        // ここで頭打ちにして「フルバージョンは / 概要欄から」と空白で折り返させる
        style={{ maxWidth: "70%" }}
      >
        <MeerkatTelop
          text={text}
          fontSize={fontSize}
          style={{
            textAlign: "center",
            lineHeight: 1.3,
            transform: `translateY(${interpolate(
              enter,
              [0, 1],
              [fontSize * 0.8, 0],
            )}px)`,
          }}
        />
      </WiggleEffect>
    </AbsoluteFill>
  );
};
