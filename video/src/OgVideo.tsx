import { AbsoluteFill } from "remotion";

import { BrandReveal } from "./BrandReveal";
import { PALETTE } from "./constants";
import { LogoSwarm } from "./LogoSwarm";
import logos from "./generated/logos.json";

const LOGO_FILES = logos.map((logo) => logo.file);

export function OgVideo() {
  return (
    <AbsoluteFill style={{ background: PALETTE.bg }}>
      <LogoSwarm logos={LOGO_FILES} />
      <BrandReveal />
    </AbsoluteFill>
  );
}
