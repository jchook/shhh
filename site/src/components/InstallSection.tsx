import type { ComponentChildren } from "preact";
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

const REPO = "https://github.com/jchook/shhh";
const LATEST = `${REPO}/releases/latest/download`;

const platforms: Record<
  Platform,
  { downloadUrl: string; downloadLabel: string; cargo: ComponentChildren }
> = {
  macos: {
    downloadUrl: `${LATEST}/shhh-darwin`,
    downloadLabel: "Download for macOS",
    cargo: (
      <>
        <CodeBlock>cargo install shhh</CodeBlock>
      </>
    ),
  },
  linux: {
    downloadUrl: `${LATEST}/shhh-linux`,
    downloadLabel: "Download for Linux",
    cargo: (
      <>
        <Step>Install audio dependencies first:</Step>
        <CodeBlock>sudo apt install libasound2-dev pkg-config</CodeBlock>
        <Step>Then install via Cargo:</Step>
        <CodeBlock>cargo install shhh</CodeBlock>
      </>
    ),
  },
  windows: {
    downloadUrl: `${LATEST}/shhh-windows.exe`,
    downloadLabel: "Download for Windows",
    cargo: (
      <>
        <CodeBlock>cargo install shhh</CodeBlock>
      </>
    ),
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
    fontFamily: typography.fontMono,
    fontSize: typography.monoLabel,
    textTransform: "uppercase",
    letterSpacing: typography.labelSpacing,
    color: colors.textSecondary,
  },
  subhead: {
    fontSize: typography.textBase,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  tabWrap: {
    marginBottom: spacing.lg,
  },
  buttons: {
    display: "flex",
    justifyContent: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
    flexWrap: "wrap",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
    width: "100%",
    maxWidth: "560px",
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    backgroundColor: colors.borderDefault,
  },
  dividerText: {
    fontFamily: typography.fontMono,
    fontSize: typography.textXs,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  cargoLabel: {
    fontFamily: typography.fontMono,
    fontSize: typography.textXs,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: spacing.md,
  },
  cargoContent: {
    textAlign: "left",
    maxWidth: "560px",
    width: "100%",
    backgroundColor: colors.bgPanel,
    border: `1px solid ${colors.borderDefault}`,
    borderRadius: "8px",
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  footer: {
    fontFamily: typography.fontMono,
    fontSize: typography.textXs,
    color: colors.textSecondary,
    letterSpacing: "0.05em",
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
});

function Step({ children }: { children: ComponentChildren }) {
  return <p {...stylex.props(styles.step)}>{children}</p>;
}

function CodeBlock({ children }: { children: ComponentChildren }) {
  return <div {...stylex.props(styles.codeBlock)}>{children}</div>;
}

export function InstallSection() {
  const [active, setActive] = useState<Platform>("macos");
  const info = platforms[active];

  return (
    <section id="install" {...stylex.props(styles.section)}>
      <h2 {...stylex.props(styles.heading)}>Install</h2>
      <p {...stylex.props(styles.subhead)}>
        Pick your platform and get running.
      </p>

      <div {...stylex.props(styles.tabWrap)}>
        <TabGroup tabs={platformTabs} active={active} onSelect={setActive} />
      </div>

      <div {...stylex.props(styles.buttons)}>
        <a
          href={info.downloadUrl}
          {...stylex.props(button.base, button.primary)}
        >
          {info.downloadLabel}
        </a>
        <a
          href={`${REPO}#installation`}
          target="_blank"
          rel="noopener noreferrer"
          {...stylex.props(button.base, button.secondary)}
        >
          Read the docs
        </a>
      </div>

      <div {...stylex.props(styles.divider)}>
        <div {...stylex.props(styles.dividerLine)} />
        <span {...stylex.props(styles.dividerText)}>or</span>
        <div {...stylex.props(styles.dividerLine)} />
      </div>

      <div {...stylex.props(styles.cargoLabel)}>Install via Cargo</div>

      <div {...stylex.props(styles.cargoContent)}>{info.cargo}</div>

      <p {...stylex.props(styles.footer)}>
        Set your threshold. Start monitoring. Stop waking people up.
      </p>
    </section>
  );
}
