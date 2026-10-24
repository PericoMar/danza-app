import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

import { LogoTile } from "./LogoTile";
import { seedTiles, tileAt } from "./swarm";

type LogoSwarmProps = { logos: readonly string[] };

export function LogoSwarm({ logos }: LogoSwarmProps) {
  const frame = useCurrentFrame();
  const seeds = useMemo(() => seedTiles(logos.length), [logos.length]);

  return (
    <AbsoluteFill>
      {seeds.map((seed) => (
        <LogoTile key={seed.id} file={logos[seed.logoIndex]} {...tileAt(seed, frame)} />
      ))}
    </AbsoluteFill>
  );
}
