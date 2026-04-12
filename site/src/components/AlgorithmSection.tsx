import * as stylex from "@stylexjs/stylex";
import { colors } from "../styles/colors.stylex.ts";
import { spacing } from "../styles/spacing.stylex.ts";
import { typography } from "../styles/typography.stylex.ts";
import { LoudnessDiagram } from "./LoudnessDiagram.tsx";

const styles = stylex.create({
  section: {
    paddingBlock: spacing.section,
    paddingInline: spacing.containerPad,
    maxWidth: spacing.containerMax,
    marginInline: "auto",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: {
      default: "1fr 1fr",
      "@media (max-width: 768px)": "1fr",
    },
    gap: spacing.gapLg,
    alignItems: "center",
  },
  eyebrow: {
    fontFamily: typography.fontMono,
    fontSize: typography.labelSize,
    textTransform: "uppercase",
    letterSpacing: typography.labelSpacing,
    color: colors.textMono,
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: typography.text2xl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    lineHeight: "1.2",
    letterSpacing: "-0.02em",
  },
  body: {
    fontSize: "15px",
    lineHeight: "1.7",
    color: colors.textSecondary,
  },
  diagramWrap: {
    display: "flex",
    justifyContent: "center",
  },
});

export function AlgorithmSection() {
  return (
    <section {...stylex.props(styles.section)}>
      <div {...stylex.props(styles.grid)}>
        <div>
          <div {...stylex.props(styles.eyebrow)}>Engine</div>
          <h2 {...stylex.props(styles.heading)}>
            Smarter than a raw volume cutoff
          </h2>
          <p {...stylex.props(styles.body)}>
            shh.mom doesn't rely on a naive volume spike. It measures sustained
            energy (RMS), tracks peaks, blends them with a configurable
            sensitivity control, and converts the result into dB — so alerting
            feels natural and adapts to your environment.
          </p>
        </div>
        <div {...stylex.props(styles.diagramWrap)}>
          <LoudnessDiagram />
        </div>
      </div>
    </section>
  );
}
