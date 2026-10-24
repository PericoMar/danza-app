import { Composition } from "remotion";

import { DURATION_IN_FRAMES, FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "./constants";
import { OgVideo } from "./OgVideo";

export function RemotionRoot() {
  return (
    <Composition
      id="OgVideo"
      component={OgVideo}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
    />
  );
}
