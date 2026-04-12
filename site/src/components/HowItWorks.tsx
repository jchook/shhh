import * as stylex from "@stylexjs/stylex";
import { colors } from "../styles/colors.stylex.ts";
import { typography } from "../styles/typography.stylex.ts";

const steps = [
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
    body: 'Plays "SHH" and can optionally trigger OS notifications.',
    icon: "\u25B2",
  },
];

const styles = stylex.create({
  section: {
    paddingBlock: 100,
    paddingInline: 32,
    maxWidth: 1120,
    marginInline: "auto",
  },
  heading: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 48,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(3, 1fr)",
      "@media (max-width: 768px)": "1fr",
    },
    gap: 20,
  },
  card: {
    backgroundColor: colors.bgPanel,
    border: `1px solid ${colors.borderDefault}`,
    borderRadius: 8,
    padding: 28,
  },
  label: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: colors.textMono,
    marginBottom: 16,
  },
  icon: {
    fontSize: 20,
    color: colors.accentGreen,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 1.6,
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
