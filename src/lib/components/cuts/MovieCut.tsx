import {
  AbsoluteFill,
  Loop,
  OffthreadVideo,
  staticFile,
  useVideoConfig,
} from "remotion";

// ---------------------------------------------------------------------------
// グリーンバック抜き
//
// 緑がどれだけ突出しているか（G から R・B の平均を引いた量）で背景かどうかを決め、
// 不透明度 = 1 - slope * (突出量 - threshold) とする。
// max / min が使えない feColorMatrix でも書ける形なので、これで済ませている
// ---------------------------------------------------------------------------

/**
 * グリーンバック抜きの上書き。省略した項目は既定値が使われる。
 * MovieCut に null を渡すと抜き自体をやめられる（緑を抜く必要のない動画はそちら）
 */
export type ChromaKeyOptions = {
  /**
   * ここまでの突出量なら背景とみなさない。省略時 0.05。
   * 下げるほど緑を強く抜く（抜き残しが減る代わりに、キャラの緑がかった影まで消えやすい）
   */
  threshold?: number;
  /** 判定の鋭さ。省略時 2。大きいほど半透明の縁が細くなり、小さいほど境目がなじむ */
  slope?: number;
  /**
   * 抜いたあとに残る緑かぶり（スピル）を落とす量。省略時 0.2。
   * 0 で何もしない、1 で緑を R・B の平均まで下げる
   */
  despillAmount?: number;
};

type ChromaKeyFilterProps = {
  /** フィルタの id */
  id: string;
  /** 背景とみなさない緑の突出量 */
  threshold: number;
  /** 判定の鋭さ */
  slope: number;
  /** 緑かぶりを落とす量 */
  despillAmount: number;
};

/**
 * グリーンバックを抜くフィルタ定義。画面には出さず id を参照させるだけ。
 * 判定はエンコード値（sRGB）そのものに効かせたいので
 * color-interpolation-filters は sRGB（＝ブラウザの自動リニア変換を切る）にする
 * @param param0
 * @param param0.id フィルタの id
 * @param param0.threshold 背景とみなさない緑の突出量
 * @param param0.slope 判定の鋭さ
 * @param param0.despillAmount 緑かぶりを落とす量
 */
const ChromaKeyFilter = ({
  id,
  threshold,
  slope,
  despillAmount,
}: ChromaKeyFilterProps) => {
  // alpha を「緑の突出量」から作り直す。
  // 下駄は定数（最後の列）ではなく元の alpha に掛ける。
  // 定数にすると、動画の外側（フィルタが効く範囲は要素より少し広い）まで
  // 不透明になってしまい、黒い帯が出る
  const alphaRow = [
    slope / 2,
    -slope,
    slope / 2,
    1 + slope * threshold,
    0,
  ].join(" ");

  // 緑を R・B の平均へ寄せて、抜いた縁に残る緑かぶりを消す
  const greenRow = [
    despillAmount / 2,
    1 - despillAmount,
    despillAmount / 2,
    0,
    0,
  ].join(" ");

  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden>
      <defs>
        <filter id={id} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  ${alphaRow}`}
          />
          <feColorMatrix
            type="matrix"
            values={`1 0 0 0 0  ${greenRow}  0 0 1 0 0  0 0 0 1 0`}
          />
        </filter>
      </defs>
    </svg>
  );
};

/**
 * 動画にかける位置・寄り。scale は拡大率、translate は画面サイズに対する比率。
 * 中央に置いたうえでの味付けに使う
 */
export type MovieCutTransform = {
  /** 拡大率。1 で等倍。省略時 1 */
  scale?: number;
  /** 横のずらし量。画面幅に対する比率で、正=右へ。省略時 0 */
  translateX?: number;
  /** 縦のずらし量。画面高さに対する比率で、正=下へ。省略時 0 */
  translateY?: number;
};

/**
 * 抜きの指定から、フィルタに渡す値一式を組み立てる。
 * id を値から作っているのは、抜き具合ちがいを同じ画面に並べても混ざらないようにするため
 * @param options 抜き具合の上書き
 */
const buildChromaKey = (options: ChromaKeyOptions) => {
  const threshold = options.threshold ?? 0.05;
  const slope = options.slope ?? 2;
  const despillAmount = options.despillAmount ?? 0.2;

  return {
    id: `movie-cut-chroma-key-${threshold}-${slope}-${despillAmount}`,
    threshold,
    slope,
    despillAmount,
  };
};

type MovieCutProps = {
  /** 再生する動画のパス（public からの相対パス） */
  src: string;
  /**
   * 動画1ループぶんの長さ（秒）。素材の尺を渡す。
   * 置かれた Sequence のほうが長いときは、この尺で区切って繰り返す
   */
  durationSec: number;
  /** 再生スピード。1 で等速、2 で倍速、0.5 で半分の速さ。省略時 1 */
  speed?: number;
  /** 動画の位置・寄り。省略時は中央・等倍のまま */
  transform?: MovieCutTransform;
  /** 画面高さに対する動画の大きさの比率。省略時 1（画面いっぱい） */
  heightRatio?: number;
  /**
   * グリーンバック抜きの上書き。省略すると既定値で抜き、null を渡すと抜かない
   * （グリーンバックでない動画は null にする）
   */
  chromaKey?: ChromaKeyOptions | null;
};

/**
 * 動画を中央で1カット再生する共通カット。
 * グリーンバックは既定で抜く（chromaKey に null を渡すと抜かずにそのまま出す）。
 * 音は使わないのでミュートし、置かれた Sequence の尺いっぱいまで繰り返す。
 * スピードと位置・寄りは呼び出し側から調整できる
 * @param param0
 * @param param0.src 再生する動画のパス
 * @param param0.durationSec 動画1ループぶんの長さ（秒）
 * @param param0.speed 再生スピード
 * @param param0.transform 動画の位置・寄り
 * @param param0.heightRatio 画面高さに対する動画の大きさの比率
 * @param param0.chromaKey グリーンバック抜きの上書き。null で抜かない
 */
export const MovieCut = ({
  src,
  durationSec,
  speed = 1,
  transform,
  heightRatio = 1,
  chromaKey,
}: MovieCutProps) => {
  const { fps, width, height } = useVideoConfig();

  const size = height * heightRatio;
  const scale = transform?.scale ?? 1;
  const translateX = transform?.translateX ?? 0;
  const translateY = transform?.translateY ?? 0;

  // null は「抜かない」。省略（undefined）は既定値で抜く
  const key = chromaKey === null ? null : buildChromaKey(chromaKey ?? {});

  // スピードを上げると1ループぶんの動画が短い尺で流れ切る。
  // ループの尺も同じだけ縮めて、切れ目で再生位置が飛ばないようにする
  const loopFrames = Math.max(1, Math.round((durationSec / speed) * fps));

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {key && (
        <ChromaKeyFilter
          id={key.id}
          threshold={key.threshold}
          slope={key.slope}
          despillAmount={key.despillAmount}
        />
      )}
      <Loop durationInFrames={loopFrames}>
        <AbsoluteFill
          style={{ justifyContent: "center", alignItems: "center" }}
        >
          <OffthreadVideo
            src={staticFile(src)}
            muted
            playbackRate={speed}
            style={{
              width: size,
              height: size,
              objectFit: "contain",
              filter: key ? `url(#${key.id})` : undefined,
              transform: `translate(${translateX * width}px, ${
                translateY * height
              }px) scale(${scale})`,
            }}
          />
        </AbsoluteFill>
      </Loop>
    </AbsoluteFill>
  );
};
