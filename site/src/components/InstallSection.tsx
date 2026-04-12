import { useState } from "preact/hooks";
import * as stylex from "@stylexjs/stylex";
import { colors } from "../styles/colors.stylex.ts";
import { spacing } from "../styles/spacing.stylex.ts";
import { typography } from "../styles/typography.stylex.ts";
import { button } from "../styles/common.ts";
import { TabGroup } from "./TabGroup.tsx";

type Platform = "macos" | "linux" | "windows";

const platformTabs: { value: Platform; label: string }[] = [
  { value: "macos", label: "macOS" },
  { value: "linux", label: "Linux" },
  { value: "windows", label: "Windows" },
];

const instructions: Record<
  Platform,
  { label: string; steps: string[]; command: string }
> = {
  macos: {
    label: "macOS",
    steps: [
      "Install via Cargo (requires Rust toolchain):",
      "Or download a prebuilt binary from GitHub Releases.",
    ],
    command: "cargo install shhh",
  },
  linux: {
    label: "Linux",
    steps: [
      "Install audio dependencies first:",
      "Then install via Cargo:",
      "Or download a prebuilt binary from GitHub Releases.",
    ],
    command:
      "sudo apt install libasound2-dev pkg-config\ncargo install shhh",
  },
  windows: {
    label: "Windows",
    steps: [
      "Install via Cargo (requires Rust toolchain):",
      "Or download a prebuilt .exe from GitHub Releases.",
    ],
    command: "cargo install shhh",
  },
};

const styles = stylex.create({
  section: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingBlock: spacing.section,
    paddingInline: spacing.containerPad,
    maxWidth: spacing.containerMax,
    marginInline: "auto",
    textAlign: "center",
  },
  heading: {
    fontSize: typography.text3xl,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: "-0.02em",
  },
  subhead: {
    fontSize: typography.textBase,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  tabWrap: {
    marginBottom: spacing.lg,
  },
  content: {
    textAlign: "left",
    maxWidth: "560px",
    marginInline: "auto",
    backgroundColor: colors.bgPanel,
    border: `1px solid ${colors.borderDefault}`,
    borderRadius: "8px",
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  step: {
    fontSize: typography.textSm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: "1.5",
  },
  codeBlock: {
    fontFamily: typography.fontMono,
    fontSize: typography.textSm,
    backgroundColor: colors.bgBase,
    color: colors.accentGreen,
    padding: spacing.md,
    borderRadius: "4px",
    overflow: "auto",
    whiteSpace: "pre",
    marginBottom: spacing.md,
  },
  buttons: {
    display: "flex",
    justifyContent: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
    flexWrap: "wrap",
  },
  footer: {
    fontFamily: typography.fontMono,
    fontSize: typography.textXs,
    color: colors.textSecondary,
    letterSpacing: "0.05em",
  },
});

const platforms: Platform[] = ["macos", "linux", "windows"];

export function InstallSection() {
  const [active, setActive] = useState<Platform>("macos");
  const info = instructions[active];

  return (
    <section id="install" {...stylex.props(styles.section)}>
      <h2 {...stylex.props(styles.heading)}>Install</h2>
      <p {...stylex.props(styles.subhead)}>
        Pick your platform and get running.
      </p>

      <div {...stylex.props(styles.tabWrap)}>
        <TabGroup tabs={platformTabs} active={active} onSelect={setActive} />
      </div>

      <div {...stylex.props(styles.content)}>
        {info.steps.map((step, i) => (
          <p key={i} {...stylex.props(styles.step)}>
            {step}
          </p>
        ))}
        <div {...stylex.props(styles.codeBlock)}>{info.command}</div>
      </div>

      <div {...stylex.props(styles.buttons)}>
        <a
          href="https://github.com/jchook/shhh/releases"
          target="_blank"
          rel="noopener noreferrer"
          {...stylex.props(button.base, button.primary)}
        >
          Download
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

      <p {...stylex.props(styles.footer)}>
        Set your threshold. Start monitoring. Stop waking people up.
      </p>
    </section>
  );
}
