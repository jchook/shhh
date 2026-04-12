import * as stylex from "@stylexjs/stylex";
import { colors } from "../styles/colors.stylex.ts";
import { spacing } from "../styles/spacing.stylex.ts";
import { typography } from "../styles/typography.stylex.ts";

const pulse = stylex.keyframes({
  "0%, 100%": { opacity: 1 },
  "50%": { opacity: 0.4 },
});

const styles = stylex.create({
  backdrop: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    backgroundColor: `color-mix(in srgb, ${colors.bgBase} 85%, transparent)`,
    backdropFilter: "blur(12px)",
    borderBottom: `1px solid ${colors.borderDefault}`,
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBlock: spacing.md,
    paddingInline: spacing.containerPad,
    maxWidth: spacing.containerMax,
    marginInline: "auto",
    width: "100%",
  },
  wordmark: {
    fontFamily: typography.fontMono,
    fontSize: typography.textBase,
    fontWeight: "600",
    color: colors.textPrimary,
    textDecoration: "none",
    letterSpacing: "-0.02em",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: spacing.lg,
  },
  link: {
    fontFamily: typography.fontMono,
    fontSize: typography.monoLabel,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: colors.textSecondary,
    textDecoration: "none",
    transition: "color 0.15s ease",
  },
  status: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    marginLeft: spacing.lg,
  },
  bead: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: colors.accentRed,
    boxShadow: `0 0 8px 2px color-mix(in srgb, ${colors.accentRed} 50%, transparent)`,
    animationName: pulse,
    animationDuration: "2.5s",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
  },
  statusLabel: {
    fontFamily: typography.fontMono,
    fontSize: "9px",
    textTransform: "uppercase",
    letterSpacing: typography.labelSpacing,
    color: colors.accentRed,
  },
  mobileHide: {
    display: {
      default: "flex",
      "@media (max-width: 600px)": "none",
    },
  },
});

export function Nav() {
  return (
    <div {...stylex.props(styles.backdrop)}>
      <nav {...stylex.props(styles.nav)}>
        <a href="#" {...stylex.props(styles.wordmark)}>
          shh.mom
        </a>
        <div {...stylex.props(styles.links)}>
          <div {...stylex.props(styles.mobileHide)}>
            <a href="#features" {...stylex.props(styles.link)}>
              Features
            </a>
          </div>
          <div {...stylex.props(styles.mobileHide)}>
            <a href="#install" {...stylex.props(styles.link)}>
              Install
            </a>
          </div>
          <a
            href="https://github.com/jchook/shhh"
            target="_blank"
            rel="noopener noreferrer"
            {...stylex.props(styles.link)}
          >
            GitHub
          </a>
          <div {...stylex.props(styles.status)}>
            <div {...stylex.props(styles.bead)} />
            <span {...stylex.props(styles.statusLabel)}>Monitor</span>
          </div>
        </div>
      </nav>
    </div>
  );
}
