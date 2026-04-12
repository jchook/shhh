import * as stylex from "@stylexjs/stylex";
import { colors } from "./colors.stylex.ts";
import { spacing } from "./spacing.stylex.ts";
import { typography } from "./typography.stylex.ts";

export const panel = stylex.create({
  base: {
    backgroundColor: colors.bgPanel,
    border: `1px solid ${colors.borderDefault}`,
    borderRadius: "8px",
    padding: spacing.lg,
  },
  hover: {
    borderColor: {
      default: colors.borderDefault,
      ":hover": colors.borderBright,
    },
    transform: {
      default: "translateY(0)",
      ":hover": "translateY(-2px)",
    },
    transition: "border-color 0.2s ease, transform 0.2s ease",
  },
});

export const label = stylex.create({
  mono: {
    fontFamily: typography.fontMono,
    fontSize: typography.monoLabel,
    textTransform: "uppercase",
    letterSpacing: typography.labelSpacing,
    color: colors.textMono,
  },
});

export const container = stylex.create({
  base: {
    maxWidth: spacing.containerMax,
    marginInline: "auto",
    paddingInline: spacing.containerPad,
  },
});

export const button = stylex.create({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: typography.fontSans,
    fontSize: typography.textSm,
    fontWeight: "500",
    borderRadius: "6px",
    paddingBlock: spacing.md,
    paddingInline: spacing.lg,
    cursor: "pointer",
    transition: "background-color 0.15s ease, border-color 0.15s ease",
    textDecoration: "none",
    border: "1px solid transparent",
    lineHeight: "1",
  },
  primary: {
    backgroundColor: colors.accentRed,
    color: "#fff",
    borderColor: colors.accentRed,
    ":hover": {
      backgroundColor: colors.accentRedGlow,
    },
  },
  secondary: {
    backgroundColor: "transparent",
    color: colors.textPrimary,
    borderColor: colors.borderBright,
    ":hover": {
      borderColor: colors.textSecondary,
    },
  },
});
