import type { ComponentChildren } from "preact";
import * as stylex from "@stylexjs/stylex";
import { colors } from "../styles/colors.stylex.ts";
import { spacing } from "../styles/spacing.stylex.ts";
import { typography } from "../styles/typography.stylex.ts";
import { Shhh } from "./Shhh.tsx";
import { REPO_URL } from "../consts.ts";

const features: { label: string; title: ComponentChildren; body: ComponentChildren }[] = [
  {
    label: "AUDIO",
    title: <>Actually says <Shhh /></>,
    body: "Not just a meter. When you cross the line, it tells you.",
  },
  {
    label: "ALERTS",
    title: "Optional OS alerts",
    body: "Can send system notifications too, in case your headphones are off or you miss the audio cue.",
  },
  {
    label: "CONFIG",
    title: "Configurable threshold",
    body: "Tune it to your voice, your room, your microphone, and the time of day.",
  },
  {
    label: "CALIBRATE",
    title: "Real-world calibration",
    body: "Measures your ambient noise and speaking voice, then sets the threshold automatically. No guesswork.",
  },
  {
    label: "ENGINE",
    title: "Advanced loudness detection",
    body: "Uses a hybrid metric based on RMS and peak amplitude instead of a simplistic raw volume cutoff.",
  },
  {
    label: "CORE",
    title: "Built in Rust",
    body: "Fast, dependable, and small. Built like a real utility.",
  },
];

const styles = stylex.create({
  section: {
    paddingBlock: spacing.section,
    paddingInline: spacing.containerPad,
    maxWidth: spacing.containerMax,
    marginInline: "auto",
  },
  heading: {
    fontFamily: typography.fontMono,
    fontSize: typography.monoLabel,
    textTransform: "uppercase",
    letterSpacing: typography.labelSpacing,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xxl,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(3, 1fr)",
      "@media (max-width: 900px)": "repeat(2, 1fr)",
      "@media (max-width: 600px)": "1fr",
    },
    gap: spacing.gap,
  },
  card: {
    backgroundColor: colors.bgPanel,
    border: `1px solid ${colors.borderDefault}`,
    borderRadius: "8px",
    padding: spacing.lg,
    transition: "border-color 0.2s ease, transform 0.2s ease",
    borderColor: {
      default: colors.borderDefault,
      ":hover": colors.borderBright,
    },
    transform: {
      default: "translateY(0)",
      ":hover": "translateY(-2px)",
    },
  },
  label: {
    fontFamily: typography.fontMono,
    fontSize: typography.labelSize,
    textTransform: "uppercase",
    letterSpacing: typography.labelSpacing,
    color: colors.textMono,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.textBase,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: "1.3",
  },
  body: {
    fontSize: typography.textSm,
    lineHeight: "1.6",
    color: colors.textSecondary,
  },
  note: {
    textAlign: "center",
    marginTop: spacing.xl,
    fontSize: typography.textSm,
    color: colors.textSecondary,
    lineHeight: "1.5",
  },
  noteLink: {
    color: colors.accentGreen,
    textDecoration: "none",
    borderBottom: `1px solid ${colors.borderDefault}`,
    transition: "border-color 0.15s ease",
  },
});

export function Features() {
  return (
    <section id="features" {...stylex.props(styles.section)}>
      <h2 {...stylex.props(styles.heading)}>Features</h2>
      <div {...stylex.props(styles.grid)}>
        {features.map((f) => (
          <div key={f.label} {...stylex.props(styles.card)}>
            <div {...stylex.props(styles.label)}>{f.label}</div>
            <h3 {...stylex.props(styles.title)}>{f.title}</h3>
            <p {...stylex.props(styles.body)}>{f.body}</p>
          </div>
        ))}
      </div>
      <p {...stylex.props(styles.note)}>
        100% open source and community-driven.{" "}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          {...stylex.props(styles.noteLink)}
        >
          View on GitHub
        </a>
      </p>
    </section>
  );
}
