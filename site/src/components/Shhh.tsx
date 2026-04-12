import * as stylex from "@stylexjs/stylex";
import { colors } from "../styles/colors.stylex.ts";
import { typography } from "../styles/typography.stylex.ts";

const styles = stylex.create({
  shhh: {
    color: colors.accentRed,
    fontStyle: "italic",
    fontFamily: typography.fontMono,
    fontWeight: "500",
  },
});

export function Shhh() {
  return <span {...stylex.props(styles.shhh)}>shhh</span>;
}
