import * as stylex from "@stylexjs/stylex";
import { colors } from "./colors.stylex.ts";
import { typography } from "./typography.stylex.ts";

export const panel = stylex.create({
  base: {
    backgroundColor: colors.bgPanel,
    border: `1px solid ${colors.borderDefault}`,
    borderRadius: 8,
    padding: 24,
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
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: colors.textMono,
  },
});

export const container = stylex.create({
  base: {
    maxWidth: 1120,
    marginInline: "auto",
    paddingInline: 24,
  },
});

export const button = stylex.create({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: typography.fontSans,
    fontSize: 14,
    fontWeight: "500",
    borderRadius: 6,
    paddingBlock: 12,
    paddingInline: 24,
    cursor: "pointer",
    transition: "background-color 0.15s ease, border-color 0.15s ease",
    textDecoration: "none",
    border: "1px solid transparent",
    lineHeight: 1,
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
