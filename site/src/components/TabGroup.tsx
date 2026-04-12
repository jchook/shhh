import * as stylex from "@stylexjs/stylex";
import { colors } from "../styles/colors.stylex.ts";
import { spacing } from "../styles/spacing.stylex.ts";
import { typography } from "../styles/typography.stylex.ts";

const styles = stylex.create({
  group: {
    display: "inline-flex",
    border: `1px solid ${colors.borderDefault}`,
    borderRadius: "8px",
    overflow: "hidden",
  },
  tab: {
    fontFamily: typography.fontMono,
    fontSize: typography.textSm,
    paddingBlock: "10px",
    paddingInline: spacing.lg,
    backgroundColor: colors.bgPanel,
    color: colors.textSecondary,
    borderLeft: `1px solid ${colors.borderDefault}`,
    cursor: "pointer",
    transition: "color 0.15s ease, background-color 0.15s ease",
    userSelect: "none",
  },
  tabFirst: {
    borderLeft: "none",
  },
  tabActive: {
    backgroundColor: colors.bgPanelHover,
    color: colors.textPrimary,
  },
});

interface TabGroupProps<T extends string> {
  tabs: { value: T; label: string }[];
  active: T;
  onSelect: (value: T) => void;
}

export function TabGroup<T extends string>({
  tabs,
  active,
  onSelect,
}: TabGroupProps<T>) {
  return (
    <div {...stylex.props(styles.group)}>
      {tabs.map((tab, i) => (
        <div
          key={tab.value}
          onClick={() => onSelect(tab.value)}
          {...stylex.props(
            styles.tab,
            i === 0 && styles.tabFirst,
            tab.value === active && styles.tabActive,
          )}
        >
          {tab.label}
        </div>
      ))}
    </div>
  );
}
