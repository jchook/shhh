import { useRef, useEffect } from "preact/hooks";
import {
  mulberry32,
  generateLayers,
  organicEnvelope,
  computeLayerSample,
} from "../audio.ts";
import type { WaveLayer } from "../audio.ts";

const DPR = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
const W = 480;
const H = 320;
const PAD_T = 40;
const PAD_B = 32;
const PAD_L = 40;
const PAD_R = 20;
const THRESH_FRAC = 0.32;
const BUF_LEN = 400;
const SAMPLES_PER_SEC = 80;

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
    const groups = [
      { layers: generateLayers(rng), weight: 1.0 },
      { layers: generateLayers(rng), weight: 0.7 },
      { layers: generateLayers(rng), weight: 0.5 },
    ];
    const groupColors = [
      "74, 154, 90",
      "92, 184, 108",
      "60, 180, 100",
    ];

    // Per-group buffers — each sample frozen at birth
    const bufs: Float32Array[] = groups.map(() => new Float32Array(BUF_LEN));
    const envBuf = new Float32Array(BUF_LEN);

    // Pre-fill buffers with historical data
    const preStartT = -BUF_LEN / SAMPLES_PER_SEC;
    for (let i = 0; i < BUF_LEN; i++) {
      const t = preStartT + i / SAMPLES_PER_SEC;
      envBuf[i] = organicEnvelope(t);
      for (let g = 0; g < groups.length; g++) {
        bufs[g][i] =
          computeLayerSample(t, groups[g].layers) * envBuf[i] * groups[g].weight;
      }
    }

    let sampleAcc = 0;
    let simTime = 0;
    let crossedSmooth = 0;

    const THRESH_ENV = 0.55;

    function draw(dt: number) {
      sampleAcc += dt * SAMPLES_PER_SEC;
      const newCount = Math.floor(sampleAcc);
      sampleAcc -= newCount;

      for (let n = 0; n < newCount; n++) {
        simTime += 1 / SAMPLES_PER_SEC;
        for (let g = 0; g < groups.length; g++) bufs[g].copyWithin(0, 1);
        envBuf.copyWithin(0, 1);

        const env = organicEnvelope(simTime);
        envBuf[BUF_LEN - 1] = env;
        for (let g = 0; g < groups.length; g++) {
          bufs[g][BUF_LEN - 1] =
            computeLayerSample(simTime, groups[g].layers) *
            env *
            groups[g].weight;
        }
      }

      let crossed = false;
      for (let i = BUF_LEN - 20; i < BUF_LEN; i++) {
        if (envBuf[i] > THRESH_ENV) {
          crossed = true;
          break;
        }
      }
      const target = crossed ? 1 : 0;
      crossedSmooth += (target - crossedSmooth) * 0.08;

      ctx!.clearRect(0, 0, W, H);

      // Bezel + display
      roundRect(ctx!, 0, 0, W, H, 12, "#1e1e22", "#3a3a42", 1.5);
      roundRect(ctx!, 10, 10, W - 20, H - 20, 6, "#111114", "#2a2a30", 1);

      // Grid
      ctx!.strokeStyle = "#2a2a30";
      ctx!.lineWidth = 0.5;
      for (let i = 1; i < 4; i++)
        drawLine(ctx!, plotL, plotT + (plotH * i) / 4, plotR, plotT + (plotH * i) / 4);
      for (let i = 1; i < 5; i++)
        drawLine(ctx!, plotL + (plotW * i) / 5, plotT, plotL + (plotW * i) / 5, plotB);

      // Threshold line
      const threshR = Math.round(196 + crossedSmooth * 28);
      const threshAlpha = 0.6 + crossedSmooth * 0.4;
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

      // Clip to plot
      ctx!.save();
      ctx!.beginPath();
      ctx!.rect(plotL, plotT, plotW, plotH);
      ctx!.clip();

      const barW = plotW / BUF_LEN;

      // Draw wave groups back-to-front for depth
      const depthOrder = [2, 1, 0];
      const fillAlphas = [0.06, 0.10, 0.18];
      const strokeAlphas = [0.25, 0.45, 0.80];
      const strokeWidths = [0.8, 1.2, 1.8];
      const mirrorScales = [0.5, 0.6, 0.7];

      for (const g of depthOrder) {
        const buf = bufs[g];
        const color = groupColors[g];
        const fillA = fillAlphas[g];
        const strokeA = strokeAlphas[g];
        const strokeW = strokeWidths[g];
        const mirrorScale = mirrorScales[g];

        ctx!.beginPath();
        ctx!.moveTo(plotL, centerY);
        for (let i = 0; i < BUF_LEN; i++)
          ctx!.lineTo(plotL + (i + 0.5) * barW, centerY - buf[i] * maxAmpPx);
        ctx!.lineTo(plotR, centerY);
        ctx!.closePath();
        const grad = ctx!.createLinearGradient(0, centerY - maxAmpPx, 0, centerY);
        grad.addColorStop(0, `rgba(${color}, ${fillA})`);
        grad.addColorStop(1, `rgba(${color}, 0.0)`);
        ctx!.fillStyle = grad;
        ctx!.fill();

        ctx!.beginPath();
        ctx!.moveTo(plotL, centerY);
        for (let i = 0; i < BUF_LEN; i++)
          ctx!.lineTo(plotL + (i + 0.5) * barW, centerY + buf[i] * maxAmpPx * mirrorScale);
        ctx!.lineTo(plotR, centerY);
        ctx!.closePath();
        const grad2 = ctx!.createLinearGradient(0, centerY, 0, centerY + maxAmpPx);
        grad2.addColorStop(0, `rgba(${color}, 0.0)`);
        grad2.addColorStop(1, `rgba(${color}, ${fillA * 0.5})`);
        ctx!.fillStyle = grad2;
        ctx!.fill();

        ctx!.beginPath();
        ctx!.strokeStyle = `rgba(${color}, ${strokeA})`;
        ctx!.lineWidth = strokeW;
        ctx!.lineJoin = "round";
        for (let i = 0; i < BUF_LEN; i++) {
          const x = plotL + (i + 0.5) * barW;
          const y = centerY - buf[i] * maxAmpPx;
          if (i === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.stroke();
      }

      ctx!.restore();

      // Center line
      ctx!.strokeStyle = "#2a2a30";
      ctx!.lineWidth = 0.5;
      drawLine(ctx!, plotL, centerY, plotR, centerY);

      // REC
      const recY = plotT + 12;
      ctx!.fillStyle = `rgba(${Math.round(196 + crossedSmooth * 28)}, ${Math.round(64 + crossedSmooth * 16)}, ${Math.round(64 + crossedSmooth * 16)}, ${0.6 + crossedSmooth * 0.4})`;
      ctx!.beginPath();
      ctx!.arc(plotR - 42, recY, 3.5 + crossedSmooth * 1.5, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.font = LABEL_FONT;
      ctx!.textAlign = "right";
      ctx!.textBaseline = "middle";
      ctx!.letterSpacing = "0.15em";
      ctx!.fillText("REC", plotR - 6, recY);

      // SHH!
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
      draw(0);
      return;
    }

    startRef.current = performance.now();
    let lastNow = 0;

    function tick() {
      const now = (performance.now() - startRef.current) / 1000;
      const dt = Math.min(now - lastNow, 0.1);
      lastNow = now;
      draw(dt);
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
