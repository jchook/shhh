import type { ComponentChildren } from "preact";
import * as stylex from "@stylexjs/stylex";
import { colors } from "../styles/colors.stylex.ts";
import { spacing } from "../styles/spacing.stylex.ts";
import { typography } from "../styles/typography.stylex.ts";
import { Shhh } from "./Shhh.tsx";

const steps: { label: string; title: string; body: ComponentChildren; icon: string }[] = [
  {
    label: "INPUT",
    title: "Listen",
    body: "Reads your microphone input continuously.",
    icon: "\u25C9",
  },
  {
    label: "ANALYSIS",
    title: "Measure",
    body: "Computes loudness from both sustained energy and peaks.",
    icon: "\u2248",
  },
  {
    label: "ALERT",
    title: "Warn",
    body: <>Plays <Shhh /> and can optionally trigger OS notifications.</>,
    icon: "\u25B2",
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
      "@media (max-width: 768px)": "1fr",
    },
    gap: spacing.gap,
  },
  card: {
    backgroundColor: colors.bgPanel,
    border: `1px solid ${colors.borderDefault}`,
    borderRadius: "8px",
    padding: spacing.lg,
  },
  label: {
    fontFamily: typography.fontMono,
    fontSize: typography.labelSize,
    textTransform: "uppercase",
    letterSpacing: typography.labelSpacing,
    color: colors.textMono,
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: typography.textXl,
    color: colors.accentGreen,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.textLg,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: typography.textSm,
    lineHeight: "1.6",
    color: colors.textSecondary,
  },
});

export function HowItWorks() {
  return (
    <section {...stylex.props(styles.section)}>
      <div {...stylex.props(styles.heading)}>How it works</div>
      <div {...stylex.props(styles.grid)}>
        {steps.map((step) => (
          <div key={step.label} {...stylex.props(styles.card)}>
            <div {...stylex.props(styles.label)}>{step.label}</div>
            <div {...stylex.props(styles.icon)}>{step.icon}</div>
            <h3 {...stylex.props(styles.title)}>{step.title}</h3>
            <p {...stylex.props(styles.body)}>{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
