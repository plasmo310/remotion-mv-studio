import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FloatEffect } from "../../../src/lib/effects/wrappers/FloatEffect";
import { GlitchEffect } from "../../../src/lib/effects/wrappers/GlitchEffect";
import { MotionBlurEffect } from "../../../src/lib/effects/wrappers/MotionBlurEffect";
import { NightGlowEffect } from "../../../src/lib/effects/wrappers/NightGlowEffect";
import { WiggleEffect } from "../../../src/lib/effects/wrappers/WiggleEffect";
import { Telop } from "../../../src/lib/components/text/Telop";
import { loopMotionEffect } from "../../../src/lib/effects/functions/LoopMotionEffect";
import { fadeOutVolume } from "../../../src/lib/effects/functions/AudioFadeEffect";
import { dropShadowEffect } from "../../../src/lib/effects/functions/DropShadowEffect";
import { bounceEffect } from "../../../src/lib/effects/functions/BounceEffect";
import { usePopIn } from "../../../src/lib/effects/functions/PopInEffect";
import { useShake } from "../../../src/lib/effects/functions/ShakeEffect";
import { SAMPLE } from "./SampleAssets";

// ---------------------------------------------------------------------------
// docs/readme/ に貼る GIF・静止画を撮るための舞台。
// 中身は stories/lib/effects/ の各ストーリー（Default）と同じものを Remotion に載せ替えただけ。
// ---------------------------------------------------------------------------

const BOX: React.CSSProperties = {
  width: 100,
  height: 100,
  borderRadius: 16,
  backgroundColor: "#ffd45e",
};

const CENTER: React.CSSProperties = {
  justifyContent: "center",
  alignItems: "center",
};

export const FloatEffectStage = () => (
  <FloatEffect sizePx={260}>
    <Img
      src={staticFile(SAMPLE.cutout)}
      style={{ width: "100%", height: "100%" }}
    />
  </FloatEffect>
);

export const GlitchEffectStage = () => (
  <AbsoluteFill style={CENTER}>
    <div style={{ position: "relative", width: 280, height: 280 }}>
      <GlitchEffect>
        <Img
          src={staticFile(SAMPLE.cutout)}
          style={{ width: "100%", height: "100%" }}
        />
      </GlitchEffect>
    </div>
  </AbsoluteFill>
);

const MovingBox = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={CENTER}>
      <div
        style={{
          ...BOX,
          width: 120,
          height: 120,
          borderRadius: 20,
          transform: `translateX(${loopMotionEffect.oscillate(frame / fps, 1.6) * 200}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const MotionBlurEffectStage = () => (
  <MotionBlurEffect layers={12} frameOffset={2} opacity={0.15}>
    <MovingBox />
  </MotionBlurEffect>
);

export const NightGlowEffectStage = () => (
  <NightGlowEffect brightness={0.4} durationSec={2} fadeOutSec={0.8}>
    <AbsoluteFill style={CENTER}>
      <Img src={staticFile(SAMPLE.cutout)} style={{ height: 300 }} />
    </AbsoluteFill>
  </NightGlowEffect>
);

export const WiggleEffectStage = () => (
  <AbsoluteFill style={CENTER}>
    <WiggleEffect
      rotateDeg={3}
      rotateSec={2.4}
      offsetPx={[10, 14]}
      scaleAmount={0.05}
    >
      <Telop text="ゆらゆら" fontSize={64} />
    </WiggleEffect>
  </AbsoluteFill>
);

export const LoopMotionEffectStage = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsedSec = frame / fps;
  const periodSec = 2;

  return (
    <AbsoluteFill
      style={{
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
      }}
    >
      <div
        style={{
          ...BOX,
          transform: `translateY(${loopMotionEffect.oscillate(elapsedSec, periodSec) * 60}px)`,
        }}
      />
      <div
        style={{
          ...BOX,
          transform: `scale(${
            1 +
            loopMotionEffect.bump((elapsedSec % periodSec) / periodSec) * 0.5
          })`,
        }}
      />
      <div
        style={{
          ...BOX,
          transform: `rotate(${loopMotionEffect.spinAngleDeg(elapsedSec, periodSec)}deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const AudioFadeEffectStage = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const volume = fadeOutVolume(frame, durationInFrames, Math.round(1.5 * fps));

  return (
    <AbsoluteFill
      style={{
        ...CENTER,
        gap: 24,
        color: "#ffffff",
        fontFamily: "monospace",
        fontSize: 32,
      }}
    >
      <div style={{ width: 400, height: 32, backgroundColor: "#4a4f5e" }}>
        <div
          style={{
            width: `${volume * 100}%`,
            height: "100%",
            backgroundColor: "#ffd45e",
          }}
        />
      </div>
      <div>volume {volume.toFixed(2)}</div>
    </AbsoluteFill>
  );
};

export const DropShadowEffectStage = () => (
  <AbsoluteFill style={CENTER}>
    <Img
      src={staticFile(SAMPLE.cutout)}
      style={{ height: 240, filter: dropShadowEffect(240) }}
    />
  </AbsoluteFill>
);

export const BounceEffectStage = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = ((frame / fps) % 0.6) / 0.6;

  return (
    <AbsoluteFill style={CENTER}>
      <div
        style={{
          ...BOX,
          width: 140,
          height: 140,
          borderRadius: 24,
          transform: bounceEffect(progress, 140),
        }}
      />
    </AbsoluteFill>
  );
};

export const PopInEffectStage = () => {
  const enter = usePopIn();

  return (
    <AbsoluteFill style={CENTER}>
      <div
        style={{
          ...BOX,
          width: 160,
          height: 160,
          borderRadius: 24,
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [120, 0])}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const ShakeEffectStage = () => {
  const sizePx = 180;
  const shake = useShake({
    seed: "story-shake",
    amplitude: 0.06,
    frequency: 14,
    durationSec: 1,
    rotateDeg: 4,
  });

  return (
    <AbsoluteFill style={CENTER}>
      <div
        style={{
          ...BOX,
          width: sizePx,
          height: sizePx,
          borderRadius: 24,
          transform: `translate(${shake.x * sizePx}px, ${shake.y * sizePx}px) rotate(${
            shake.rotate
          }deg) scale(${shake.overscan})`,
        }}
      />
    </AbsoluteFill>
  );
};
