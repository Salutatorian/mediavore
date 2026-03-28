import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";

export interface PlanetSceneHandle {
  /** Trigger the "consume" implosion toward center */
  consumeLink: () => void;
}

interface PlanetSceneProps {
  processing?: boolean;
}

/* ---------------------------------------------------------------
   Ordered-dither shader — giant "Media Sun" with mouse-reactive
   lighting and a consume-implosion uniform.
--------------------------------------------------------------- */

const VERTEX = /* glsl */ `
  uniform float uConsume;   // 0→1: implode toward center
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vNormal   = normalize(normalMatrix * normal);
    vec3 pos  = position;

    // Consume: vertices pull inward
    float shrink = 1.0 - uConsume * 0.35;
    // Add chaotic jitter during consume
    float jitter = uConsume * 0.12 * sin(pos.x * 30.0 + uTime * 8.0)
                                   * cos(pos.y * 25.0 + uTime * 6.0);
    pos *= shrink;
    pos += normal * jitter;

    vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision mediump float;

  varying vec3 vNormal;
  varying vec3 vWorldPos;

  uniform vec3  uLightDir;
  uniform float uTime;
  uniform float uPulse;
  uniform float uConsume;

  // ---- Bayer 8×8 ordered dither (recursive, WebGL1 safe) ----
  float bayer2(vec2 p) {
    float x = mod(p.x, 2.0);
    float y = mod(p.y, 2.0);
    float a = step(1.0, x);
    float b = step(1.0, y);
    return (a * 2.0 + b * 3.0 - a * b * 4.0) / 4.0;
  }

  float bayer8(vec2 p) {
    float d = 0.0;
    d += bayer2(floor(p / 4.0)) / 4.0;
    d += bayer2(floor(p / 2.0)) / 16.0;
    d += bayer2(floor(p      )) / 64.0;
    return d;
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uLightDir);

    float NdotL = dot(N, L);
    float wrap  = NdotL * 0.5 + 0.5;

    // Pulse effect during processing
    float pulse = 1.0 + uPulse * 0.25 * (0.5 + 0.5 * sin(uTime * 6.0));
    wrap *= pulse;

    // Dither
    float pixelSize = 3.0;
    vec2 ditherCoord = floor(gl_FragCoord.xy / pixelSize);
    float threshold  = bayer8(ditherCoord);

    vec3 litCol    = vec3(0.72, 0.42, 1.0);     // electric violet
    vec3 shadowCol = vec3(0.35, 0.14, 0.65);    // deep purple
    vec3 darkCol   = vec3(0.10, 0.04, 0.18);    // visible dark purple

    vec3 col;
    if (wrap > 0.55) {
      float t = smoothstep(0.55, 0.85, wrap);
      vec3 mid = mix(shadowCol, litCol, 0.5);
      col = (threshold < t) ? litCol : mid;
    } else if (wrap > 0.25) {
      float t = smoothstep(0.25, 0.55, wrap);
      col = (threshold < t) ? shadowCol : darkCol;
    } else {
      col = darkCol;
    }

    // Rim glow — stronger so planet outline is always visible
    float rim = 1.0 - max(dot(N, vec3(0.0, 0.0, 1.0)), 0.0);
    rim = pow(rim, 2.5);
    col += vec3(0.55, 0.28, 0.95) * rim * 0.6;

    // Consume: flash bright violet, then fade to dark
    col = mix(col, vec3(0.55, 0.20, 1.0), uConsume * 0.6);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ---- Debris ---- */

interface Debris {
  mesh: THREE.Mesh;
  radius: number;
  speed: number;
  phase: number;
  tiltX: number;
  tiltY: number;
}

function createDebris(scene: THREE.Scene, isMobile: boolean): Debris[] {
  const count = isMobile ? 10 : 18;
  const geo = new THREE.SphereGeometry(0.08, 6, 6);
  const pieces: Debris[] = [];
  for (let i = 0; i < count; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.75, 0.5, 0.15 + Math.random() * 0.15),
      transparent: true,
      opacity: 0.12 + Math.random() * 0.2,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    pieces.push({
      mesh,
      radius: 3.5 + Math.random() * 5,
      speed: 0.12 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      tiltX: (Math.random() - 0.5) * 1.5,
      tiltY: (Math.random() - 0.5) * 1.5,
    });
  }
  return pieces;
}

/* ============================================================= */

const PlanetScene = forwardRef<PlanetSceneHandle, PlanetSceneProps>(
  function PlanetScene({ processing = false }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const processingRef = useRef(processing);
    processingRef.current = processing;

    // Consume animation state (imperative for perf)
    const consumeRef = useRef({ active: false, value: 0, phase: 0 });

    useImperativeHandle(ref, () => ({
      consumeLink() {
        consumeRef.current = { active: true, value: 0, phase: 0 };
      },
    }));

    const onMouseMove = useCallback((e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    }, []);

    const onTouchMove = useCallback((e: TouchEvent) => {
      const t = e.touches[0];
      mouseRef.current.x = (t.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -((t.clientY / window.innerHeight) * 2 - 1);
    }, []);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const isMobile = window.innerWidth < 768;

      /* ---------- Renderer ---------- */
      const renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: isMobile ? "low-power" : "high-performance",
      });
      renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      /* ---------- Scene / Camera ---------- */
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        100,
      );
      camera.position.set(0, 0, 6);

      /* ---------- Giant Sun ---------- */
      const segments = isMobile ? 48 : 64;
      const planetGeo = new THREE.SphereGeometry(2.4, segments, segments);
      const uniforms = {
        uLightDir: { value: new THREE.Vector3(1, 1, 1).normalize() },
        uTime:     { value: 0 },
        uPulse:    { value: 0 },
        uConsume:  { value: 0 },
      };
      const planetMat = new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms,
      });
      const planet = new THREE.Mesh(planetGeo, planetMat);
      scene.add(planet);

      /* ---------- Debris ---------- */
      const debris = createDebris(scene, isMobile);

      /* ---------- Stars ---------- */
      const starsGeo = new THREE.BufferGeometry();
      const starsCount = isMobile ? 200 : 500;
      const starPositions = new Float32Array(starsCount * 3);
      for (let i = 0; i < starsCount; i++) {
        starPositions[i * 3]     = (Math.random() - 0.5) * 40;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
        starPositions[i * 3 + 2] = -10 - Math.random() * 20;
      }
      starsGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
      const starsMat = new THREE.PointsMaterial({
        size: 0.04,
        color: 0x9966cc,
        transparent: true,
        opacity: 0.3,
      });
      scene.add(new THREE.Points(starsGeo, starsMat));

      /* ---------- Events ---------- */
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("touchmove", onTouchMove, { passive: true });

      const onResize = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      /* ---------- Smoothed state ---------- */
      let pulseSmooth = 0;
      let smoothMouseX = 0;
      let smoothMouseY = 0;

      /* ---------- Animation ---------- */
      let raf = 0;
      const clock = new THREE.Clock();

      const animate = () => {
        raf = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        const dt = Math.min(clock.getDelta(), 0.05);
        uniforms.uTime.value = t;

        // Pulse
        const pulseTarget = processingRef.current ? 1 : 0;
        pulseSmooth += (pulseTarget - pulseSmooth) * 3 * dt;
        uniforms.uPulse.value = pulseSmooth;

        // Consume animation
        const c = consumeRef.current;
        if (c.active) {
          if (c.phase === 0) {
            // Phase 0: implode in (0→1)
            c.value = Math.min(c.value + dt * 1.8, 1);
            if (c.value >= 1) { c.phase = 1; }
          } else {
            // Phase 1: spring back out (1→0)
            c.value = Math.max(c.value - dt * 1.2, 0);
            if (c.value <= 0) { c.active = false; c.value = 0; }
          }
        }
        uniforms.uConsume.value = c.value;

        // Smooth mouse for parallax
        const lerpSpeed = 4 * dt;
        smoothMouseX += (mouseRef.current.x - smoothMouseX) * lerpSpeed;
        smoothMouseY += (mouseRef.current.y - smoothMouseY) * lerpSpeed;

        // Light direction from mouse
        uniforms.uLightDir.value.set(smoothMouseX * 2, smoothMouseY * 2, 1).normalize();

        // Rotation
        const baseSpeed = 0.06;
        const boost = 1 + pulseSmooth * 3 + c.value * 5;
        planet.rotation.y += baseSpeed * boost * dt;

        // 5% parallax: sun drifts with mouse
        planet.position.x = smoothMouseX * 0.15;
        planet.position.y = smoothMouseY * 0.1 + Math.sin(t * 0.5) * 0.06;

        // Debris
        for (const d of debris) {
          const angle = t * d.speed + d.phase;
          d.mesh.position.x = Math.cos(angle) * d.radius + d.tiltX;
          d.mesh.position.y = Math.sin(angle) * d.radius * 0.5 + d.tiltY;
          d.mesh.position.z = Math.sin(angle + d.phase) * 1.5 - 3;
          d.mesh.position.x += smoothMouseX * 0.35 * (d.radius / 6);
          d.mesh.position.y += smoothMouseY * 0.35 * (d.radius / 6);

          // During consume, debris pull inward too
          if (c.value > 0) {
            const pull = c.value * 0.4;
            d.mesh.position.x *= (1 - pull);
            d.mesh.position.y *= (1 - pull);
          }
        }

        renderer.render(scene, camera);
      };
      animate();

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
        container.removeChild(renderer.domElement);
      };
    }, [onMouseMove, onTouchMove]);

    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-0"
        style={{ pointerEvents: "none" }}
      />
    );
  },
);

export default PlanetScene;
