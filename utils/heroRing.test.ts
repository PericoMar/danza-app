import { resolveHeroRingSources } from "./heroRing";
import { DEFAULT_HERO_RING_IMAGES } from "@/constants/heroRing";
import type { HeroRingImage } from "@/types/heroRing";

const image = (id: string, position: number): HeroRingImage => ({
  id,
  image_url: `https://cdn.test/${id}.webp`,
  position,
});

describe("resolveHeroRingSources", () => {
  const configured = [image("a", 0), image("b", 1)];

  it("waits while the list is loading", () => {
    expect(resolveHeroRingSources({ images: undefined, failed: false, preloaded: false })).toBeNull();
  });

  it("waits while configured photos are still downloading", () => {
    expect(resolveHeroRingSources({ images: configured, failed: false, preloaded: false })).toBeNull();
  });

  it("shows the configured photos, in order, once downloaded", () => {
    expect(resolveHeroRingSources({ images: configured, failed: false, preloaded: true })).toEqual([
      { uri: "https://cdn.test/a.webp" },
      { uri: "https://cdn.test/b.webp" },
    ]);
  });

  it("falls back to the bundled photos when none are configured", () => {
    expect(resolveHeroRingSources({ images: [], failed: false, preloaded: false })).toBe(
      DEFAULT_HERO_RING_IMAGES
    );
  });

  it("falls back to the bundled photos when the list can't be fetched", () => {
    expect(resolveHeroRingSources({ images: undefined, failed: true, preloaded: false })).toBe(
      DEFAULT_HERO_RING_IMAGES
    );
  });
});
