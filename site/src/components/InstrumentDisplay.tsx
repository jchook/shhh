import { useRef, useEffect } from "preact/hooks";

const DPR = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
const W = 480;
const H = 320;
const PAD_T = 40;
const PAD_B = 32;
const PAD_L = 40;
const PAD_R = 20;
const THRESH_FRAC = 0.32;

// Seeded PRNG for deterministic randomization
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateLayers(rng: () => number) {
  const layers = [];
  for (let i = 0; i < 5; i++) {
    layers.push({
      freq: 1.5 + rng() * 4.5,
      speed: 0.4 + rng() * 2.0,
      phase: rng() * Math.PI * 2,
      amp: 0.15 + rng() * 0.35,
      drift: (rng() - 0.5) * 0.3,
    });
  }
  return layers;
}

// Continuous organic envelope using layered slow oscillators
// Guarantees at least one threshold crossing within ~25 seconds
// by using incommensurate frequencies that constructively interfere
function organicEnvelope(time: number): number {
  // Layer 1: slow primary swell (period ~13s)
  const a = Math.sin(time * 0.48 + 0.0) * 0.5 + 0.5;
  // Layer 2: medium drift (period ~8.5s)
  const b = Math.sin(time * 0.74 + 1.2) * 0.5 + 0.5;
  // Layer 3: faster breathing (period ~5.3s)
  const c = Math.sin(time * 1.19 + 3.1) * 0.5 + 0.5;
  // Layer 4: subtle fast variation (period ~3.1s)
  const d = Math.sin(time * 2.03 + 0.7) * 0.5 + 0.5;
  // Layer 5: very slow macro swell (period ~21s)
  const e = Math.sin(time * 0.30 + 2.0) * 0.5 + 0.5;

  // Weighted blend — the product of some terms creates natural
  // "convergence" moments where everything aligns and amplitude peaks.
  // The sum gives a continuous base level so it never fully flatlines.
  const blend =
    a * 0.30 +
    b * 0.25 +
    c * 0.20 +
    d * 0.10 +
    e * 0.15;

  // Convergence boost: when multiple oscillators are high simultaneously,
  // multiply to create organic peaks
  const convergence = a * b * c;

  // Mix: base continuous movement + convergence peaks
  const raw = blend * 0.55 + convergence * 0.9;

  // Shape: apply a soft curve so low volumes stay present
  // and peaks feel natural rather than clipped
  const shaped = raw * raw * 1.8 + 0.06;

  return Math.min(shaped, 1.0);
}

export function InstrumentDisplay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.scale(DPR, DPR);

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const plotL = PAD_L;
    const plotR = W - PAD_R;
    const plotT = PAD_T;
    const plotB = H - PAD_B;
    const plotW = plotR - plotL;
    const plotH = plotB - plotT;
    const threshY = plotT + plotH * THRESH_FRAC;
    const centerY = plotT + plotH * 0.55;
    const maxAmpPx = plotH * 0.40;

    const LABEL_FONT = "500 9px 'Inter', sans-serif";
    const LABEL_SMALL_FONT = "500 8px 'Inter', sans-serif";
    const SHH_FONT = "600 22px 'Inter', sans-serif";

    const rng = mulberry32(42);
    const waveGroups = [
      { layers: generateLayers(rng), color: "74, 154, 90", weight: 1.0 },
      { layers: generateLayers(rng), color: "92, 184, 108", weight: 0.7 },
      { layers: generateLayers(rng), color: "60, 180, 100", weight: 0.5 },
    ];

    // Threshold in envelope space — tuned so peaks cross
    // but the continuous motion means it's not binary
    const THRESH_ENV = 0.55;

    // Smooth the "crossed" state so it doesn't flicker
    let crossedSmooth = 0;

    function draw(time: number) {
      const env = organicEnvelope(time);
      const crossed = env > THRESH_ENV;

      // Smooth transition for visual states
      const target = crossed ? 1 : 0;
      crossedSmooth += (target - crossedSmooth) * 0.08;

      ctx!.clearRect(0, 0, W, H);

      // Outer bezel
      roundRect(ctx!, 0, 0, W, H, 12, "#1e1e22", "#3a3a42", 1.5);
      // Inner display
      roundRect(ctx!, 10, 10, W - 20, H - 20, 6, "#111114", "#2a2a30", 1);

      // Grid
      ctx!.strokeStyle = "#2a2a30";
      ctx!.lineWidth = 0.5;
      for (let i = 1; i < 4; i++) {
        drawLine(ctx!, plotL, plotT + (plotH * i) / 4, plotR, plotT + (plotH * i) / 4);
      }
      for (let i = 1; i < 5; i++) {
        drawLine(ctx!, plotL + (plotW * i) / 5, plotT, plotL + (plotW * i) / 5, plotB);
      }

      // Threshold line — intensity follows smooth state
      const threshAlpha = 0.6 + crossedSmooth * 0.4;
      const threshR = Math.round(196 + crossedSmooth * 28);
      ctx!.strokeStyle = `rgba(${threshR}, 64, 64, ${threshAlpha})`;
      ctx!.lineWidth = 1 + crossedSmooth * 0.5;
      ctx!.setLineDash([6, 4]);
      drawLine(ctx!, plotL, threshY, plotR, threshY);
      ctx!.setLineDash([]);

      // Threshold label
      ctx!.font = LABEL_SMALL_FONT;
      ctx!.fillStyle = `rgba(${threshR}, 64, 64, ${threshAlpha})`;
      ctx!.textAlign = "right";
      ctx!.textBaseline = "top";
      ctx!.letterSpacing = "0.15em";
      ctx!.fillText("THRESHOLD \u25B4", plotR - 2, threshY + 5);

      // Clip to plot area
      ctx!.save();
      ctx!.beginPath();
      ctx!.rect(plotL, plotT, plotW, plotH);
      ctx!.clip();

      // Draw wave groups
      const points = 300;
      const allGroupVals: number[][] = [];

      for (const group of waveGroups) {
        const vals: number[] = [];
        for (let i = 0; i <= points; i++) {
          const frac = i / points;
          const xWorld = frac * 12 - time * 1.2;
          let sum = 0;
          for (const layer of group.layers) {
            const f = layer.freq + Math.sin(time * 0.1) * layer.drift;
            sum +=
              Math.sin(xWorld * f + time * layer.speed + layer.phase) *
              layer.amp;
          }
          vals.push(sum * env * group.weight);
        }
        allGroupVals.push(vals);

        // Gradient fill under wave
        ctx!.beginPath();
        ctx!.moveTo(plotL, centerY);
        for (let i = 0; i <= points; i++) {
          ctx!.lineTo(plotL + (i / points) * plotW, centerY - vals[i] * maxAmpPx);
        }
        ctx!.lineTo(plotR, centerY);
        ctx!.closePath();

        const grad = ctx!.createLinearGradient(0, centerY - maxAmpPx, 0, centerY);
        grad.addColorStop(0, `rgba(${group.color}, 0.12)`);
        grad.addColorStop(1, `rgba(${group.color}, 0.0)`);
        ctx!.fillStyle = grad;
        ctx!.fill();

        // Bottom mirror
        ctx!.beginPath();
        ctx!.moveTo(plotL, centerY);
        for (let i = 0; i <= points; i++) {
          ctx!.lineTo(
            plotL + (i / points) * plotW,
            centerY + vals[i] * maxAmpPx * 0.7,
          );
        }
        ctx!.lineTo(plotR, centerY);
        ctx!.closePath();

        const grad2 = ctx!.createLinearGradient(0, centerY, 0, centerY + maxAmpPx);
        grad2.addColorStop(0, `rgba(${group.color}, 0.0)`);
        grad2.addColorStop(1, `rgba(${group.color}, 0.08)`);
        ctx!.fillStyle = grad2;
        ctx!.fill();

        // Wave stroke
        ctx!.beginPath();
        ctx!.strokeStyle = `rgba(${group.color}, ${0.3 + group.weight * 0.5})`;
        ctx!.lineWidth = 1 + group.weight * 0.5;
        ctx!.lineJoin = "round";
        for (let i = 0; i <= points; i++) {
          const x = plotL + (i / points) * plotW;
          const y = centerY - vals[i] * maxAmpPx;
          if (i === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.stroke();
      }

      // Constructive interference glow
      for (let i = 0; i < points; i++) {
        let total = 0;
        for (const vals of allGroupVals) total += vals[i];
        const intensity = Math.abs(total);
        if (intensity > 0.2) {
          const x = plotL + (i / points) * plotW;
          const y = centerY - total * maxAmpPx;
          const alpha = Math.min(1, (intensity - 0.2) * 1.8);
          ctx!.fillStyle = `rgba(130, 230, 140, ${alpha * 0.35})`;
          ctx!.beginPath();
          ctx!.arc(x, y, 2 + intensity * 3, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      ctx!.restore(); // unclip

      // Center line
      ctx!.strokeStyle = "#2a2a30";
      ctx!.lineWidth = 0.5;
      drawLine(ctx!, plotL, centerY, plotR, centerY);

      // REC indicator
      const recY = plotT + 12;
      const recAlpha = 0.6 + crossedSmooth * 0.4;
      ctx!.fillStyle = `rgba(${Math.round(196 + crossedSmooth * 28)}, ${Math.round(64 + crossedSmooth * 16)}, ${Math.round(64 + crossedSmooth * 16)}, ${recAlpha})`;
      ctx!.beginPath();
      ctx!.arc(plotR - 42, recY, 3.5 + crossedSmooth * 1.5, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.font = LABEL_FONT;
      ctx!.textAlign = "right";
      ctx!.textBaseline = "middle";
      ctx!.letterSpacing = "0.15em";
      ctx!.fillText("REC", plotR - 6, recY);

      // SHH! — fades in/out smoothly
      if (crossedSmooth > 0.05) {
        ctx!.save();
        ctx!.globalAlpha = Math.min(1, crossedSmooth * 1.5);
        ctx!.font = SHH_FONT;
        ctx!.textAlign = "center";
        ctx!.textBaseline = "middle";
        ctx!.letterSpacing = "0.25em";
        ctx!.shadowColor = "#e05050";
        ctx!.shadowBlur = 16 + crossedSmooth * 12;
        ctx!.fillStyle = "#e05050";
        ctx!.fillText("SHH!", plotL + plotW / 2, plotT + 22);
        ctx!.shadowBlur = 6;
        ctx!.fillStyle = `rgba(255, 112, 112, ${crossedSmooth})`;
        ctx!.fillText("SHH!", plotL + plotW / 2, plotT + 22);
        ctx!.restore();
      }

      // Axis labels
      ctx!.font = LABEL_SMALL_FONT;
      ctx!.fillStyle = "#4a4a52";
      ctx!.letterSpacing = "0.12em";
      ctx!.shadowBlur = 0;

      ctx!.textAlign = "left";
      ctx!.textBaseline = "top";
      ctx!.fillText("dB", plotL + 4, plotT + 4);

      ctx!.textBaseline = "bottom";
      ctx!.fillText("RMS", plotL + 4, plotB - 4);

      ctx!.textAlign = "right";
      ctx!.fillText("TIME", plotR - 4, plotB - 4);
    }

    if (prefersReduced) {
      draw(2.0);
      return;
    }

    startRef.current = performance.now();

    function tick() {
      const now = (performance.now() - startRef.current) / 1000;
      draw(now);
      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ width: "100%", maxWidth: `${W}px` }}
      role="img"
      aria-label="Animated loudness meter display showing a waveform crossing a threshold"
    />
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number, fill: string, stroke: string, lw: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.stroke();
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
