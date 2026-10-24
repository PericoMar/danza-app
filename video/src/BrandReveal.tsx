import type { CSSProperties } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { BrandMark } from "./BrandMark";
import { BRAND, CENTER, COPY, PALETTE, TIMELINE } from "./constants";
import { INTER } from "./fonts";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SETTLE_FRAMES = 22;
const SETTLED_SCALE = BRAND.settledLogoSize / BRAND.logoSize;
const ENTRY_SHIFT = 24;
const RULE_HEIGHT = 8;

const LAYOUT = {
  wordmarkTop: 276,
  wordsTop: 374,
  taglineTop: 448,
} as const;

const centredRow: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  display: "flex",
  justifyContent: "center",
  alignItems: "baseline",
  fontFamily: INTER,
  lineHeight: 1,
};

const sheen: CSSProperties = {
  backgroundImage: PALETTE.headline,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

/** Springs from 0 to 1 starting at `from`. */
function useEntrance(from: number, damping = 14) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - from, fps, config: { damping } });
}

function Logo() {
  const frame = useCurrentFrame();
  const entrance = useEntrance(TIMELINE.logoIn, 12);
  const settleRange = [TIMELINE.logoSettle, TIMELINE.logoSettle + SETTLE_FRAMES];
  const settled = interpolate(frame, settleRange, [1, SETTLED_SCALE], CLAMP);
  const y = interpolate(frame, settleRange, [CENTER.y, BRAND.settledLogoY], CLAMP);
  const rotation = interpolate(entrance, [0, 1], [-270, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: CENTER.x - BRAND.logoSize / 2,
        top: y - BRAND.logoSize / 2,
        transform: `rotate(${rotation}deg) scale(${entrance * settled})`,
      }}
    >
      <BrandMark size={BRAND.logoSize} />
    </div>
  );
}

function Wordmark() {
  const entrance = useEntrance(TIMELINE.wordmark);
  return (
    <div
      style={{
        ...centredRow,
        top: LAYOUT.wordmarkTop,
        fontSize: 76,
        fontWeight: 900,
        letterSpacing: 0.5,
        color: PALETTE.text,
        opacity: entrance,
        transform: `translateY(${(1 - entrance) * ENTRY_SHIFT}px)`,
      }}
    >
      {COPY.wordmark}
    </div>
  );
}

function Word({ text, index, isLast }: { text: string; index: number; isLast: boolean }) {
  const entrance = useEntrance(TIMELINE.words + index * TIMELINE.wordStagger, 11);
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", opacity: Math.min(entrance, 1) }}>
      <span style={{ display: "inline-block", transform: `scale(${interpolate(entrance, [0, 1], [0.6, 1])})`, ...(isLast ? sheen : null) }}>
        {text}
      </span>
      {isLast ? null : <span style={{ color: PALETTE.silverSoft, margin: "0 18px" }}>·</span>}
    </span>
  );
}

function Words() {
  return (
    <div
      style={{
        ...centredRow,
        top: LAYOUT.wordsTop,
        fontSize: 44,
        fontWeight: 900,
        letterSpacing: -1.2,
        textTransform: "uppercase",
        color: PALETTE.text,
      }}
    >
      {COPY.words.map((word, i) => (
        <Word key={word} text={word} index={i} isLast={i === COPY.words.length - 1} />
      ))}
    </div>
  );
}

function Tagline() {
  const entrance = useEntrance(TIMELINE.tagline, 20);
  return (
    <>
      <div
        style={{
          ...centredRow,
          top: LAYOUT.taglineTop,
          fontSize: 22,
          fontWeight: 500,
          color: PALETTE.textLightDark,
          opacity: entrance,
          transform: `translateY(${(1 - entrance) * ENTRY_SHIFT}px)`,
        }}
      >
        {COPY.tagline}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          height: RULE_HEIGHT,
          width: `${entrance * 100}%`,
          background: PALETTE.headline,
        }}
      />
    </>
  );
}

/** The brand mark the logos collapse into, then the name and what the app is for. */
export function BrandReveal() {
  return (
    <AbsoluteFill>
      <Logo />
      <Wordmark />
      <Words />
      <Tagline />
    </AbsoluteFill>
  );
}
