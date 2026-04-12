import * as stylex from "@stylexjs/stylex";
import { colors } from "./styles/colors.stylex.ts";
import { typography } from "./styles/typography.stylex.ts";
import { useScrollReveal } from "./hooks/useScrollReveal.ts";
import { Nav } from "./components/Nav.tsx";
import { Hero } from "./components/Hero.tsx";
import { Features } from "./components/Features.tsx";
import { AlgorithmSection } from "./components/AlgorithmSection.tsx";
import { InstallSection } from "./components/InstallSection.tsx";
import { Footer } from "./components/Footer.tsx";

const styles = stylex.create({
  app: {
    backgroundColor: colors.bgBase,
    color: colors.textPrimary,
    fontFamily: typography.fontSans,
    minHeight: "100vh",
  },
});

function RevealSection({ children }: { children: preact.ComponentChildren }) {
  const ref = useScrollReveal();
  return <div ref={ref}>{children}</div>;
}

export function App() {
  return (
    <div {...stylex.props(styles.app)}>
      <Nav />
      <main>
        <Hero />
        <RevealSection>
          <Features />
        </RevealSection>
        <RevealSection>
          <AlgorithmSection />
        </RevealSection>
        <RevealSection>
          <InstallSection />
        </RevealSection>
      </main>
      <Footer />
    </div>
  );
}
