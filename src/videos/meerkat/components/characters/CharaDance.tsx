import {
  AnimationFrame,
  AnimationPose,
  AnimationPoseCue,
  FrameAnimation,
  toAnimationPoses,
} from "../../../../lib/components/cuts/FrameAnimation";
import { BeatTempo } from "../../../../lib/units/BeatTiming";
import { bounceEffect } from "../../../../lib/effects/functions/BounceEffect";
import { GlitchEffect } from "../../../../lib/effects/wrappers/GlitchEffect";

// ---------------------------------------------------------------------------
// 絵柄とコマの並び
// ---------------------------------------------------------------------------

/** キャラクターの絵柄。呼び出し側に生のパスを書かせないためまとめておく */
export const CHARA_IMAGES = {
  FRONT: "assets/meerkat/images/Char_01_Front.png",
  MIHARI: "assets/meerkat/images/Char_01_Mihari.png",
  HOVER: "assets/meerkat/images/Char_01_Hover.png",
} as const;

/**
 * 繰り返し表示するコマ。
 * 正面 → 見張り → 見張り（左右反転）の3コマで、左右をきょろきょろ見ている動きになる
 */
const DANCE_FRAMES: AnimationFrame[] = [
  { src: CHARA_IMAGES.FRONT },
  { src: CHARA_IMAGES.MIHARI },
  { src: CHARA_IMAGES.MIHARI, flipped: true },
];

/**
 * 「キョロキョロ〜ミーアキャット」の歌詞に合わせたコマの切り替え。
 * イントロもサビも同じ歌詞・同じ節回しなので、両方からこれを使い回す
 */
export const KYOROKYORO_POSE_CUES: AnimationPoseCue[] = [
  // キョロキョロキョロ。「キョロ」3回 + 締めの正面の4つ
  { offsetSec: 0, src: CHARA_IMAGES.MIHARI },
  { offsetSec: 0.4, src: CHARA_IMAGES.MIHARI, flipped: true },
  { offsetSec: 0.4, src: CHARA_IMAGES.MIHARI },
  { offsetSec: 0.4, src: CHARA_IMAGES.FRONT },
  // キョロキョロ。「キョロ」の頭で切り替える
  { offsetSec: 0.2, src: CHARA_IMAGES.MIHARI, flipped: true },
  { offsetSec: 0.4, src: CHARA_IMAGES.MIHARI },
  // 歌のない一瞬。正面のままグリッチだけ入れて次のフレーズへ渡す
  { offsetSec: 0.4, src: CHARA_IMAGES.FRONT, withEffect: true },
  // キョロキョロ みはるよ
  { offsetSec: 0.6, src: CHARA_IMAGES.MIHARI },
  { offsetSec: 0.4, src: CHARA_IMAGES.MIHARI, flipped: true },
  { offsetSec: 0.4, src: CHARA_IMAGES.MIHARI },
  { offsetSec: 0.4, src: CHARA_IMAGES.FRONT },
  // ミーアキャット。4文字ぶん
  { offsetSec: 0.4, src: CHARA_IMAGES.MIHARI, flipped: true },
  { offsetSec: 0.4, src: CHARA_IMAGES.MIHARI },
  { offsetSec: 0.4, src: CHARA_IMAGES.MIHARI, flipped: true },
  { offsetSec: 0.4, src: CHARA_IMAGES.FRONT },
];

/** KYOROKYORO_POSE_CUES を時刻に直したもの。毎回作り直さないようここで1度だけ変換する */
export const KYOROKYORO_POSES = toAnimationPoses(KYOROKYORO_POSE_CUES);

/**
 * 画面高さに対するキャラの大きさ・下端からの余白の比率。
 * ダンスと登場カットで置き方をそろえるため、セクション側からも参照する
 */
export const CHARA_HEIGHT_RATIO = 0.85;
export const CHARA_BOTTOM_RATIO = 0.02;

// ---------------------------------------------------------------------------
// 表示
// ---------------------------------------------------------------------------

type CharaDanceProps = {
  /** コマ1枚あたりの表示時間（秒）。省略時は FrameAnimation の既定（0.35） */
  frameInSeconds?: number;
  /**
   * コマ1枚あたりの表示時間を、秒ではなく曲の拍で指定する。
   * 渡すと frameInSeconds より優先される
   */
  tempo?: BeatTempo;
  /** 画面高さに対するキャラの大きさの比率。省略時 CHARA_HEIGHT_RATIO */
  heightRatio?: number;
  /**
   * 切り替えるタイミングを曲に合わせて指定する。
   * 省略すると frameInSeconds ごとの繰り返しになる
   */
  poses?: AnimationPose[];
  /**
   * 画面の中央からの横のずらし量（画面幅に対する比率）。+ で右。
   * 何匹か横に並べたいときは、呼び出し側でずらし量ちがいのこれを並べる
   */
  offsetXRatio?: number;
};

/**
 * コマを順に切り替えて踊る（きょろきょろする）キャラクター1匹。
 * 汎用の FrameAnimation に、ミーアキャットの絵柄と置き方を渡すだけのラッパー
 * @param param0
 * @param param0.frameInSeconds コマ1枚あたりの表示時間（秒）
 * @param param0.tempo コマ1枚あたりの表示時間を曲の拍で指定する
 * @param param0.heightRatio 画面高さに対するキャラの大きさの比率
 * @param param0.poses 切り替えるタイミングを曲に合わせて指定する
 * @param param0.offsetXRatio 画面の中央からの横のずらし量（画面幅に対する比率）
 */
export const CharaDance = ({
  frameInSeconds,
  tempo,
  heightRatio = CHARA_HEIGHT_RATIO,
  poses,
  offsetXRatio,
}: CharaDanceProps) => {
  return (
    <FrameAnimation
      frames={DANCE_FRAMES}
      poses={poses}
      frameInSeconds={frameInSeconds}
      tempo={tempo}
      heightRatio={heightRatio}
      bottomRatio={CHARA_BOTTOM_RATIO}
      offsetXRatio={offsetXRatio}
      // ダンス中だけ影を薄くする（Closing の切り抜き・Hover とは別に振りたい）
      shadow={{ alpha: 0.2 }}
      // コマが切り替わるたびに1回跳ねさせて、リズムを取っているように見せる。
      // 拍に乗るかどうかは poses の間隔しだい（KYOROKYORO_POSE_CUES を曲に合わせてある）
      motion={({ progress, sizePx }) => bounceEffect(progress, sizePx)}
      // withEffect のコマに切り替わった瞬間だけ、映像が乱れたように見せる
      effect={(image) => <GlitchEffect>{image}</GlitchEffect>}
    />
  );
};
