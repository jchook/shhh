import * as stylex from "@stylexjs/stylex";
import { colors } from "../styles/colors.stylex.ts";
import { spacing } from "../styles/spacing.stylex.ts";
import { typography } from "../styles/typography.stylex.ts";
import { button } from "../styles/common.ts";
import { InstrumentDisplay } from "./InstrumentDisplay.tsx";

const styles = stylex.create({
  section: {
    paddingTop: {
      default: spacing.section,
      "@media (max-width: 768px)": spacing.sectionSm,
    },
    paddingBottom: {
      default: spacing.section,
      "@media (max-width: 768px)": spacing.sectionSm,
    },
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
    gap: {
      default: spacing.xxxl,
      "@media (max-width: 768px)": spacing.xxl,
    },
    alignItems: "center",
  },
  eyebrow: {
    fontFamily: typography.fontMono,
    fontSize: typography.monoLabel,
    textTransform: "uppercase",
    letterSpacing: typography.labelSpacing,
    color: colors.accentGreen,
    marginBottom: spacing.lg,
  },
  headline: {
    fontSize: {
      default: typography.text4xl,
      "@media (max-width: 768px)": typography.text3xl,
    },
    fontWeight: "700",
    lineHeight: "1.12",
    letterSpacing: "-0.025em",
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  body: {
    fontSize: "17px",
    lineHeight: "1.65",
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    maxWidth: "460px",
  },
  cta: {
    display: "flex",
    gap: spacing.md,
    marginBottom: spacing.xl,
    flexWrap: "wrap",
  },
  meta: {
    display: "flex",
    gap: spacing.lg,
    flexWrap: "wrap",
  },
  metaItem: {
    fontFamily: typography.fontMono,
    fontSize: typography.monoLabel,
    color: colors.textMono,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  displayWrap: {
    display: "flex",
    justifyContent: "center",
  },
});

export function Hero() {
  return (
    <section {...stylex.props(styles.section)}>
      <div {...stylex.props(styles.grid)}>
        <div>
          <div {...stylex.props(styles.eyebrow)}>
            Real-Time Loudness Monitor
          </div>
          <h1 {...stylex.props(styles.headline)}>
            A quiet little program that tells you when you're being too loud.
          </h1>
          <p {...stylex.props(styles.body)}>
            shh.mom listens to your microphone, measures loudness in real time,
            and says "SHH" when you cross a threshold you control.
          </p>
          <div {...stylex.props(styles.cta)}>
            <a href="#install" {...stylex.props(button.base, button.primary)}>
              Install
            </a>
            <a
              href="https://github.com/jchook/shhh"
              target="_blank"
              rel="noopener noreferrer"
              {...stylex.props(button.base, button.secondary)}
            >
              View on GitHub
            </a>
          </div>
          <div {...stylex.props(styles.meta)}>
            <span {...stylex.props(styles.metaItem)}>Built in Rust</span>
            <span {...stylex.props(styles.metaItem)}>
              macOS / Linux / Windows
            </span>
            <span {...stylex.props(styles.metaItem)}>
              Configurable threshold
            </span>
          </div>
        </div>
        <div {...stylex.props(styles.displayWrap)}>
          <InstrumentDisplay />
        </div>
      </div>
    </section>
  );
}
