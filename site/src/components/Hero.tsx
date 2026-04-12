import * as stylex from "@stylexjs/stylex";
import { colors } from "../styles/colors.stylex.ts";
import { typography } from "../styles/typography.stylex.ts";
import { button } from "../styles/common.ts";
import { InstrumentDisplay } from "./InstrumentDisplay.tsx";

const styles = stylex.create({
  section: {
    paddingTop: {
      default: 96,
      "@media (max-width: 768px)": 64,
    },
    paddingBottom: {
      default: 120,
      "@media (max-width: 768px)": 80,
    },
    paddingInline: 32,
    maxWidth: 1120,
    marginInline: "auto",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: {
      default: "1fr 1fr",
      "@media (max-width: 768px)": "1fr",
    },
    gap: {
      default: 64,
      "@media (max-width: 768px)": 48,
    },
    alignItems: "center",
  },
  eyebrow: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: colors.accentGreen,
    marginBottom: 20,
  },
  headline: {
    fontSize: {
      default: 44,
      "@media (max-width: 768px)": 32,
    },
    fontWeight: 700,
    lineHeight: 1.12,
    letterSpacing: "-0.025em",
    color: colors.textPrimary,
    marginBottom: 24,
  },
  body: {
    fontSize: 17,
    lineHeight: 1.65,
    color: colors.textSecondary,
    marginBottom: 36,
    maxWidth: 460,
  },
  cta: {
    display: "flex",
    gap: 12,
    marginBottom: 40,
    flexWrap: "wrap",
  },
  meta: {
    display: "flex",
    gap: 24,
    flexWrap: "wrap",
  },
  metaItem: {
    fontFamily: typography.fontMono,
    fontSize: 11,
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
