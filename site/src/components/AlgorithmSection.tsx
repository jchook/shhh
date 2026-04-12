import * as stylex from "@stylexjs/stylex";
import { colors } from "../styles/colors.stylex.ts";
import { spacing } from "../styles/spacing.stylex.ts";
import { typography } from "../styles/typography.stylex.ts";

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
    alignItems: "start",
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
  codeWrap: {
    backgroundColor: colors.bgPanel,
    border: `1px solid ${colors.borderDefault}`,
    borderRadius: "8px",
    padding: spacing.lg,
    overflow: "auto",
  },
  codeLabel: {
    fontFamily: typography.fontMono,
    fontSize: typography.labelSize,
    textTransform: "uppercase",
    letterSpacing: typography.labelSpacing,
    color: colors.textMono,
    marginBottom: spacing.md,
  },
  code: {
    fontFamily: typography.fontMono,
    fontSize: typography.textXs,
    lineHeight: "1.75",
    color: colors.textPrimary,
    whiteSpace: "pre",
    display: "block",
  },
  keyword: {
    color: colors.accentRed,
  },
  comment: {
    color: colors.textSecondary,
  },
  fn: {
    color: colors.accentGreenBright,
  },
  str: {
    color: colors.accentAmber,
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
            energy (RMS), tracks peaks, blends them with a sensitivity control,
            and converts the result into dB — so alerting feels smarter and more
            configurable than a simple amplitude threshold.
          </p>
        </div>
        <div {...stylex.props(styles.codeWrap)}>
          <div {...stylex.props(styles.codeLabel)}>loudness.rs</div>
          <code {...stylex.props(styles.code)}>
            <span {...stylex.props(styles.keyword)}>pub fn </span>
            <span {...stylex.props(styles.fn)}>compute_loudness</span>
            {"(\n  data_window: &[f32],\n  sensitivity: f32,\n) -> (f32, f32, f32, f32) {\n"}
            <span {...stylex.props(styles.comment)}>
              {"  // Calculate RMS\n"}
            </span>
            <span {...stylex.props(styles.keyword)}>{"  let "}</span>
            {"rms = (data_window.iter()\n    .map(|s| s * s)\n    .sum::<f32>()\n    / data_window.len() "}
            <span {...stylex.props(styles.keyword)}>as </span>
            {"f32).sqrt();\n\n"}
            <span {...stylex.props(styles.comment)}>
              {"  // Calculate Peak amplitude\n"}
            </span>
            <span {...stylex.props(styles.keyword)}>{"  let "}</span>
            {"peak = data_window.iter()\n    .cloned()\n    .fold("}
            <span {...stylex.props(styles.str)}>0.0</span>
            {"_f32, f32::max);\n\n"}
            <span {...stylex.props(styles.comment)}>
              {"  // Hybrid metric: RMS + Peak\n"}
            </span>
            <span {...stylex.props(styles.keyword)}>{"  let "}</span>
            {"hybrid = ("}
            <span {...stylex.props(styles.str)}>1.0</span>
            {" - sensitivity) * rms\n    + sensitivity * peak;\n\n"}
            <span {...stylex.props(styles.comment)}>
              {"  // Convert to dB\n"}
            </span>
            <span {...stylex.props(styles.keyword)}>{"  let "}</span>
            {"db = "}
            <span {...stylex.props(styles.str)}>20.0</span>
            {" * hybrid.max("}
            <span {...stylex.props(styles.str)}>1e-10</span>
            {").log10();\n\n  (rms, peak, hybrid, db)\n}"}
          </code>
        </div>
      </div>
    </section>
  );
}
