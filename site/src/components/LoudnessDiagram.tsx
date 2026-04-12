import { useRef, useEffect, useState, useCallback } from "preact/hooks";

const DPR = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
const W = 460;
const H = 340;

function envelope(t: number): number {
  const a = Math.sin(t * 0.52) * 0.5 + 0.5;
  const b = Math.sin(t * 0.81 + 1.4) * 0.5 + 0.5;
  const c = Math.sin(t * 1.33 + 2.8) * 0.5 + 0.5;
  const blend = a * 0.4 + b * 0.35 + c * 0.25;
  const conv = a * b * c;
  const raw = blend * 0.5 + conv * 0.95;
  return Math.min(raw * raw * 1.6 + 0.08, 1.0);
}

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

// Layout constants
const MARGIN = 16;
const WAVE_H = 56;
const METER_H = 28;
const GAP = 14;
const FLOW_Y = MARGIN + WAVE_H + GAP;
const LABEL_W = 80;
const BAR_L = MARGIN + LABEL_W;
const BAR_R = W - MARGIN - 50;
const BAR_FULL_W = BAR_R - BAR_L;

// Sensitivity blend bar Y position (after RMS + Peak meters + gaps)
const BLEND_Y = FLOW_Y + (METER_H + GAP) * 2 + 4;
const BLEND_BAR_Y = BLEND_Y + 4;
const BLEND_BAR_H = METER_H - 8;

export function LoudnessDiagram() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const sensitivityRef = useRef(0.6);
  const [sensitivity, setSensitivity] = useState(0.6);
  const draggingRef = useRef(false);
  const hoveringRef = useRef(false);

  // Convert mouse/touch position to canvas coordinates
  const toCanvasX = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    return (clientX - rect.left) * (W / rect.width);
  }, []);

  const toCanvasY = useCallback((clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    return (clientY - rect.top) * (H / rect.height);
  }, []);

  const isInBlendBar = useCallback((cx: number, cy: number) => {
    return (
      cx >= BAR_L &&
      cx <= BAR_L + BAR_FULL_W &&
      cy >= BLEND_BAR_Y - 6 &&
      cy <= BLEND_BAR_Y + BLEND_BAR_H + 6
    );
  }, []);

  const updateSensitivity = useCallback((cx: number) => {
    const val = Math.max(0, Math.min(1, (cx - BAR_L) / BAR_FULL_W));
    sensitivityRef.current = val;
    setSensitivity(val);
  }, []);

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      const cx = toCanvasX(e.clientX);
      const cy = toCanvasY(e.clientY);
      if (isInBlendBar(cx, cy)) {
        draggingRef.current = true;
        updateSensitivity(cx);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        e.preventDefault();
      }
    },
    [toCanvasX, toCanvasY, isInBlendBar, updateSensitivity],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (draggingRef.current) {
        updateSensitivity(toCanvasX(e.clientX));
        e.preventDefault();
      } else {
        const cx = toCanvasX(e.clientX);
        const cy = toCanvasY(e.clientY);
        const hovering = isInBlendBar(cx, cy);
        if (hovering !== hoveringRef.current) {
          hoveringRef.current = hovering;
          const canvas = canvasRef.current;
          if (canvas) canvas.style.cursor = hovering ? "ew-resize" : "default";
        }
      }
    },
    [toCanvasX, toCanvasY, isInBlendBar, updateSensitivity],
  );

  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

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

    const FONT_SM = "500 8px 'Inter', sans-serif";
    const FONT_VAL = "600 13px 'JetBrains Mono', monospace";
    const FONT_LABEL = "600 10px 'Inter', sans-serif";
    const FONT_HINT = "400 9px 'Inter', sans-serif";

    const colL = MARGIN;
    const valX = W - MARGIN - 6;

    let sRms = 0;
    let sPeak = 0;
    let sHybrid = 0;
    let sDb = -60;

    function draw(time: number) {
      const sens = sensitivityRef.current;
      const samples = audioSamples(time, 256);
      const rms = computeRMS(samples);
      const peak = computePeak(samples);
      const hybrid = (1 - sens) * rms + sens * peak;
      const db = 20 * Math.log10(Math.max(hybrid, 1e-10));

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

      // --- WAVEFORM ---
      const waveL = MARGIN;
      const waveR = W - MARGIN;
      const waveTop = MARGIN;
      const waveMid = waveTop + WAVE_H / 2;

      ctx!.fillStyle = "#111114";
      ctx!.beginPath();
      ctx!.roundRect(waveL, waveTop, waveR - waveL, WAVE_H, 4);
      ctx!.fill();

      ctx!.font = FONT_SM;
      ctx!.fillStyle = "#4a4a52";
      ctx!.textAlign = "left";
      ctx!.textBaseline = "top";
      ctx!.letterSpacing = "0.12em";
      ctx!.fillText("INPUT SIGNAL", waveL + 6, waveTop + 5);

      ctx!.beginPath();
      ctx!.strokeStyle = "rgba(74, 154, 90, 0.7)";
      ctx!.lineWidth = 1;
      const waveW = waveR - waveL;
      for (let i = 0; i < samples.length; i++) {
        const x = waveL + (i / samples.length) * waveW;
        const y = waveMid - samples[i] * (WAVE_H * 0.4);
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.stroke();

      // --- SIGNAL FLOW ---
      let y = FLOW_Y;

      // Arrow from waveform
      ctx!.strokeStyle = "#3a3a42";
      ctx!.lineWidth = 1;
      ctx!.setLineDash([3, 3]);
      drawLine(ctx!, W / 2, waveTop + WAVE_H, W / 2, y - 2);
      ctx!.setLineDash([]);

      // RMS
      drawMeter(ctx!, "RMS", sRms, "74, 154, 90", colL, y, LABEL_W, BAR_L, BAR_FULL_W, valX, METER_H, FONT_LABEL, FONT_VAL);
      y += METER_H + GAP;

      // Peak
      drawMeter(ctx!, "PEAK", sPeak, "200, 160, 60", colL, y, LABEL_W, BAR_L, BAR_FULL_W, valX, METER_H, FONT_LABEL, FONT_VAL);
      y += METER_H + GAP + 4;

      // --- SENSITIVITY (interactive) ---
      const isHover = hoveringRef.current || draggingRef.current;

      // Label
      ctx!.font = FONT_LABEL;
      ctx!.fillStyle = isHover ? "#e8e6e3" : "#8a8a96";
      ctx!.textAlign = "left";
      ctx!.textBaseline = "middle";
      ctx!.letterSpacing = "0.15em";
      ctx!.fillText("SENSITIVITY", colL, y + METER_H / 2);

      // Blend bar background
      ctx!.fillStyle = "#111114";
      ctx!.beginPath();
      ctx!.roundRect(BAR_L, y + 4, BAR_FULL_W, METER_H - 8, 3);
      ctx!.fill();

      // Highlight border on hover/drag
      if (isHover) {
        ctx!.strokeStyle = "#5cb86c";
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.roundRect(BAR_L, y + 4, BAR_FULL_W, METER_H - 8, 3);
        ctx!.stroke();
      }

      const peakW = BAR_FULL_W * sens;
      const rmsW = BAR_FULL_W - peakW;

      // RMS portion (right side — what's left after peak)
      if (rmsW > 0) {
        ctx!.fillStyle = "rgba(74, 154, 90, 0.3)";
        ctx!.beginPath();
        ctx!.roundRect(BAR_L + peakW, y + 4, rmsW, METER_H - 8, [0, 3, 3, 0]);
        ctx!.fill();
      }

      // Peak portion (left side — grows as you drag right)
      if (peakW > 0) {
        ctx!.fillStyle = "rgba(200, 160, 60, 0.3)";
        ctx!.beginPath();
        ctx!.roundRect(BAR_L, y + 4, peakW, METER_H - 8, [3, 0, 0, 3]);
        ctx!.fill();
      }

      // Drag thumb — vertical bar at the split point
      const thumbX = BAR_L + peakW;
      const thumbW = isHover ? 4 : 2;
      ctx!.fillStyle = isHover ? "#e8e6e3" : "#8a8a96";
      ctx!.fillRect(thumbX - thumbW / 2, y + 3, thumbW, METER_H - 6);

      // Labels inside blend bar
      ctx!.font = FONT_SM;
      ctx!.textBaseline = "middle";
      ctx!.letterSpacing = "0.1em";
      if (peakW > 30) {
        ctx!.fillStyle = "rgba(200, 160, 60, 0.7)";
        ctx!.textAlign = "center";
        ctx!.fillText("PEAK", BAR_L + peakW / 2, y + METER_H / 2);
      }
      if (rmsW > 30) {
        ctx!.fillStyle = "rgba(74, 154, 90, 0.7)";
        ctx!.textAlign = "center";
        ctx!.fillText("RMS", BAR_L + peakW + rmsW / 2, y + METER_H / 2);
      }

      // Value
      ctx!.font = FONT_VAL;
      ctx!.fillStyle = isHover ? "#e8e6e3" : "#8a8a96";
      ctx!.textAlign = "right";
      ctx!.textBaseline = "middle";
      ctx!.fillText(sens.toFixed(2), valX, y + METER_H / 2);

      // "drag to adjust" hint
      ctx!.font = FONT_HINT;
      ctx!.fillStyle = isHover ? "rgba(92, 184, 108, 0.6)" : "rgba(138, 138, 150, 0.4)";
      ctx!.textAlign = "center";
      ctx!.textBaseline = "top";
      ctx!.letterSpacing = "0.08em";
      ctx!.fillText(
        isHover ? "drag to adjust" : "\u2190 drag to adjust \u2192",
        BAR_L + BAR_FULL_W / 2,
        y + METER_H + 1,
      );

      y += METER_H + GAP + 12;

      // Arrow
      ctx!.strokeStyle = "#3a3a42";
      ctx!.lineWidth = 1;
      ctx!.setLineDash([3, 3]);
      drawLine(ctx!, W / 2, y - GAP + 2, W / 2, y - 2);
      ctx!.setLineDash([]);

      // Hybrid
      drawMeter(ctx!, "HYBRID", sHybrid, "92, 184, 108", colL, y, LABEL_W, BAR_L, BAR_FULL_W, valX, METER_H, FONT_LABEL, FONT_VAL);
      y += METER_H + GAP;

      // Arrow
      ctx!.strokeStyle = "#3a3a42";
      ctx!.lineWidth = 1;
      ctx!.setLineDash([3, 3]);
      drawLine(ctx!, W / 2, y - GAP + 2, W / 2, y - 2);
      ctx!.setLineDash([]);

      // dB output
      ctx!.fillStyle = "#111114";
      ctx!.beginPath();
      ctx!.roundRect(colL, y, W - MARGIN * 2, METER_H + 4, 4);
      ctx!.fill();
      ctx!.strokeStyle = "#3a3a42";
      ctx!.lineWidth = 1;
      ctx!.stroke();

      ctx!.font = FONT_LABEL;
      ctx!.fillStyle = sDb > -12 ? "#e05050" : "#5cb86c";
      ctx!.textAlign = "left";
      ctx!.textBaseline = "middle";
      ctx!.letterSpacing = "0.15em";
      ctx!.fillText("OUTPUT", colL + 8, y + (METER_H + 4) / 2);

      ctx!.font = "600 16px 'JetBrains Mono', monospace";
      ctx!.textAlign = "right";
      ctx!.fillText(
        `${sDb > -100 ? sDb.toFixed(1) : "-\u221E"} dB`,
        W - MARGIN - 8,
        y + (METER_H + 4) / 2,
      );
    }

    if (prefersReduced) {
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
      style={{ width: "100%", maxWidth: `${W}px`, touchAction: "none" }}
      role="img"
      aria-label="Interactive diagram showing how loudness is computed from RMS and peak amplitude. Drag the sensitivity slider to adjust the blend."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
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
  ctx.font = labelFont;
  ctx.fillStyle = "#8a8a96";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "0.15em";
  ctx.fillText(label, colL, y + h / 2);

  ctx.fillStyle = "#111114";
  ctx.beginPath();
  ctx.roundRect(barL, y + 4, barFullW, h - 8, 3);
  ctx.fill();

  const fillW = Math.min(value, 1) * barFullW;
  if (fillW > 1) {
    const grad = ctx.createLinearGradient(barL, 0, barL + fillW, 0);
    grad.addColorStop(0, `rgba(${color}, 0.15)`);
    grad.addColorStop(1, `rgba(${color}, 0.5)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(barL, y + 4, fillW, h - 8, 3);
    ctx.fill();

    ctx.fillStyle = `rgba(${color}, 0.9)`;
    ctx.fillRect(barL + fillW - 2, y + 4, 2, h - 8);
  }

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
