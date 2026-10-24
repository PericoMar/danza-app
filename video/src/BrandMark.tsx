import { Img } from "remotion";

import { BRAND, PALETTE } from "./constants";
import logo from "../../assets/images/favicon.png";

type BrandMarkProps = { size: number };

/** The dancer logo inside a brushed-metal ring, like the navbar's brand mark. */
export function BrandMark({ size }: BrandMarkProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        padding: BRAND.ringWidth,
        boxSizing: "border-box",
        borderRadius: "50%",
        background: PALETTE.chrome,
        boxShadow: PALETTE.chromeRingShadow,
      }}
    >
      <Img src={logo} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
