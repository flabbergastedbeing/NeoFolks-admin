import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

type NeuformMode = "dark" | "light";
type NeuformModePreference = NeuformMode | "auto";

type FocusTarget = {
  selector: string;
  role: "background" | "ui";
  width?: string;
};

type BakeKnobs = {
  size: number;
  gap: number;
  length: number;
  density: number;
  strokeWidth: number;
  mode: NeuformMode;
  focusY: number;
};

type EffectDefinition = {
  title: string;
  source: string;
  background: string | ((mode: NeuformMode) => string);
  defaultMode?: NeuformModePreference;
  supportsMode?: boolean;
  targets: readonly FocusTarget[];
  focusCss?: string;
  patch?: (source: string, knobs: BakeKnobs) => string;
};

export type GatewayFlowProps = {
  mode?: NeuformModePreference;
  speed?: number;
  size?: number;
  gap?: number;
  length?: number;
  density?: number;
  strokeWidth?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Vertical position (0–1) where the two flows converge, as a fraction of
   * the canvas height. 0.5 (default) is dead-center; higher pushes the
   * convergence point further down. */
  focusY?: number;
  className?: string;
  style?: CSSProperties;
};

const GATEWAY_FLOW_DEFAULTS = {
  mode: "dark" as NeuformMode,
  speed: 1,
  size: 1,
  gap: 2,
  length: 1,
  density: 1,
  strokeWidth: 1,
  opacity: 1,
  hue: 0,
  saturation: 1,
  brightness: 1,
  focusY: 0.5,
} as const;

const LIGHT_PAPER = "#eef1f6";

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function scaleCount(base: number, density: number, minimum = 1) {
  return Math.max(minimum, Math.round(base * density));
}

function resolveMode(
  mode: NeuformMode | number | string | undefined,
  fallback: NeuformMode = "dark",
): NeuformMode {
  if (mode === undefined || mode === null) return fallback;
  if (mode === "light" || mode === 1 || mode === "1") return "light";
  return "dark";
}

function readAutomaticMode(): NeuformMode {
  if (typeof document === "undefined" || typeof window === "undefined")
    return "dark";
  const root = document.documentElement;
  const declared = root.dataset.scheme ?? root.dataset.theme;
  if (declared === "light" || declared === "dark") return declared;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function useAutomaticMode(enabled: boolean) {
  const [mode, setMode] = useState<NeuformMode>(readAutomaticMode);

  useEffect(() => {
    if (
      !enabled ||
      typeof document === "undefined" ||
      typeof window === "undefined"
    )
      return undefined;
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setMode(readAutomaticMode());
    const observer = new MutationObserver(update);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-scheme", "data-theme"],
    });
    media.addEventListener("change", update);
    update();
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
    };
  }, [enabled]);

  return mode;
}

function resolveBackground(
  background: EffectDefinition["background"],
  mode: NeuformMode,
) {
  return typeof background === "function" ? background(mode) : background;
}

const gatewayFlowSource = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexus Gateway</title>
</head>
<body style="margin:0;background:#000;overflow:hidden">
    <canvas id="flow-canvas" style="position:absolute;inset:0;width:100%;height:100%"></canvas>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const MAX_DPR = 1;
            // Multiplier on how fast the particles travel along the curves
            // (1 = original speed, 0.5 = half speed).
            const PARTICLE_SPEED = 0.5;
            const canvas = document.getElementById('flow-canvas');
            const view = canvas.getContext('2d');

            // The dotted curves never move, so they are drawn ONCE into this
            // offscreen layer (on load and on resize) and simply blitted each
            // frame. Only the small moving particles are redrawn per frame.
            // Re-stroking 80 dashed bezier curves every frame was what made
            // scrolling past the hero stutter.
            const layer = document.createElement('canvas');
            const layerCtx = layer.getContext('2d');

            let width = 0, height = 0, effectiveHeight = 0;
            let explosions = [];

            // The lines are generated in layout() at an even spacing, so the
            // whole funnel (above and below the pinch point) looks uniform.
            let paths = [];
            const numPaths = 80;

            function layout() {
                // Render at (at most) MAX_DPR device pixels per CSS pixel. This
                // canvas fills the whole hero, so on a 2x/3x screen a full-res
                // canvas is millions of pixels the browser must composite on
                // every scroll frame. For faint 1px dotted lines the softer
                // look at 1x is barely visible, while scrolling stays smooth.
                // Raise MAX_DPR (e.g. to 1.5 or 2) for crisper dots.
                const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
                width = window.innerWidth;
                height = window.innerHeight;
                // Clamp the effective height used for the flow geometry so
                // very tall or very short/wide containers don't stretch or
                // squash the convergence point off-screen. Caps the
                // vertical spread to roughly a 16:9-ish slice of the
                // width, with a sane floor for narrow containers.
                effectiveHeight = Math.min(height, Math.max(400, width * 0.65));

                canvas.width = width * dpr;
                canvas.height = height * dpr;
                view.setTransform(dpr, 0, 0, dpr, 0, 0);
                layer.width = width * dpr;
                layer.height = height * dpr;
                layerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

                const centerX = width / 2;
                const centerY = effectiveHeight / 2;

                const ctx = layerCtx;
                ctx.clearRect(0, 0, width, height);
                const baseColor = '255, 255, 255';
                ctx.lineWidth = 1.2;
                ctx.setLineDash([1, 4]);
                // One line per side every lineGap pixels, mirrored left/right,
                // from above the top edge down to the bottom of the hero. Same
                // spacing everywhere = the top and bottom halves match.
                const lineGap = Math.max(effectiveHeight * 0.015, 12) * (80 / numPaths);
                paths = [];

                // One line per side every lineGap pixels, mirrored
                // left/right, from above the top edge down to the bottom of
                // the hero. Same formula and same spacing above and below
                // the pinch point, so both halves are identical mirror
                // images of each other — one consistent family, no separate
                // "fill" hack that could drift out of sync with it.
                for (let y = -effectiveHeight * 0.2; y <= height; y += lineGap) {
                    [true, false].forEach(isLeft => {
                        paths.push({
                            isLeft: isLeft,
                            startY: y,
                            p0: null, p1: null, p2: null, p3: null,
                            particles: [{
                                t: Math.random(),
                                speed: (0.0015 + Math.random() * 0.002) * PARTICLE_SPEED
                            }]
                        });
                    });
                }

                // The lines are evenly spaced along the edge, but perspective
                // naturally packs them closer and closer together as they
                // approach the pinch point — with a flat stroke color that
                // pile-up reads as one bright, merged blob right at the
                // convergence. Fading the stroke out toward the pinch (via a
                // radial gradient, so it still costs only one ctx.stroke()
                // call) removes that hotspot without touching the spacing.
                const fadeRadius = Math.max(effectiveHeight * 0.5, 1);
                const strokeFade = ctx.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, fadeRadius,
                );
                strokeFade.addColorStop(0, 'rgba(' + baseColor + ', 0)');
                strokeFade.addColorStop(0.2, 'rgba(' + baseColor + ', 0.18)');
                strokeFade.addColorStop(1, 'rgba(' + baseColor + ', 0.35)');
                ctx.strokeStyle = strokeFade;

                ctx.beginPath();
                paths.forEach(path => {
                    const startY = path.startY;
                    path.p0 = { x: path.isLeft ? 0 : width, y: startY };
                    path.p1 = { x: path.isLeft ? centerX * 0.5 : width - centerX * 0.5, y: startY };
                    path.p2 = { x: path.isLeft ? centerX * 0.8 : width - centerX * 0.8, y: centerY };
                    path.p3 = { x: centerX, y: centerY };

                    ctx.moveTo(path.p0.x, path.p0.y);
                    ctx.bezierCurveTo(path.p1.x, path.p1.y, path.p2.x, path.p2.y, path.p3.x, path.p3.y);
                });
                ctx.stroke();
                ctx.setLineDash([]);
            }
            window.addEventListener('resize', layout);
            layout();

            window.addEventListener('click', (e) => {
                explosions.push({ x: e.clientX, y: e.clientY, radius: 0, life: 1 });
            });

            function getBezierPoint(t, p0, p1, p2, p3) {
                const u = 1 - t;
                return {
                    x: u**3 * p0.x + 3 * u**2 * t * p1.x + 3 * u * t**2 * p2.x + t**3 * p3.x,
                    y: u**3 * p0.y + 3 * u**2 * t * p1.y + 3 * u * t**2 * p2.y + t**3 * p3.y
                };
            }

            let lastFrameTime = performance.now();

            function render() {
                const frameTime = performance.now();
                const dt = Math.min((frameTime - lastFrameTime) / (1000 / 60), 3);
                lastFrameTime = frameTime;

                if (width > 0 && height > 0 && layer.width > 0) {
                    const ctx = view;
                    ctx.clearRect(0, 0, width, height);
                    ctx.drawImage(layer, 0, 0, width, height);

                    explosions.forEach(exp => {
                        exp.radius += 15 * dt;
                        exp.life -= 0.015 * dt;
                    });
                    explosions = explosions.filter(exp => exp.life > 0);

                    ctx.fillStyle = \`rgba(255, 255, 255, 0.7)\`;

                    paths.forEach(path => {
                        path.particles.forEach(p => {
                            p.t += p.speed * dt;
                            if (p.t > 1) {
                                p.t = 0;
                            }

                            let pos = getBezierPoint(p.t, path.p0, path.p1, path.p2, path.p3);

                            let dxTotal = 0, dyTotal = 0;
                            explosions.forEach(exp => {
                                let dx = pos.x - exp.x;
                                let dy = pos.y - exp.y;
                                let dist = Math.hypot(dx, dy);
                                if (dist < exp.radius + 120 && dist > exp.radius - 120) {
                                    let force = (1 - Math.abs(dist - exp.radius) / 120) * exp.life;
                                    dxTotal += (dx / dist) * force * 80;
                                    dyTotal += (dy / dist) * force * 80;
                                }
                            });

                            pos.x += dxTotal;
                            pos.y += dyTotal;

                            ctx.fillRect(pos.x - 1.5, pos.y - 1.5, 3, 3);
                        });
                    });
                }

                requestAnimationFrame(render);
            }

            render();
        });
    </script>
</body>
</html>`;

const GATEWAY_FLOW_DEFINITION: EffectDefinition = {
  title: "Gateway Flow",
  source: gatewayFlowSource,
  supportsMode: true,
  background: (mode) => (mode === "light" ? LIGHT_PAPER : "#000000"),
  targets: [{ selector: "#flow-canvas", role: "background" }],
  patch(source, { size, density, mode, focusY }) {
    let next = source
      .replace(
        "const numPaths = 80;",
        `const numPaths = ${scaleCount(80, density, 12)};`,
      )
      .replace(
        "p.t += p.speed * dt;",
        "p.t += p.speed * ((window.__SF_CONTROLS&&window.__SF_CONTROLS.speed)||1);",
      )
      .replace(
        "ctx.lineWidth = 1.2;",
        `ctx.lineWidth = ${Number((1.2 * size).toFixed(2))};`,
      )
      .replace(
        "const centerY = effectiveHeight / 2;",
        `const centerY = effectiveHeight * ${clamp(focusY, 0, 1).toFixed(3)};`,
      );
    if (mode === "light") {
      next = next
        .replace(
          "const baseColor = '255, 255, 255';",
          "const baseColor = '26, 31, 42';",
        )
        .replace(
          "ctx.fillStyle = \`rgba(255, 255, 255, 0.7)\`;",
          "ctx.fillStyle = \`rgba(26, 31, 42, 0.75)\`;",
        );
    }
    return next;
  },
};

function buildFocusedDocument(
  definition: EffectDefinition,
  knobs: BakeKnobs & { speed: number; opacity: number },
) {
  const mode = knobs.mode;
  const background = resolveBackground(definition.background, mode);
  const targetJson = JSON.stringify(definition.targets).replace(
    /</g,
    "\\u003c",
  );
  const controlsJson = JSON.stringify({
    mode,
    speed: knobs.speed,
    size: knobs.size,
    gap: knobs.gap,
    length: knobs.length,
    density: knobs.density,
    strokeWidth: knobs.strokeWidth,
    opacity: knobs.opacity,
  }).replace(/</g, "\\u003c");
  const patchedSource = definition.patch
    ? definition.patch(definition.source, {
        size: knobs.size,
        gap: knobs.gap,
        length: knobs.length,
        density: knobs.density,
        strokeWidth: knobs.strokeWidth,
        mode,
        focusY: knobs.focusY,
      })
    : definition.source;
  const focusStyle = `<style data-threeui-focus>
html, body { width: 100% !important; height: 100% !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: ${background} !important; }
body { position: relative !important; display: flex !important; align-items: center !important; justify-content: center !important; }
body > * { visibility: hidden !important; }
body[data-threeui-ready] > [data-threeui-role] { visibility: visible !important; }
[data-threeui-residual] { display: none !important; }
[data-threeui-role="background"] { position: fixed !important; inset: 0 !important; width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; z-index: 0 !important; opacity: 1 !important; pointer-events: none !important; }
[data-threeui-role="ui"] { position: relative !important; z-index: 1 !important; width: min(calc(100% - 32px), var(--threeui-target-width, 1040px)) !important; max-width: none !important; max-height: calc(100% - 32px) !important; margin: auto !important; overflow: auto !important; opacity: 1 !important; transform: none !important; filter: none !important; flex: none !important; box-sizing: border-box !important; }
${definition.focusCss ?? ""}
</style>`;
  const controlScript = `<script data-threeui-controls>
(function () {
  var controls = ${controlsJson};
  window.__SF_CONTROLS = controls;
  var origin = performance.now();
  var virtual = 0;
  var last = origin;
  var performanceNow = performance.now.bind(performance);
  var dateNow = Date.now.bind(Date);
  var dateOrigin = dateNow();
  performance.now = function () {
    var real = performanceNow();
    virtual += (real - last) * (controls.speed || 1);
    last = real;
    return origin + virtual;
  };
  Date.now = function () {
    return dateOrigin + (performance.now() - origin);
  };
  var raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (callback) {
    return raf(function () {
      callback(performance.now());
    });
  };
  function applyVisual() {
    var opacity = controls.opacity == null ? 1 : controls.opacity;
    var size = controls.size == null ? 1 : controls.size;
    Array.prototype.forEach.call(document.querySelectorAll('[data-threeui-role]'), function (element) {
      element.style.opacity = String(opacity);
      if (element.getAttribute('data-threeui-role') === 'ui') {
        element.style.transform = 'scale(' + size + ')';
        element.style.transformOrigin = 'center center';
      }
    });
  }
  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'threeui-controls') return;
    var next = event.data.controls || {};
    Object.keys(next).forEach(function (key) { controls[key] = next[key]; });
    applyVisual();
  });
  window.__SF_APPLY_CONTROLS = applyVisual;
})();
</script>`;
  const focusScript = `<script data-threeui-focus>
(function () {
  var isolated = false;
  function isolate() {
    if (isolated) return;
    var specs = ${targetJson};
    var roots = [];
    specs.forEach(function (spec) {
      var element = document.querySelector(spec.selector);
      if (!element) return;
      element.setAttribute('data-threeui-role', spec.role);
      if (spec.width) element.style.setProperty('--threeui-target-width', spec.width);
      if (!roots.some(function (root) { return root.contains(element); })) roots.push(element);
    });
    if (!roots.length) return;
    isolated = true;
    roots.forEach(function (root) { document.body.appendChild(root); });
    Array.from(document.body.children).forEach(function (element) {
      if (roots.indexOf(element) !== -1) return;
      element.setAttribute('data-threeui-residual', '');
      element.setAttribute('aria-hidden', 'true');
      if ('inert' in element) element.inert = true;
    });
    document.body.setAttribute('data-threeui-ready', '');
    if (window.__SF_APPLY_CONTROLS) window.__SF_APPLY_CONTROLS();
    requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
  }
  function scheduleIsolation() { setTimeout(isolate, 100); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleIsolation, { once: true });
  else scheduleIsolation();
  window.addEventListener('load', isolate, { once: true });
})();
</script>`;
  return patchedSource
    .replace(/<head([^>]*)>/i, `<head$1>${controlScript}${focusStyle}`)
    .replace(/<\/body>/i, `${focusScript}</body>`);
}

function GatewayFlowFrame({
  definition,
  mode,
  speed = GATEWAY_FLOW_DEFAULTS.speed,
  size = GATEWAY_FLOW_DEFAULTS.size,
  gap = GATEWAY_FLOW_DEFAULTS.gap,
  length = GATEWAY_FLOW_DEFAULTS.length,
  density = GATEWAY_FLOW_DEFAULTS.density,
  strokeWidth = GATEWAY_FLOW_DEFAULTS.strokeWidth,
  opacity = GATEWAY_FLOW_DEFAULTS.opacity,
  hue = GATEWAY_FLOW_DEFAULTS.hue,
  saturation = GATEWAY_FLOW_DEFAULTS.saturation,
  brightness = GATEWAY_FLOW_DEFAULTS.brightness,
  focusY = GATEWAY_FLOW_DEFAULTS.focusY,
  className,
  style,
}: GatewayFlowProps & { definition: EffectDefinition }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const requestedMode =
    mode ?? definition.defaultMode ?? GATEWAY_FLOW_DEFAULTS.mode;
  const automaticMode = useAutomaticMode(requestedMode === "auto");
  const resolvedMode =
    requestedMode === "auto"
      ? automaticMode
      : resolveMode(requestedMode, GATEWAY_FLOW_DEFAULTS.mode);
  const background = resolveBackground(definition.background, resolvedMode);
  const safeSpeed = clamp(speed, 0, 3);
  const safeSize = clamp(size, 0.05, 200);
  const safeGap = clamp(gap, 0, 64);
  const safeLength = clamp(length, 0.35, 2.5);
  const safeDensity = clamp(density, 0.25, 2.5);
  const safeStrokeWidth = clamp(strokeWidth, 0.25, 8);
  const safeOpacity = clamp(opacity, 0.05, 1);
  const safeHue = clamp(hue, -180, 180);
  const safeSaturation = clamp(saturation, 0, 2);
  const safeBrightness = clamp(brightness, 0.35, 1.65);
  const safeFocusY = clamp(focusY, 0, 1);

  // Rebuild when baked geometry/mode knobs change. Speed/opacity stay live via postMessage + time wrap.
  const source = useMemo(
    () =>
      buildFocusedDocument(definition, {
        mode: resolvedMode,
        speed: GATEWAY_FLOW_DEFAULTS.speed,
        size: safeSize,
        gap: safeGap,
        length: safeLength,
        density: safeDensity,
        strokeWidth: safeStrokeWidth,
        opacity: GATEWAY_FLOW_DEFAULTS.opacity,
        focusY: safeFocusY,
      }),
    [
      definition,
      resolvedMode,
      safeDensity,
      safeGap,
      safeLength,
      safeSize,
      safeStrokeWidth,
      safeFocusY,
    ],
  );

  useEffect(() => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;
    frame.postMessage(
      {
        type: "threeui-controls",
        controls: {
          mode: resolvedMode,
          speed: safeSpeed,
          size: safeSize,
          gap: safeGap,
          length: safeLength,
          density: safeDensity,
          strokeWidth: safeStrokeWidth,
          opacity: safeOpacity,
        },
      },
      "*",
    );
  }, [
    resolvedMode,
    safeDensity,
    safeGap,
    safeLength,
    safeOpacity,
    safeSize,
    safeSpeed,
    safeStrokeWidth,
    source,
  ]);

  const filter =
    safeHue === 0 && safeSaturation === 1 && safeBrightness === 1
      ? undefined
      : `hue-rotate(${safeHue}deg) saturate(${safeSaturation}) brightness(${safeBrightness})`;

  return (
    <iframe
      ref={iframeRef}
      className={className}
      title={definition.title}
      srcDoc={source}
      sandbox="allow-scripts"
      loading="eager"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        border: 0,
        background,
        filter,
        ...style,
      }}
    />
  );
}

export default function GatewayFlow(props: GatewayFlowProps) {
  return <GatewayFlowFrame {...props} definition={GATEWAY_FLOW_DEFINITION} />;
}