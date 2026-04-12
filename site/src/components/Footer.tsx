import * as stylex from "@stylexjs/stylex";
import { colors } from "../styles/colors.stylex.ts";
import { spacing } from "../styles/spacing.stylex.ts";
import { typography } from "../styles/typography.stylex.ts";

const styles = stylex.create({
  footer: {
    borderTop: `1px solid ${colors.borderDefault}`,
    paddingBlock: spacing.xxl,
    paddingInline: spacing.containerPad,
    maxWidth: spacing.containerMax,
    marginInline: "auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: spacing.lg,
  },
  wordmark: {
    fontFamily: typography.fontMono,
    fontSize: typography.textSm,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  link: {
    fontFamily: typography.fontMono,
    fontSize: typography.textXs,
    color: colors.textSecondary,
    textDecoration: "none",
    letterSpacing: "0.05em",
  },
  meta: {
    fontFamily: typography.fontMono,
    fontSize: typography.textXs,
    color: colors.textSecondary,
    letterSpacing: "0.05em",
  },
  status: {
    fontFamily: typography.fontMono,
    fontSize: typography.labelSize,
    textTransform: "uppercase",
    letterSpacing: typography.labelSpacing,
    color: colors.textMono,
  },
});

export function Footer() {
  return (
    <footer {...stylex.props(styles.footer)}>
      <div {...stylex.props(styles.left)}>
        <span {...stylex.props(styles.wordmark)}>shh.mom</span>
        <a
          href="https://github.com/jchook/shhh"
          target="_blank"
          rel="noopener noreferrer"
          {...stylex.props(styles.link)}
        >
          GitHub
        </a>
        <span {...stylex.props(styles.meta)}>MIT</span>
        <span {...stylex.props(styles.meta)}>Built in Rust</span>
      </div>
      <span {...stylex.props(styles.status)}>monitor armed</span>
    </footer>
  );
}
