import { useRef, useEffect } from "preact/hooks";

const W = 480;
const H = 320;
const PAD = 30;
const THRESHOLD_Y = 120;
const POINTS = 60;

function generateWaveform(time: number): number[] {
  const pts: number[] = [];
  const baseAmp = 30;

  // Create periodic spikes every ~5 seconds
  const cycle = time % 5;
  const spiking = cycle > 3.8 && cycle < 4.6;
  const spikePhase = spiking ? Math.sin(((cycle - 3.8) / 0.8) * Math.PI) : 0;
  const amp = baseAmp + spikePhase * 120;

  for (let i = 0; i < POINTS; i++) {
    const x = i / (POINTS - 1);
    const wave =
      Math.sin(x * 6 + time * 2) * 0.4 +
      Math.sin(x * 14 + time * 3.5) * 0.25 +
      Math.sin(x * 22 + time * 1.2) * 0.15 +
      (Math.random() - 0.5) * 0.2;
    pts.push(wave * amp);
  }
  return pts;
}

function pointsToPath(points: number[]): string {
  const centerY = H / 2 + 20;
  const startX = PAD + 10;
  const endX = W - PAD - 10;
  const step = (endX - startX) / (points.length - 1);

  let d = `M ${startX} ${centerY + points[0]}`;
  for (let i = 1; i < points.length; i++) {
    const x = startX + i * step;
    const y = centerY + points[i];
    d += ` L ${x} ${y.toFixed(1)}`;
  }
  return d;
}

export function InstrumentDisplay() {
  const pathRef = useRef<SVGPathElement>(null);
  const shhRef = useRef<SVGTextElement>(null);
  const recRef = useRef<SVGCircleElement>(null);
  const threshRef = useRef<SVGLineElement>(null);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      // Static snapshot
      const pts = generateWaveform(0);
      if (pathRef.current) pathRef.current.setAttribute("d", pointsToPath(pts));
      return;
    }

    startRef.current = performance.now();

    function tick() {
      const elapsed = (performance.now() - startRef.current) / 1000;
      const pts = generateWaveform(elapsed);
      const path = pointsToPath(pts);

      if (pathRef.current) pathRef.current.setAttribute("d", path);

      // Check if waveform crosses threshold
      const centerY = H / 2 + 20;
      const threshAbs = THRESHOLD_Y;
      const crossed = pts.some((p) => centerY + p < threshAbs);

      if (shhRef.current) {
        shhRef.current.setAttribute("opacity", crossed ? "1" : "0");
      }
      if (recRef.current) {
        recRef.current.setAttribute("r", crossed ? "6" : "4");
        recRef.current.setAttribute(
          "fill",
          crossed ? "#e05050" : "#c44040"
        );
      }
      if (threshRef.current) {
        threshRef.current.setAttribute(
          "stroke",
          crossed ? "#e05050" : "#c44040"
        );
        threshRef.current.setAttribute(
          "stroke-width",
          crossed ? "1.5" : "1"
        );
      }

      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ maxWidth: "480px" }}
      role="img"
      aria-label="Animated loudness meter display showing a waveform crossing a threshold"
    >
      {/* Outer bezel */}
      <rect
        x="0"
        y="0"
        width={W}
        height={H}
        rx="12"
        fill="#1e1e22"
        stroke="#3a3a42"
        strokeWidth="1.5"
      />
      {/* Inner display */}
      <rect
        x={PAD / 2}
        y={PAD / 2}
        width={W - PAD}
        height={H - PAD}
        rx="6"
        fill="#111114"
        stroke="#2a2a30"
        strokeWidth="1"
      />

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={`h${f}`}
          x1={PAD}
          y1={PAD + (H - 2 * PAD) * f}
          x2={W - PAD}
          y2={PAD + (H - 2 * PAD) * f}
          stroke="#2a2a30"
          strokeWidth="0.5"
        />
      ))}
      {[0.2, 0.4, 0.6, 0.8].map((f) => (
        <line
          key={`v${f}`}
          x1={PAD + (W - 2 * PAD) * f}
          y1={PAD}
          x2={PAD + (W - 2 * PAD) * f}
          y2={H - PAD}
          stroke="#2a2a30"
          strokeWidth="0.5"
        />
      ))}

      {/* Threshold line */}
      <line
        ref={threshRef}
        x1={PAD}
        y1={THRESHOLD_Y}
        x2={W - PAD}
        y2={THRESHOLD_Y}
        stroke="#c44040"
        strokeWidth="1"
        strokeDasharray="6 4"
      />

      {/* Threshold label — below line, right-aligned, with up caret */}
      <text
        x={W - PAD - 4}
        y={THRESHOLD_Y + 16}
        fill="#c44040"
        fontSize="9"
        fontFamily="'Inter', sans-serif"
        fontWeight="500"
        textAnchor="end"
        letterSpacing="0.15em"
      >
        THRESHOLD &#x25B4;
      </text>

      {/* Waveform */}
      <path
        ref={pathRef}
        d={`M ${PAD + 10} ${H / 2 + 20} L ${W - PAD - 10} ${H / 2 + 20}`}
        fill="none"
        stroke="#4a9a5a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Recording indicator — circle left of label */}
      <circle ref={recRef} cx={W - PAD - 34} cy={PAD + 10} r={4} fill="#c44040" />
      <text
        x={W - PAD - 4}
        y={PAD + 13}
        fill="#c44040"
        fontSize="9"
        fontFamily="'Inter', sans-serif"
        fontWeight="500"
        textAnchor="end"
        letterSpacing="0.15em"
      >
        REC
      </text>

      {/* SHH glow filter */}
      <defs>
        <filter id="shhGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* SHH flash */}
      <text
        ref={shhRef}
        x={W / 2}
        y={PAD + 28}
        fill="#e05050"
        fontSize="20"
        fontWeight="600"
        fontFamily="'Inter', sans-serif"
        textAnchor="middle"
        letterSpacing="0.2em"
        filter="url(#shhGlow)"
        opacity="0"
      >
        SHH!
      </text>

      {/* Corner labels */}
      <text
        x={PAD + 6}
        y={PAD + 14}
        fill="#4a4a52"
        fontSize="8"
        fontFamily="'Inter', sans-serif"
        fontWeight="500"
        letterSpacing="0.1em"
      >
        dB
      </text>
      <text
        x={PAD + 6}
        y={H - PAD - 6}
        fill="#4a4a52"
        fontSize="8"
        fontFamily="'Inter', sans-serif"
        fontWeight="500"
        letterSpacing="0.1em"
      >
        RMS
      </text>
      <text
        x={W - PAD - 6}
        y={H - PAD - 6}
        fill="#4a4a52"
        fontSize="8"
        fontFamily="'Inter', sans-serif"
        fontWeight="500"
        letterSpacing="0.1em"
        textAnchor="end"
      >
        TIME
      </text>
    </svg>
  );
}
