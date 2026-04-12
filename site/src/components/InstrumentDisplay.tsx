import { useRef, useEffect } from "preact/hooks";

const DPR = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
const W = 480;
const H = 320;
const PAD_T = 40;
const PAD_B = 32;
const PAD_L = 40;
const PAD_R = 20;
const THRESH_FRAC = 0.32;

// Seeded pseudo-random for deterministic but varied behavior
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate randomized wave layer parameters
function generateLayers(rng: () => number) {
  const count = 5;
  const layers = [];
  for (let i = 0; i < count; i++) {
    layers.push({
      freq: 1.5 + rng() * 4.5,       // spatial frequency
      speed: 0.4 + rng() * 2.0,       // scroll speed
      phase: rng() * Math.PI * 2,     // initial phase
      amp: 0.15 + rng() * 0.35,       // relative amplitude
      drift: (rng() - 0.5) * 0.3,     // slow frequency drift
    });
  }
  return layers;
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

    // Generate 3 independent wave groups with different colors/opacities
    const rng = mulberry32(42);
    const waveGroups = [
      { layers: generateLayers(rng), color: "74, 154, 90",  weight: 1.0 },
      { layers: generateLayers(rng), color: "92, 184, 108", weight: 0.7 },
      { layers: generateLayers(rng), color: "60, 180, 100", weight: 0.5 },
    ];

    // Amplitude envelope — varied spike pattern
    function getEnvelope(time: number): number {
      // Multiple overlapping spike cycles at different rates for variety
      const a = spikeEnv(time, 6.5, 0.0);
      const b = spikeEnv(time, 8.3, 2.1);
      const c = spikeEnv(time, 11.7, 5.4);
      return Math.max(a, b, c);
    }

    function spikeEnv(time: number, period: number, offset: number): number {
      const cycle = (time + offset) % period;
      const idle = 0.10 + Math.sin(time * 0.5 + offset) * 0.03;
      if (cycle < period - 2.5) return idle;
      if (cycle < period - 1.8) {
        // ramp
        const t = (cycle - (period - 2.5)) / 0.7;
        return idle + t * t * 0.8;
      }
      if (cycle < period - 1.3) {
        // sustain
        return 0.85 + Math.sin(time * 9 + offset) * 0.06;
      }
      // decay
      const t = (cycle - (period - 1.3)) / 1.3;
      return 0.85 * Math.max(0, 1 - t * t);
    }

    function draw(time: number) {
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

      const env = getEnvelope(time);
      const crossed = env > 0.55;

      // Threshold line
      ctx!.strokeStyle = crossed ? "#e05050" : "#c44040";
      ctx!.lineWidth = crossed ? 1.5 : 1;
      ctx!.setLineDash([6, 4]);
      drawLine(ctx!, plotL, threshY, plotR, threshY);
      ctx!.setLineDash([]);

      // Threshold label
      ctx!.font = LABEL_SMALL_FONT;
      ctx!.fillStyle = crossed ? "#e05050" : "#c44040";
      ctx!.textAlign = "right";
      ctx!.textBaseline = "top";
      ctx!.letterSpacing = "0.15em";
      ctx!.fillText("THRESHOLD \u25B4", plotR - 2, threshY + 5);

      // Clip to plot area for waveforms
      ctx!.save();
      ctx!.beginPath();
      ctx!.rect(plotL, plotT, plotW, plotH);
      ctx!.clip();

      // Draw each wave group — layered sinusoids with additive glow
      const points = 300;
      for (const group of waveGroups) {
        // Compute composite waveform for this group
        const vals: number[] = [];
        for (let i = 0; i <= points; i++) {
          const frac = i / points;
          const xWorld = frac * 12 - time * 1.2; // scrolls left
          let sum = 0;
          for (const layer of group.layers) {
            const f = layer.freq + Math.sin(time * 0.1) * layer.drift;
            sum += Math.sin(xWorld * f + time * layer.speed + layer.phase) * layer.amp;
          }
          vals.push(sum * env * group.weight);
        }

        // Filled glow under the wave
        ctx!.beginPath();
        ctx!.moveTo(plotL, centerY);
        for (let i = 0; i <= points; i++) {
          const x = plotL + (i / points) * plotW;
          ctx!.lineTo(x, centerY - vals[i] * maxAmpPx);
        }
        ctx!.lineTo(plotR, centerY);
        ctx!.closePath();

        const grad = ctx!.createLinearGradient(0, centerY - maxAmpPx, 0, centerY);
        grad.addColorStop(0, `rgba(${group.color}, 0.12)`);
        grad.addColorStop(1, `rgba(${group.color}, 0.0)`);
        ctx!.fillStyle = grad;
        ctx!.fill();

        // Bottom mirror glow
        ctx!.beginPath();
        ctx!.moveTo(plotL, centerY);
        for (let i = 0; i <= points; i++) {
          const x = plotL + (i / points) * plotW;
          ctx!.lineTo(x, centerY + vals[i] * maxAmpPx * 0.7);
        }
        ctx!.lineTo(plotR, centerY);
        ctx!.closePath();

        const grad2 = ctx!.createLinearGradient(0, centerY, 0, centerY + maxAmpPx);
        grad2.addColorStop(0, `rgba(${group.color}, 0.0)`);
        grad2.addColorStop(1, `rgba(${group.color}, 0.08)`);
        ctx!.fillStyle = grad2;
        ctx!.fill();

        // Stroke the wave line
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

      // Constructive interference glow — where waves align, brighten the area
      // Compute sum of all groups at each point
      ctx!.beginPath();
      const sumVals: number[] = [];
      for (let i = 0; i <= points; i++) {
        const frac = i / points;
        const xWorld = frac * 12 - time * 1.2;
        let total = 0;
        for (const group of waveGroups) {
          let sum = 0;
          for (const layer of group.layers) {
            const f = layer.freq + Math.sin(time * 0.1) * layer.drift;
            sum += Math.sin(xWorld * f + time * layer.speed + layer.phase) * layer.amp;
          }
          total += sum * group.weight;
        }
        sumVals.push(total * env);
      }

      // Draw bright composite where amplitude is high
      for (let i = 0; i < points; i++) {
        const intensity = Math.abs(sumVals[i]);
        if (intensity > 0.25) {
          const x = plotL + (i / points) * plotW;
          const y = centerY - sumVals[i] * maxAmpPx;
          const alpha = Math.min(1, (intensity - 0.25) * 2);
          ctx!.fillStyle = `rgba(130, 230, 140, ${alpha * 0.4})`;
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
      ctx!.fillStyle = crossed ? "#e05050" : "#c44040";
      ctx!.beginPath();
      ctx!.arc(plotR - 42, recY, crossed ? 5 : 3.5, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.font = LABEL_FONT;
      ctx!.textAlign = "right";
      ctx!.textBaseline = "middle";
      ctx!.letterSpacing = "0.15em";
      ctx!.fillText("REC", plotR - 6, recY);

      // SHH!
      if (crossed) {
        ctx!.save();
        ctx!.font = SHH_FONT;
        ctx!.textAlign = "center";
        ctx!.textBaseline = "middle";
        ctx!.letterSpacing = "0.25em";
        ctx!.shadowColor = "#e05050";
        ctx!.shadowBlur = 24;
        ctx!.fillStyle = "#e05050";
        ctx!.fillText("SHH!", plotL + plotW / 2, plotT + 22);
        ctx!.shadowBlur = 8;
        ctx!.fillStyle = "#ff7070";
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
