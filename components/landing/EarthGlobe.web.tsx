// components/landing/EarthGlobe.web.tsx
// Real Earth globe: image texture, draggable, zoomable, clickable markers.
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Asset } from "expo-asset";

// ─── Texture asset ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-var-requires
const EARTH_DAY_MODULE = require("@/assets/images/2k_earth_daymap.jpg");

// ─── Visual constants ──────────────────────────────────────────────────────────
const GLOBE_R = 1.3; // ~13% smaller than the original 1.5 (desktop default felt oversized)
const CAM_Z = 4.2;
const CAM_Z_MAX = 8;
const FOV_DEG = 45;
const MARKER_R = 0.016;
const PULSE_PERIOD = 2.4; // seconds per full pulse cycle
// The globe renders into a square canvas that overflows its container; cap that
// square so the globe stays a comfortable size on wide screens instead of
// scaling up without bound.
const MAX_CANVAS = 1134;

// Canvas is always square so horizontal FOV === vertical FOV → globe never clips.
// Min z for a square canvas with FOV_DEG: GLOBE_R / tan(FOV_DEG/2 in rad) + margin.
// The margin keeps a ring of empty space around the sphere even at max zoom-in
// so the globe never touches the (clipped) container edges on mobile.
const MIN_CAM_Z = (GLOBE_R / Math.tan((FOV_DEG / 2) * (Math.PI / 180))) * 1.12; // ≈ 4.05

// ─── Dance-city markers [lat, lon, countryCode] ────────────────────────────────
const MARKERS: { lat: number; lon: number; country: string }[] = [
  { lat: 48.8566, lon: 2.3522, country: "FR" },
  { lat: 51.5074, lon: -0.1278, country: "GB" },
  { lat: 41.9028, lon: 12.4964, country: "IT" },
  { lat: 52.52, lon: 13.405, country: "DE" },
  { lat: 40.4168, lon: -3.7038, country: "ES" },
  { lat: 52.3676, lon: 4.9041, country: "NL" },
  { lat: 48.2082, lon: 16.3738, country: "AT" },
  { lat: 40.7128, lon: -74.006, country: "US" },
  { lat: 35.6762, lon: 139.6503, country: "JP" },
  { lat: -33.8688, lon: 151.2093, country: "AU" },
  { lat: 55.7558, lon: 37.6176, country: "RU" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
type Props = {
  onMarkerClick?: (country: string) => void;
  // When true (desktop hero) the square canvas is oversized so the globe bleeds
  // into the adjacent copy column. When false (mobile) the canvas is clamped to
  // the container so the globe stays centered on screen.
  bleed?: boolean;
  /**
   * Called when the globe cannot run and falls back to a still image: no
   * markers to click, no zoom. The hero uses it to drop the hint that says so.
   */
  onUnavailable?: () => void;
};

export default function EarthGlobe({ onMarkerClick, bleed = true, onUnavailable }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasContext, setHasContext] = useState(true);
  const onUnavailableRef = useRef(onUnavailable);
  useEffect(() => { onUnavailableRef.current = onUnavailable; }, [onUnavailable]);
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);
  const bleedRef = useRef(bleed);
  useEffect(() => { bleedRef.current = bleed; }, [bleed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number;
    let isDisposed = false;
    let isDragging = false;
    let hasDragged = false;
    let isHovering = false; // pointer over the globe → pause the idle spin
    let prevMouse = { x: 0, y: 0 };
    let downPos = { x: 0, y: 0 }; // where the current gesture started (for tap vs drag)
    // Finger taps always jitter a few px between down and up — only treat the
    // gesture as a drag once it travels past this many CSS px from its origin.
    const DRAG_SLOP_PX = 9;

    // Active pointers (mouse or touch) currently pressed on the canvas.
    const pointers = new Map<number, { x: number; y: number }>();
    let pinchStartDist = 0;
    let pinchStartZ = 0;

    // Square-canvas side length. On desktop (bleed) it is oversized so the globe
    // overflows into the copy column and adjacent text. On mobile it is clamped
    // to the *smaller* container dimension so the whole square sits inside the
    // container — the globe then stays fully visible at every zoom level instead
    // of being cropped by the container edges. Never > MAX_CANVAS.
    const sideLen = (cw: number, ch: number) =>
      Math.min(bleedRef.current ? Math.max(cw * 1.5, ch) : Math.min(cw, ch), MAX_CANVAS);

    const w = container.clientWidth || 600;
    const h = container.clientHeight || 600;
    let s = sideLen(w, h);

    // Renderer — square.
    // A browser keeps only a handful of WebGL contexts alive and throws for the
    // rest, and with hardware acceleration off it throws for every one. Neither
    // is worth taking the whole page down for: the hero falls back to a still.
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      console.warn("EarthGlobe: no WebGL context, showing a still image", e);
      setHasContext(false);
      onUnavailableRef.current?.();
      return;
    }
    renderer.setSize(s, s);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    // Absolute-center the square canvas inside the container so overflow is equal on each side
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = `${Math.round((h - s) / 2)}px`;
    renderer.domElement.style.left = `${Math.round((w - s) / 2)}px`;
    // Let the canvas own touch gestures (drag / pinch) instead of scrolling the page.
    renderer.domElement.style.touchAction = "none";
    container.appendChild(renderer.domElement);

    // Scene & camera — aspect=1 because canvas is always square
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV_DEG, 1, 0.1, 100);
    camera.position.set(0, 0, Math.max(CAM_Z, MIN_CAM_Z));

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    // Globe group — start rotated so Europe faces the camera
    const globe = new THREE.Group();
    globe.rotation.y = -Math.PI / 2;
    scene.add(globe);

    // Sphere with image texture
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x0d2045, // shown while texture loads
      shininess: 15,
      specular: new THREE.Color(0x112244),
    });
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_R, 128, 64),
      sphereMat
    );
    globe.add(sphere);

    // Load image texture via expo-asset (resolves the Metro asset ID to a real URL)
    const asset = Asset.fromModule(EARTH_DAY_MODULE);
    (asset.localUri ? Promise.resolve() : asset.downloadAsync()).then(() => {
      if (isDisposed) return;
      const url = asset.localUri ?? asset.uri;
      new THREE.TextureLoader().load(url, (tex) => {
        if (isDisposed) { tex.dispose(); return; }
        tex.colorSpace = THREE.SRGBColorSpace;
        sphereMat.map = tex;
        sphereMat.color.set(0xffffff);
        sphereMat.needsUpdate = true;
      });
    });

    // Atmosphere — inner glow
    globe.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(GLOBE_R * 1.025, 64, 32),
        new THREE.MeshBasicMaterial({
          color: 0x2255bb,
          transparent: true,
          opacity: 0.14,
          side: THREE.BackSide,
          depthWrite: false,
        })
      )
    );
    // Atmosphere — outer halo
    globe.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(GLOBE_R * 1.1, 64, 32),
        new THREE.MeshBasicMaterial({
          color: 0x4488dd,
          transparent: true,
          opacity: 0.05,
          side: THREE.BackSide,
          depthWrite: false,
        })
      )
    );

    // City markers — dot + soft glow + pulsing ring, staggered per marker
    type MarkerEntry = { dot: THREE.Mesh; pulse: THREE.Mesh; pulseMat: THREE.MeshBasicMaterial; phase: number };
    const markerMeshes: THREE.Mesh[] = []; // only dots — for raycasting
    const markerEntries: MarkerEntry[] = [];

    for (let i = 0; i < MARKERS.length; i++) {
      const { lat, lon, country } = MARKERS[i];
      const pos = latLonToVec3(lat, lon, GLOBE_R + 0.022);

      // Solid dot
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(MARKER_R, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      dot.position.copy(pos);
      dot.userData = { country };
      globe.add(dot);
      markerMeshes.push(dot);

      // Soft glow halo around dot (additive blending = softer look)
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xaaccff,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glow = new THREE.Mesh(new THREE.SphereGeometry(MARKER_R * 1.9, 12, 12), glowMat);
      glow.position.copy(pos);
      globe.add(glow);

      // Pulse sphere — expands outward and fades on each cycle
      const pulseMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const pulse = new THREE.Mesh(new THREE.SphereGeometry(MARKER_R, 12, 12), pulseMat);
      pulse.position.copy(pos);
      globe.add(pulse);

      markerEntries.push({ dot, pulse, pulseMat, phase: i / MARKERS.length });
    }

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    const toNDC = (p: { clientX: number; clientY: number }): THREE.Vector2 => {
      // Use the canvas rect (not container) because canvas may be offset/larger
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((p.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((p.clientY - rect.top) / rect.height) * 2 + 1;
      return ndc;
    };

    // Pick the marker nearest the tap point in screen space. An exact raycast
    // against the tiny dot meshes is practically impossible to land with a
    // finger, so we allow a generous CSS-pixel tap radius and skip markers on
    // the far side of the globe (occluded by the sphere).
    const TAP_RADIUS_PX = 26;
    const _v = new THREE.Vector3();
    const tapMarkerAt = (p: { clientX: number; clientY: number }) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const px = p.clientX - rect.left;
      const py = p.clientY - rect.top;
      let best: THREE.Mesh | null = null;
      let bestDist = Infinity;
      for (const dot of markerMeshes) {
        dot.getWorldPosition(_v);
        // Marker faces the camera when its outward direction (from the globe
        // centre at the origin) points towards +z. Skip clearly back-facing ones.
        if (_v.clone().normalize().z < 0.1) continue;
        _v.project(camera);
        const sx = (_v.x * 0.5 + 0.5) * rect.width;
        const sy = (-_v.y * 0.5 + 0.5) * rect.height;
        const d = Math.hypot(sx - px, sy - py);
        if (d < bestDist) {
          bestDist = d;
          best = dot;
        }
      }
      if (best && bestDist <= TAP_RADIUS_PX) {
        onMarkerClickRef.current?.(best.userData.country as string);
      }
    };

    // Whether a point (mouse or touch) lands on the visible sphere (or a marker
    // on it) rather than on the empty canvas around it. Reused so drag-to-rotate
    // and wheel-to-zoom only kick in when the gesture is actually over the globe
    // — same rule the idle-spin hover pause already follows.
    const pointerOnGlobe = (p: { clientX: number; clientY: number }): boolean => {
      raycaster.setFromCamera(toNDC(p), camera);
      return (
        raycaster.intersectObjects(markerMeshes).length > 0 ||
        raycaster.intersectObject(sphere).length > 0
      );
    };

    // ── Pointer handlers (unify mouse + touch) ───────────────────────────────
    const onPointerDown = (e: PointerEvent) => {
      // A new gesture (no pointers down yet) must start on the sphere itself,
      // not just anywhere in the square canvas around it.
      if (pointers.size === 0 && !pointerOnGlobe(e)) return;

      renderer.domElement.setPointerCapture?.(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 1) {
        isDragging = true;
        hasDragged = false;
        prevMouse = { x: e.clientX, y: e.clientY };
        downPos = { x: e.clientX, y: e.clientY };
        renderer.domElement.style.cursor = "grabbing";
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStartDist = Math.hypot(a.x - b.x, a.y - b.y);
        pinchStartZ = camera.position.z;
        hasDragged = true; // suppress the trailing tap
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) {
        // Hover feedback — mouse only. One raycast decides both the cursor
        // (marker vs empty globe) and whether we're over the sphere at all,
        // so the idle spin only pauses when the pointer is actually on the
        // round globe — not just anywhere inside its square canvas.
        if (e.pointerType === "mouse") {
          raycaster.setFromCamera(toNDC(e), camera);
          const markerHit = raycaster.intersectObjects(markerMeshes).length > 0;
          const globeHit = markerHit || raycaster.intersectObject(sphere).length > 0;
          renderer.domElement.style.cursor = markerHit ? "pointer" : "grab";
          isHovering = globeHit;
        }
        return;
      }

      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size >= 2) {
        // Two-finger pinch → zoom.
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchStartDist > 0) {
          const ratio = pinchStartDist / dist;
          camera.position.z = Math.max(
            MIN_CAM_Z,
            Math.min(CAM_Z_MAX, pinchStartZ * ratio)
          );
        }
        return;
      }

      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      // Drag vs tap is judged by total travel from the gesture's origin, not
      // per-event deltas — a finger tap can jump >3px in a single move event.
      if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > DRAG_SLOP_PX) {
        hasDragged = true;
      }
      globe.rotation.y += dx * 0.005;
      globe.rotation.x = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, globe.rotation.x + dy * 0.005)
      );
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      renderer.domElement.releasePointerCapture?.(e.pointerId);
      const wasTracked = pointers.delete(e.pointerId);

      if (pointers.size < 2) pinchStartDist = 0;

      if (pointers.size === 1) {
        // Resume single-finger drag from the remaining pointer.
        const [p] = [...pointers.values()];
        prevMouse = { x: p.x, y: p.y };
        isDragging = true;
        return;
      }

      if (pointers.size === 0) {
        isDragging = false;
        renderer.domElement.style.cursor = "grab";
        // Touch tap on a marker (mouse taps go through the click handler).
        if (wasTracked && !hasDragged && e.pointerType !== "mouse") {
          tapMarkerAt(e);
        }
      }
    };

    // Gesture stolen by the browser (e.g. page scroll) — release state without
    // treating it as a tap.
    const onPointerCancel = (e: PointerEvent) => {
      renderer.domElement.releasePointerCapture?.(e.pointerId);
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchStartDist = 0;
      if (pointers.size === 0) {
        isDragging = false;
        renderer.domElement.style.cursor = "grab";
      }
    };

    const onClick = (e: MouseEvent) => {
      if (hasDragged) return;
      tapMarkerAt(e);
    };

    // Safety net: pointermove stops firing once the pointer leaves the canvas,
    // so force the spin back on when that happens (it no longer gets set to
    // true on enter — the pointermove hit-test above owns that).
    const onMouseLeave = () => { isHovering = false; };

    const onWheel = (e: WheelEvent) => {
      // Only zoom when the cursor is over the sphere — otherwise let the page
      // scroll normally through the empty part of the canvas.
      if (!pointerOnGlobe(e)) return;
      e.preventDefault();
      e.stopPropagation();
      camera.position.z = Math.max(MIN_CAM_Z, Math.min(CAM_Z_MAX, camera.position.z + e.deltaY * 0.003));
    };

    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("click", onClick);
    renderer.domElement.addEventListener("mouseleave", onMouseLeave);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);

    // Animation loop
    const clock = new THREE.Clock();
    let elapsed = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      elapsed += dt;
      if (!isDragging && !isHovering) globe.rotation.y += dt * 0.07;

      // Pulse: each marker expands from 1× to 4× while fading from 0.5 → 0
      for (const { pulse, pulseMat, phase } of markerEntries) {
        const t = ((elapsed / PULSE_PERIOD + phase) % 1); // 0 → 1 looping
        pulse.scale.setScalar(1 + t * 3.5);
        pulseMat.opacity = 0.5 * (1 - t);
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler — keep canvas square and re-centered
    const onResize = () => {
      if (!container || isDisposed) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      s = sideLen(nw, nh);
      // camera.aspect stays 1 (square canvas)
      camera.updateProjectionMatrix();
      renderer.setSize(s, s);
      renderer.domElement.style.top = `${Math.round((nh - s) / 2)}px`;
      renderer.domElement.style.left = `${Math.round((nw - s) / 2)}px`;
    };
    window.addEventListener("resize", onResize);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("mouseleave", onMouseLeave);
      renderer.domElement.removeEventListener("wheel", onWheel);
      // Geometries, materials and the 2K texture are not reachable from the
      // renderer, so they have to be walked and freed by hand.
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of materials) {
          if (!mat) continue;
          (mat as THREE.MeshPhongMaterial).map?.dispose();
          mat.dispose();
        }
      });
      // `dispose()` frees what three allocated but leaves the WebGL context
      // open, and a browser only grants so many. Without this every mount
      // leaked one until the next globe could not get one at all.
      renderer.dispose();
      renderer.forceContextLoss();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Decorative stand-in: the same map, flat and inert. The markers are a
  // shortcut to a country filter that the rest of the page also offers, so
  // losing them costs navigation nothing.
  if (!hasContext) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <img
          src={Asset.fromModule(EARTH_DAY_MODULE).uri}
          alt=""
          aria-hidden
          style={{
            height: "100%",
            maxWidth: "100%",
            aspectRatio: "1 / 1",
            objectFit: "cover",
            borderRadius: "50%",
            opacity: 0.9,
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: bleed ? "visible" : "hidden",
        touchAction: "none",
      }}
    />
  );
}
