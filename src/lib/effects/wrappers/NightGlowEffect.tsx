import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ---------------------------------------------------------------------------
// 中身を暗く落としつつ、白いところ（キャラの白目など）だけ元の明るさに戻して光らせる。
// 同じ絵柄のまま雰囲気だけ変えたいセクションで、絵を差し替えずに済ませるためのもの。
//
// 白の抜き出しは輝度ではなく R・G・B の積で判定する。
// 輝度だと明るい肌色・クリーム色（積 0.5 前後）まで拾ってしまうが、
// 積なら白（1.0）とそれ以外の差が大きく開くので、白だけをきれいに抜ける。
// ---------------------------------------------------------------------------

/** 暗さと光り方の上書き。省略した項目は既定値が使われる */
export type NightGlowOptions = {
  /**
   * 全体の明るさの倍率。1 で元のまま、小さいほど暗い。省略時 0.5。
   * 白いところはこのぶんを打ち消して元の明るさへ戻すので、暗くするほど白が際立つ
   */
  brightness?: number;
  /**
   * 白と判定する境目（R・G・B の積）。省略時 0.55。
   * 上げるほど「本当に真っ白なところ」しか光らない
   */
  whiteThreshold?: number;
  /**
   * 白を抜き出す前にかけるぼかし（px）。省略時 0.35。
   * 切り抜きの白フチのような細い白は、ぼかすと周りの色と混ざって境目に届かなくなる。
   * 白目のようなまとまった面だけを残すための値なので、フチまで光ってしまうなら上げる
   */
  keyBlurPx?: number;
  /** 光のにじみ幅（px）。省略時 20 */
  glowBlurPx?: number;
  /** にじみの強さ。0 でにじみなし（白が元の明るさに戻るだけ）。省略時 0.6 */
  glowStrength?: number;
  /**
   * 暗くしておく長さ（秒）。省略すると出ている間ずっと暗いまま。
   * 指定すると、この秒までに元の明るさへ戻す
   */
  durationSec?: number;
  /** 元の明るさへ戻すのにかける秒数。durationSec を指定したときだけ効く。省略時 0.01 */
  fadeOutSec?: number;
};

type NightGlowEffectProps = NightGlowOptions & {
  children: React.ReactNode;
};

/**
 * 中身を暗く落とし、白いところだけ明るいまま残して光らせるラッパー。
 * @param param0
 * @param param0.brightness 全体の明るさの倍率。小さいほど暗い
 * @param param0.whiteThreshold 白と判定する境目（R・G・B の積）
 * @param param0.keyBlurPx 白を抜き出す前にかけるぼかし（px）
 * @param param0.glowBlurPx 光のにじみ幅（px）
 * @param param0.glowStrength にじみの強さ
 * @param param0.durationSec 暗くしておく長さ（秒）
 * @param param0.fadeOutSec 元の明るさへ戻すのにかける秒数
 * @param param0.children 暗くする中身
 */
export const NightGlowEffect = ({
  brightness = 0.5,
  whiteThreshold = 0.55,
  keyBlurPx = 0.35,
  glowBlurPx = 20,
  glowStrength = 0.6,
  durationSec,
  fadeOutSec = 0.01,
  children,
}: NightGlowEffectProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 暗転と光り方を組み立てる SVG フィルタの id。
  // 固定の id にすると、1画面に2つ置いたときに先に定義されたほうだけが効いてしまう。
  // 指定が同じなら中身も同じなので、値から組み立てておけば重なっても破綻しない（MovieCut と同じやり方）
  const filterId = `night-glow-${brightness}-${whiteThreshold}-${keyBlurPx}-${glowBlurPx}-${glowStrength}-${durationSec ?? "keep"}-${fadeOutSec}`;

  // 効き具合。1 で指定どおり、0 で素通し（暗くもせず光らせもしない）。
  // durationSec の手前 fadeOutSec で 1 → 0 に戻すので、明かりが戻るように見える
  const amount =
    durationSec === undefined
      ? 1
      : interpolate(
          frame,
          [(durationSec - fadeOutSec) * fps, durationSec * fps],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );

  // 境目より上を 0〜1 へ引き伸ばす。境目ちょうどで 0、真っ白で 1 になる
  const keySlope = 1 / Math.max(1 - whiteThreshold, 0.0001);
  const litBrightness = 1 - (1 - brightness) * amount;
  // 暗くしたぶんを白にだけ足し戻すので、白は必ず元の明るさ（1.0）に戻る
  const coreStrength = 1 - litBrightness;

  return (
    <AbsoluteFill>
      <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden>
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            {/* 1. 全体を暗く落とす */}
            <feComponentTransfer in="SourceGraphic" result="dark">
              <feFuncR type="linear" slope={litBrightness} />
              <feFuncG type="linear" slope={litBrightness} />
              <feFuncB type="linear" slope={litBrightness} />
            </feComponentTransfer>

            {/* 2. 白いところを抜き出す。細い白フチを落とすため、先にぼかしてから判定する */}
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={keyBlurPx}
              result="keyBlur"
            />
            <feColorMatrix
              in="keyBlur"
              type="matrix"
              values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1"
              result="keyR"
            />
            <feColorMatrix
              in="keyBlur"
              type="matrix"
              values="0 1 0 0 0  0 1 0 0 0  0 1 0 0 0  0 0 0 0 1"
              result="keyG"
            />
            <feColorMatrix
              in="keyBlur"
              type="matrix"
              values="0 0 1 0 0  0 0 1 0 0  0 0 1 0 0  0 0 0 0 1"
              result="keyB"
            />
            {/* arithmetic の k1 だけ立てると入力どうしの掛け算になる（= R×G×B） */}
            <feComposite
              in="keyR"
              in2="keyG"
              operator="arithmetic"
              k1={1}
              k2={0}
              k3={0}
              k4={0}
              result="keyRG"
            />
            <feComposite
              in="keyRG"
              in2="keyB"
              operator="arithmetic"
              k1={1}
              k2={0}
              k3={0}
              k4={0}
              result="keyRGB"
            />
            <feComponentTransfer in="keyRGB" result="white">
              <feFuncR
                type="linear"
                slope={keySlope}
                intercept={-whiteThreshold * keySlope}
              />
              <feFuncG
                type="linear"
                slope={keySlope}
                intercept={-whiteThreshold * keySlope}
              />
              <feFuncB
                type="linear"
                slope={keySlope}
                intercept={-whiteThreshold * keySlope}
              />
            </feComponentTransfer>

            {/* 3. 抜き出した白を、輪郭そのまま（core）と、にじませたもの（glow）に分ける */}
            <feComponentTransfer in="white" result="core">
              <feFuncR type="linear" slope={coreStrength} />
              <feFuncG type="linear" slope={coreStrength} />
              <feFuncB type="linear" slope={coreStrength} />
            </feComponentTransfer>
            <feGaussianBlur
              in="white"
              stdDeviation={glowBlurPx}
              result="glowBlur"
            />
            <feComponentTransfer in="glowBlur" result="glow">
              <feFuncR type="linear" slope={glowStrength * amount} />
              <feFuncG type="linear" slope={glowStrength * amount} />
              <feFuncB type="linear" slope={glowStrength * amount} />
            </feComponentTransfer>

            {/* 4. 暗くした絵に、白の明るさとにじみを足し戻す（白以外は真っ黒なので影響しない） */}
            <feComposite
              in="core"
              in2="dark"
              operator="arithmetic"
              k1={0}
              k2={1}
              k3={1}
              k4={0}
              result="litCore"
            />
            <feComposite
              in="glow"
              in2="litCore"
              operator="arithmetic"
              k1={0}
              k2={1}
              k3={1}
              k4={0}
            />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill style={{ filter: `url(#${filterId})` }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
