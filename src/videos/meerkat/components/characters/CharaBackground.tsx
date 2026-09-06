import { SimpleBackground } from "../../../../lib/components/background/SimpleBackground";
import { useShortSideScale } from "../../../../lib/units/ShortSideScale";

/**
 * キャラクター系セクション（イントロ・サビ）の背景。
 * 汎用の SimpleBackground に、ピンク＋Prop_01 の見た目を固定して渡すだけ。
 * オチ（Closing）の背景も同じシードを使い、曲の頭と終わりで飾りの配置をそろえる
 */
export const CharaBackground = () => {
  // 飾りの大きさは画面高さ基準なので、縦動画ではそのままだと大きすぎて
  // 横に並んだ飾り同士が重なる。短辺基準に読み替える（横動画では変わらない）
  const shortSideScale = useShortSideScale();

  return (
    <SimpleBackground
      backgroundColor="#FD94AC"
      propSrc="assets/meerkat/images/Prop_01.png"
      seed="meerkat-prop"
      propSizeRatioMin={0.15 * shortSideScale}
      propSizeRatioMax={0.25 * shortSideScale}
      rotationSecMin={12}
      rotationSecMax={16}
      propOpacity={0.95}
    />
  );
};
