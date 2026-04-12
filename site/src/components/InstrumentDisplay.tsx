import { useRef, useEffect } from "preact/hooks";

const DPR = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
const W = 480;
const H = 320;
const PAD_T = 40;
const PAD_B = 32;
const PAD_L = 40;
const PAD_R = 20;
const THRESH_FRAC = 0.32; // threshold at 32% from top of plot area

// Smooth noise using layered sine waves with slowly drifting phases
function sampleWaveform(x: number, time: number, amp: number): number {
  return (
    Math.sin(x * 5.0 + time * 1.8) * 0.35 +
    Math.sin(x * 11.0 + time * 2.7 + 1.0) * 0.25 +
    Math.sin(x * 23.0 + time * 0.9 + 2.5) * 0.15 +
    Math.sin(x * 7.3 - time * 1.3 + 0.7) * 0.15 +
    Math.sin(x * 37.0 + time * 4.1) * 0.10
  ) * amp;
}

function getAmplitude(time: number): number {
  const base = 0.18;
  // Spike pattern: ramp up, hold briefly, decay — every ~6 seconds
  const cycle = time % 6;
  if (cycle < 3.5) return base;
  if (cycle < 4.2) {
    // ramp up
    const t = (cycle - 3.5) / 0.7;
    return base + t * t * 0.72;
  }
  if (cycle < 4.6) {
    // hold near peak
    return base + 0.72 - (cycle - 4.2) * 0.1;
  }
  // decay
  const t = (cycle - 4.6) / 1.4;
  return base + (0.68 - t * 0.68) * Math.max(0, 1 - t);
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

    const LABEL_FONT = "500 9px 'Inter', sans-serif";
    const LABEL_SMALL_FONT = "500 8px 'Inter', sans-serif";
    const SHH_FONT = "600 22px 'Inter', sans-serif";

    function draw(time: number) {
      ctx!.clearRect(0, 0, W, H);

      // Outer bezel
      roundRect(ctx!, 0, 0, W, H, 12, "#1e1e22", "#3a3a42", 1.5);

      // Inner display
      roundRect(ctx!, 10, 10, W - 20, H - 20, 6, "#111114", "#2a2a30", 1);

      // Grid lines
      ctx!.strokeStyle = "#2a2a30";
      ctx!.lineWidth = 0.5;
      for (let i = 1; i < 4; i++) {
        const y = plotT + (plotH * i) / 4;
        line(ctx!, plotL, y, plotR, y);
      }
      for (let i = 1; i < 5; i++) {
        const x = plotL + (plotW * i) / 5;
        line(ctx!, x, plotT, x, plotB);
      }

      // Threshold line
      const amp = getAmplitude(time);
      const crossed = amp > 0.55;

      ctx!.strokeStyle = crossed ? "#e05050" : "#c44040";
      ctx!.lineWidth = crossed ? 1.5 : 1;
      ctx!.setLineDash([6, 4]);
      line(ctx!, plotL, threshY, plotR, threshY);
      ctx!.setLineDash([]);

      // Threshold label — below line, right-aligned
      ctx!.font = LABEL_SMALL_FONT;
      ctx!.fillStyle = crossed ? "#e05050" : "#c44040";
      ctx!.textAlign = "right";
      ctx!.textBaseline = "top";
      ctx!.letterSpacing = "0.15em";
      ctx!.fillText("THRESHOLD \u25B4", plotR - 2, threshY + 5);

      // Waveform
      ctx!.beginPath();
      ctx!.strokeStyle = crossed ? "#5cb86c" : "#4a9a5a";
      ctx!.lineWidth = 1.5;
      ctx!.lineJoin = "round";
      ctx!.lineCap = "round";
      const points = 80;
      for (let i = 0; i <= points; i++) {
        const frac = i / points;
        const x = plotL + frac * plotW;
        const val = sampleWaveform(frac * 10, time, amp);
        const y = centerY - val * plotH * 0.45;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.stroke();

      // REC indicator — circle then text, top-right
      const recX = plotR - 4;
      const recY = plotT + 10;
      ctx!.fillStyle = crossed ? "#e05050" : "#c44040";
      ctx!.beginPath();
      ctx!.arc(recX - 30, recY, crossed ? 5 : 3.5, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.font = LABEL_FONT;
      ctx!.textAlign = "right";
      ctx!.textBaseline = "middle";
      ctx!.letterSpacing = "0.15em";
      ctx!.fillText("REC", recX, recY);

      // SHH flash
      if (crossed) {
        ctx!.save();
        ctx!.font = SHH_FONT;
        ctx!.textAlign = "center";
        ctx!.textBaseline = "middle";
        ctx!.letterSpacing = "0.25em";

        // Glow layers
        ctx!.shadowColor = "#e05050";
        ctx!.shadowBlur = 20;
        ctx!.fillStyle = "#e05050";
        ctx!.fillText("SHH!", plotL + plotW / 2, plotT + 22);
        ctx!.shadowBlur = 10;
        ctx!.fillText("SHH!", plotL + plotW / 2, plotT + 22);
        ctx!.shadowBlur = 0;
        ctx!.fillStyle = "#ff7070";
        ctx!.fillText("SHH!", plotL + plotW / 2, plotT + 22);
        ctx!.restore();
      }

      // Corner axis labels
      ctx!.font = LABEL_SMALL_FONT;
      ctx!.fillStyle = "#4a4a52";
      ctx!.letterSpacing = "0.12em";

      ctx!.textAlign = "left";
      ctx!.textBaseline = "top";
      ctx!.fillText("dB", plotL + 4, plotT + 4);

      ctx!.textBaseline = "bottom";
      ctx!.fillText("RMS", plotL + 4, plotB - 4);

      ctx!.textAlign = "right";
      ctx!.fillText("TIME", plotR - 4, plotB - 4);
    }

    if (prefersReduced) {
      draw(4.0); // static snapshot at a calm moment
      return;
    }

    startRef.current = performance.now();

    function tick() {
      const elapsed = (performance.now() - startRef.current) / 1000;
      draw(elapsed);
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
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke: string,
  lineWidth: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
