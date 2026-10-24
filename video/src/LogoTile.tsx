import { Img, staticFile } from "remotion";

import { PALETTE, SWARM } from "./constants";
import type { TileFrame } from "./swarm";

type LogoTileProps = TileFrame & { file: string };

/** A company logo on the card's grey panel, centred on (x, y). */
export function LogoTile({ file, x, y, rotation, scale, opacity }: LogoTileProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: x - SWARM.tile / 2,
        top: y - SWARM.tile / 2,
        width: SWARM.tile,
        height: SWARM.tile,
        padding: SWARM.tile * 0.14,
        boxSizing: "border-box",
        borderRadius: 12,
        border: `1px solid ${PALETTE.silverSoft}`,
        background: PALETTE.card,
        boxShadow: PALETTE.tileShadow,
        transform: `rotate(${rotation}deg) scale(${scale})`,
        opacity,
      }}
    >
      <Img src={staticFile(`logos/${file}`)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
}
