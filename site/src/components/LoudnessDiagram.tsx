import { useRef, useEffect } from "preact/hooks";

const DPR = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
const W = 460;
const H = 340;

// Same organic envelope as the hero display
function envelope(t: number): number {
  const a = Math.sin(t * 0.52) * 0.5 + 0.5;
  const b = Math.sin(t * 0.81 + 1.4) * 0.5 + 0.5;
  const c = Math.sin(t * 1.33 + 2.8) * 0.5 + 0.5;
  const blend = a * 0.4 + b * 0.35 + c * 0.25;
  const conv = a * b * c;
  const raw = blend * 0.5 + conv * 0.95;
  return Math.min(raw * raw * 1.6 + 0.08, 1.0);
}

// Generate a buffer of "audio" samples at a given time
function audioSamples(t: number, count: number): Float32Array {
  const out = new Float32Array(count);
  const env = envelope(t);
  for (let i = 0; i < count; i++) {
    const x = i / count;
    const sig =
      Math.sin(x * 40 + t * 12) * 0.4 +
      Math.sin(x * 67 + t * 19) * 0.25 +
      Math.sin(x * 103 + t * 7) * 0.15 +
      Math.sin(x * 151 + t * 31) * 0.12 +
      Math.sin(x * 211 + t * 4) * 0.08;
    out[i] = sig * env;
  }
  return out;
}

function computeRMS(data: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
  return Math.sqrt(sum / data.length);
}

function computePeak(data: Float32Array): number {
  let max = 0;
  for (let i = 0; i < data.length; i++) {
    const a = Math.abs(data[i]);
    if (a > max) max = a;
  }
  return max;
}

export function LoudnessDiagram() {
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

    const FONT = "500 9px 'Inter', sans-serif";
    const FONT_SM = "500 8px 'Inter', sans-serif";
    const FONT_VAL = "600 13px 'JetBrains Mono', monospace";
    const FONT_LABEL = "600 10px 'Inter', sans-serif";

    const SENSITIVITY = 0.6;

    // Layout regions
    const margin = 16;
    const waveH = 56;
    const meterH = 28;
    const gap = 14;
    const flowY = margin + waveH + gap;
    const meterW = W - margin * 2 - 80;

    // Smoothed values for gentle animation
    let sRms = 0;
    let sPeak = 0;
    let sHybrid = 0;
    let sDb = -60;

    function draw(time: number) {
      const samples = audioSamples(time, 256);
      const rms = computeRMS(samples);
      const peak = computePeak(samples);
      const hybrid = (1 - SENSITIVITY) * rms + SENSITIVITY * peak;
      const db = 20 * Math.log10(Math.max(hybrid, 1e-10));

      // Smooth
      sRms += (rms - sRms) * 0.12;
      sPeak += (peak - sPeak) * 0.15;
      sHybrid += (hybrid - sHybrid) * 0.12;
      sDb += (db - sDb) * 0.12;

      ctx!.clearRect(0, 0, W, H);

      // Background panel
      ctx!.beginPath();
      ctx!.roundRect(0, 0, W, H, 8);
      ctx!.fillStyle = "#1a1a1e";
      ctx!.fill();
      ctx!.strokeStyle = "#3a3a42";
      ctx!.lineWidth = 1;
      ctx!.stroke();

      // --- WAVEFORM PREVIEW ---
      const waveL = margin;
      const waveR = W - margin;
      const waveTop = margin;
      const waveMid = waveTop + waveH / 2;

      // Waveform background
      ctx!.fillStyle = "#111114";
      ctx!.beginPath();
      ctx!.roundRect(waveL, waveTop, waveR - waveL, waveH, 4);
      ctx!.fill();

      // Label
      ctx!.font = FONT_SM;
      ctx!.fillStyle = "#4a4a52";
      ctx!.textAlign = "left";
      ctx!.textBaseline = "top";
      ctx!.letterSpacing = "0.12em";
      ctx!.fillText("INPUT SIGNAL", waveL + 6, waveTop + 5);

      // Draw waveform
      ctx!.beginPath();
      ctx!.strokeStyle = "rgba(74, 154, 90, 0.7)";
      ctx!.lineWidth = 1;
      const waveW = waveR - waveL;
      for (let i = 0; i < samples.length; i++) {
        const x = waveL + (i / samples.length) * waveW;
        const y = waveMid - samples[i] * (waveH * 0.4);
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.stroke();

      // --- SIGNAL FLOW ---
      const colL = margin;
      const labelW = 80;
      const barL = colL + labelW;
      const barR = W - margin - 50;
      const barFullW = barR - barL;
      const valX = W - margin - 6;

      let y = flowY;

      // Arrow from waveform to flow
      ctx!.strokeStyle = "#3a3a42";
      ctx!.lineWidth = 1;
      ctx!.setLineDash([3, 3]);
      drawLine(ctx!, W / 2, waveTop + waveH, W / 2, y - 2);
      ctx!.setLineDash([]);

      // RMS meter
      drawMeter(ctx!, "RMS", sRms, "74, 154, 90", colL, y, labelW, barL, barFullW, valX, meterH, FONT_LABEL, FONT_VAL);

      y += meterH + gap;

      // Peak meter
      drawMeter(ctx!, "PEAK", sPeak, "200, 160, 60", colL, y, labelW, barL, barFullW, valX, meterH, FONT_LABEL, FONT_VAL);

      y += meterH + gap + 4;

      // Sensitivity blend indicator
      ctx!.font = FONT;
      ctx!.fillStyle = "#8a8a96";
      ctx!.textAlign = "left";
      ctx!.textBaseline = "middle";
      ctx!.letterSpacing = "0.12em";
      ctx!.fillText("SENSITIVITY", colL, y + meterH / 2);

      // Blend bar showing RMS vs Peak ratio
      const blendL = barL;
      const blendW = barFullW;
      ctx!.fillStyle = "#111114";
      ctx!.beginPath();
      ctx!.roundRect(blendL, y + 4, blendW, meterH - 8, 3);
      ctx!.fill();

      const rmsW = blendW * (1 - SENSITIVITY);
      const peakW = blendW * SENSITIVITY;

      // RMS portion
      ctx!.fillStyle = "rgba(74, 154, 90, 0.3)";
      ctx!.beginPath();
      ctx!.roundRect(blendL, y + 4, rmsW, meterH - 8, [3, 0, 0, 3]);
      ctx!.fill();

      // Peak portion
      ctx!.fillStyle = "rgba(200, 160, 60, 0.3)";
      ctx!.beginPath();
      ctx!.roundRect(blendL + rmsW, y + 4, peakW, meterH - 8, [0, 3, 3, 0]);
      ctx!.fill();

      // Divider
      ctx!.strokeStyle = "#4a4a52";
      ctx!.lineWidth = 1;
      drawLine(ctx!, blendL + rmsW, y + 6, blendL + rmsW, y + meterH - 6);

      // Labels inside blend bar
      ctx!.font = FONT_SM;
      ctx!.textBaseline = "middle";
      ctx!.letterSpacing = "0.1em";
      if (rmsW > 30) {
        ctx!.fillStyle = "rgba(74, 154, 90, 0.7)";
        ctx!.textAlign = "center";
        ctx!.fillText("RMS", blendL + rmsW / 2, y + meterH / 2);
      }
      if (peakW > 30) {
        ctx!.fillStyle = "rgba(200, 160, 60, 0.7)";
        ctx!.textAlign = "center";
        ctx!.fillText("PEAK", blendL + rmsW + peakW / 2, y + meterH / 2);
      }

      // Sensitivity value
      ctx!.font = FONT_VAL;
      ctx!.fillStyle = "#8a8a96";
      ctx!.textAlign = "right";
      ctx!.textBaseline = "middle";
      ctx!.fillText(SENSITIVITY.toFixed(1), valX, y + meterH / 2);

      y += meterH + gap;

      // Arrow down
      ctx!.strokeStyle = "#3a3a42";
      ctx!.lineWidth = 1;
      ctx!.setLineDash([3, 3]);
      drawLine(ctx!, W / 2, y - gap + 2, W / 2, y - 2);
      ctx!.setLineDash([]);

      // Hybrid meter
      drawMeter(ctx!, "HYBRID", sHybrid, "92, 184, 108", colL, y, labelW, barL, barFullW, valX, meterH, FONT_LABEL, FONT_VAL);

      y += meterH + gap;

      // Arrow down
      ctx!.strokeStyle = "#3a3a42";
      ctx!.lineWidth = 1;
      ctx!.setLineDash([3, 3]);
      drawLine(ctx!, W / 2, y - gap + 2, W / 2, y - 2);
      ctx!.setLineDash([]);

      // dB output — larger, more prominent
      ctx!.fillStyle = "#111114";
      ctx!.beginPath();
      ctx!.roundRect(colL, y, W - margin * 2, meterH + 4, 4);
      ctx!.fill();
      ctx!.strokeStyle = "#3a3a42";
      ctx!.lineWidth = 1;
      ctx!.stroke();

      ctx!.font = FONT_LABEL;
      ctx!.fillStyle = sDb > -12 ? "#e05050" : "#5cb86c";
      ctx!.textAlign = "left";
      ctx!.textBaseline = "middle";
      ctx!.letterSpacing = "0.15em";
      ctx!.fillText("OUTPUT", colL + 8, y + (meterH + 4) / 2);

      ctx!.font = "600 16px 'JetBrains Mono', monospace";
      ctx!.textAlign = "right";
      ctx!.fillText(
        `${sDb > -100 ? sDb.toFixed(1) : "-\u221E"} dB`,
        W - margin - 8,
        y + (meterH + 4) / 2,
      );
    }

    if (prefersReduced) {
      // Run a few frames to settle smoothed values
      for (let i = 0; i < 30; i++) draw(3.0);
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
      aria-label="Diagram showing how loudness is computed from RMS and peak amplitude"
    />
  );
}

function drawMeter(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: number,
  color: string,
  colL: number,
  y: number,
  labelW: number,
  barL: number,
  barFullW: number,
  valX: number,
  h: number,
  labelFont: string,
  valFont: string,
) {
  // Label
  ctx.font = labelFont;
  ctx.fillStyle = "#8a8a96";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "0.15em";
  ctx.fillText(label, colL, y + h / 2);

  // Bar background
  ctx.fillStyle = "#111114";
  ctx.beginPath();
  ctx.roundRect(barL, y + 4, barFullW, h - 8, 3);
  ctx.fill();

  // Bar fill
  const fillW = Math.min(value, 1) * barFullW;
  if (fillW > 1) {
    const grad = ctx.createLinearGradient(barL, 0, barL + fillW, 0);
    grad.addColorStop(0, `rgba(${color}, 0.15)`);
    grad.addColorStop(1, `rgba(${color}, 0.5)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(barL, y + 4, fillW, h - 8, 3);
    ctx.fill();

    // Bright edge
    ctx.fillStyle = `rgba(${color}, 0.9)`;
    ctx.fillRect(barL + fillW - 2, y + 4, 2, h - 8);
  }

  // Value
  ctx.font = valFont;
  ctx.fillStyle = `rgba(${color}, 0.9)`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(value.toFixed(3), valX, y + h / 2);
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
