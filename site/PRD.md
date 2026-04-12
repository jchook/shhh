Yes — here’s a **build-ready site spec** you can hand to Claude Code.

You can paste this in as-is:

---

# shh.mom landing page spec

Build a **single-page static landing page** for **shh.mom**.

## Core product context

`shh.mom` is a small cross-platform utility that listens to your microphone, computes loudness in real time, and plays a spoken **“SHH”** sound when you exceed a configured threshold. It can also optionally send OS notifications. It is built in Rust and supports macOS, Linux, and Windows.

This site should feel like a **serious, well-engineered monitoring instrument**, not a startup SaaS template and not a goofy retro parody.

## Tech stack

Use:

* **Vite**
* **Preact**
* **TypeScript**
* **StyleX**
* plain **SVG** for the hero instrument / waveform UI
* no Tailwind
* no Next.js
* no CSS template literal libraries
* no giant component library
* no routing unless absolutely necessary

Output must be a **fully static build** that can be served by Caddy from static files only.

## Design direction

The visual style should feel like:

* retro aircraft / industrial instrument panel
* restrained hacker / retro computer influence
* dark graphite / gunmetal surfaces
* crisp typography
* precise spacing
* subtle gridlines
* red status lights
* muted green waveform accents
* engineered, calm, deliberate

Avoid:

* glossy Apple-style dock icon aesthetics
* cyberpunk neon overload
* terminal rain
* fake CRT distortion everywhere
* cheesy “hacker” clichés
* oversaturated gradients
* gimmicky animations

The site should feel like a **piece of monitoring equipment**.

## Page structure

Single page with these sections in order:

1. Sticky top nav
2. Hero
3. How it works
4. Features
5. Algorithm / engineering note
6. Install / download
7. Footer

---

# 1. Sticky top nav

## Layout

Top sticky nav bar with subtle panel styling.

Left:

* wordmark: `shh.mom`

Right:

* nav links:

  * Features
  * Install
  * GitHub

Far top-right:

* a small pulsing red recording/status bead
* text label beside it: `LIVE` or `MONITOR`

This status bead should feel like an instrument indicator, not a decorative dot.

## Behavior

* nav remains sticky on scroll
* background becomes slightly more opaque on scroll
* red bead softly pulses continuously
* nav links smooth-scroll to sections

---

# 2. Hero

## Goal

Immediately communicate:

* what the tool does
* that it is real-time
* that it is precise
* that it is easy to install

## Layout

Two-column layout on desktop, stacked on mobile.

### Left column

* logo if available, otherwise clean text wordmark
* eyebrow label: something like `REAL-TIME LOUDNESS MONITOR`
* headline:

  * preferred: **A quiet little program that tells you when you’re being too loud.**
* supporting paragraph:

  * explain that it listens to your microphone, measures loudness, and says “SHH” when you cross your threshold
* CTA row:

  * primary: `Install`
  * secondary: `View on GitHub`
* small metadata row below:

  * `Built in Rust`
  * `macOS / Linux / Windows`
  * `Configurable threshold`

### Right column

A custom **instrument display panel** built in SVG.

The panel should look like a retro industrial monitor:

* rounded rectangular black display area
* subtle bezel / frame
* faint gridlines
* green waveform on left/middle
* horizontal red threshold line extending rightward
* red “recording” circle rendered as part of the display, not a physical object
* optional tiny corner labels / ticks / micro-markings
* no photorealistic screws unless very restrained

## Hero animation

The SVG display should animate subtly:

* waveform idles at low amplitude
* every few seconds it spikes upward
* threshold line remains fixed
* occasionally the waveform crosses or approaches the threshold
* when crossed:

  * threshold line brightens briefly
  * red recording circle glows slightly
  * tiny `SHH` indicator flashes inside the display
  * optional micro “alert” blip

Animation should be tasteful and restrained.

No large dramatic flashes.

---

# 3. How it works

## Goal

Explain the product in 3 clear stages.

## Layout

Three horizontally aligned modules on desktop, vertical stack on mobile.

Each module should look like a labeled instrument card.

### Step 1 — Listen

Text:

* `Reads your microphone input continuously.`

### Step 2 — Measure

Text:

* `Computes loudness from both sustained energy and peaks.`

### Step 3 — Warn

Text:

* `Plays “SHH” and can optionally trigger OS notifications.`

Each card should have:

* a small label in monospace or technical style
* subtle border
* compact icon or tiny display glyph
* consistent panel aesthetic

Possible labels:

* `INPUT`
* `ANALYSIS`
* `ALERT`

---

# 4. Features

## Goal

Show the product capabilities as concise, credible system modules.

## Layout

Grid of feature cards.

Desktop: 2 or 3 columns
Mobile: 1 column

Each card should feel like a small control module or subsystem.

## Feature cards

### Actually says “SHH”

Copy:

* `Not just a meter. When you cross the line, it tells you.`

### Optional OS alerts

Copy:

* `Can send system notifications too, in case your headphones are off or you miss the audio cue.`

### Cross-platform

Copy:

* `Runs on macOS, Linux, and Windows.`

### Configurable threshold

Copy:

* `Tune it to your voice, your room, your microphone, and the time of day.`

### Advanced loudness detection

Copy:

* `Uses a hybrid metric based on RMS and peak amplitude instead of a simplistic raw volume cutoff.`

### Built in Rust

Copy:

* `Fast, dependable, and small. Built like a real utility.`

## Styling

Each feature card should include:

* title
* 1–2 sentence body
* small top-left technical label, such as:

  * `AUDIO`
  * `ALERTS`
  * `PLATFORM`
  * `CONFIG`
  * `ENGINE`

Hover effect:

* slight border brightening
* slight panel lift or glow
* no dramatic transforms

---

# 5. Algorithm / engineering note

## Goal

Sell the product as thoughtful engineering, not just a gimmick.

This section should feel like a technical annotation panel.

## Copy direction

Headline:

* **Smarter than a raw volume cutoff**

Supporting copy:

* Explain that loudness is computed using both RMS and peak amplitude.
* A sensitivity value blends them into a hybrid metric.
* That hybrid value is converted to dB.
* This gives more useful and configurable detection than a naive threshold on sample amplitude.

Use this exact code as source inspiration:

```rust
pub fn compute_loudness(data_window: &[f32], sensitivity: f32) -> (f32, f32, f32, f32) {
    // Calculate RMS (Root Mean Square)
    let rms = (data_window.iter().map(|s| s * s).sum::<f32>() / data_window.len() as f32).sqrt();

    // Calculate Peak amplitude
    let peak = data_window.iter().cloned().fold(0.0_f32, f32::max);

    // Hybrid metric combining RMS and Peak
    let hybrid_metric = (1.0 - sensitivity) * rms + sensitivity * peak;

    // Convert hybrid metric to dB
    let db = 20.0 * hybrid_metric.max(1e-10).log10();

    (rms, peak, hybrid_metric, db)
}
```

## Visual presentation

Two-column layout:

Left:

* short prose explanation

Right:

* either:

  * a styled code block with the function, or
  * a simplified technical diagram showing:

    * RMS
    * Peak
    * Hybrid
    * dB

Best version:

* show a compact code block plus small annotation labels

The code block should not dominate the page.

It should reinforce the engineering aesthetic.

---

# 6. Install / download

## Goal

Make install obvious and frictionless.

## Layout

A dedicated section with strong CTA and platform-specific install options.

Headline:

* **Install**

Subhead:

* `Pick your platform and get running.`

## Platform selector

Use a segmented control or tabs for:

* macOS
* Linux
* Windows

Each tab reveals install instructions.

Use placeholders if exact commands are not yet known, but structure it cleanly so content is easy to replace.

### Example structure

#### macOS

* primary path
* example command block
* download link if relevant

#### Linux

* package or binary instructions
* example command block

#### Windows

* binary download or package manager path
* short instructions

## Buttons

At least:

* `Download`
* `View on GitHub`

Optionally:

* `Read docs`

## Small supporting line

Use something like:

* `Set your threshold. Start monitoring. Stop waking people up.`

---

# 7. Footer

Minimal, sparse, clean.

Include:

* `shh.mom`
* GitHub link
* license placeholder
* `Built in Rust`

Optional tiny status text:

* `monitor armed`

---

# Content tone

Tone should be:

* dry
* calm
* competent
* slightly witty
* understated

Do not sound like marketing SaaS copy.

Good:

* `For when you don’t realize you’re yelling.`
* `A small cross-platform utility for keeping it down.`
* `Measures your mic input and tells you when you cross the line.`

Avoid:

* hype language
* “next-generation”
* “revolutionary”
* “unlock your productivity”
* brand-strategy fluff

---

# Typography

Use a combination of:

* primary UI/headlines: clean industrial sans
* labels, small metadata, code, panel annotations: monospace

Suggested approach:

* one main sans
* one monospace

Typography should feel:

* technical
* legible
* disciplined
* not playful

---

# Color system

Use a restrained palette.

## Base

* background: near-black / graphite
* panels: dark charcoal
* borders: muted gray
* primary text: warm off-white
* secondary text: dim cool gray

## Accents

* red: threshold / live indicator / alerts
* green: waveform / signal / “monitoring active”
* optional amber: tiny secondary status marks only

The red and green must be muted enough to feel premium, not arcade-like.

---

# Motion spec

Animation should be minimal and meaningful.

## Required

* pulsing red status bead in nav
* subtle waveform animation in hero
* threshold glow / alert flash when crossed
* section reveal on scroll, very subtle
* hover states on cards and buttons

## Avoid

* glitch effects
* typing simulation
* scanline sweeps everywhere
* exaggerated spring motion
* parallax tricks

Motion should communicate:

* live monitoring
* system readiness
* instrument response

---

# Layout system

Use a consistent width and spacing scale.

## Suggested container behavior

* centered main container
* max width around 1100–1200px
* generous vertical spacing between sections
* compact spacing inside panels/cards

The page should feel like stacked equipment modules with breathing room.

---

# Responsive behavior

## Mobile

* hero stacks vertically
* SVG instrument remains prominent
* nav simplifies cleanly
* feature cards become single column
* install section tabs remain usable
* no tiny unreadable labels

## Desktop

* strong two-column hero
* multi-column features
* algorithm section side-by-side

---

# Accessibility

Must include:

* semantic headings
* keyboard-accessible nav and buttons
* sufficient contrast
* reduced-motion support:

  * pulse animation reduced
  * waveform motion reduced or disabled
* proper focus states
* SVG marked up accessibly or hidden from screen readers if decorative

---

# Implementation requirements

## Project structure

Use a simple component structure, for example:

* `App`
* `components/Nav`
* `components/Hero`
* `components/InstrumentDisplay`
* `components/HowItWorks`
* `components/Features`
* `components/AlgorithmSection`
* `components/InstallSection`
* `components/Footer`
* `styles/tokens`
* `styles/globalTokens`

Use StyleX for all layout and styling.

## Styling approach

Use:

* shared design tokens
* reusable panel primitives
* reusable label styles
* reusable button styles
* consistent border, radius, and spacing rules

Do not create a mess of one-off styles for each section.

The implementation should feel systematic.

## SVG hero display

Build the hero display as SVG.

It should include:

* background display shape
* inner frame
* grid lines
* waveform path
* threshold line
* rendered red recording circle
* tiny optional labels / tick marks
* optional flash text `SHH`

Waveform animation can be done with:

* a few precomputed waveform states and timed transitions
* or a lightweight procedural animation

Do not overengineer this.

The site should load fast and remain static.

---

# Copy to use

Use this copy unless better micro-adjustments are needed for layout:

## Hero eyebrow

`REAL-TIME LOUDNESS MONITOR`

## Hero headline

`A quiet little program that tells you when you’re being too loud.`

## Hero body

`shh.mom listens to your microphone, measures loudness in real time, and says “SHH” when you cross a threshold you control.`

## Hero metadata

* `Built in Rust`
* `macOS / Linux / Windows`
* `Configurable threshold`

## How it works

### Listen

`Reads your microphone input continuously.`

### Measure

`Computes loudness from both sustained energy and peaks.`

### Warn

`Plays “SHH” and can optionally trigger OS notifications.`

## Features

### Actually says “SHH”

`Not just a meter. When you cross the line, it tells you.`

### Optional OS alerts

`Can send system notifications too, in case your headphones are off or you miss the audio cue.`

### Cross-platform

`Runs on macOS, Linux, and Windows.`

### Configurable threshold

`Tune it to your voice, your room, your microphone, and the time of day.`

### Advanced loudness detection

`Uses a hybrid metric based on RMS and peak amplitude instead of a simplistic raw volume cutoff.`

### Built in Rust

`Fast, dependable, and small. Built like a real utility.`

## Algorithm section

### Headline

`Smarter than a raw volume cutoff`

### Body

`shh.mom doesn’t rely on a naive volume spike. It measures sustained energy, tracks peaks, blends them with a sensitivity control, and converts the result into dB so alerting feels smarter and more configurable.`

## Install section

### Headline

`Install`

### Subhead

`Pick your platform and get running.`

### Footer line

`Set your threshold. Start monitoring. Stop waking people up.`

---

# Placeholder content rules

If exact install commands, GitHub URL, binary names, or docs links are not known:

* leave obvious placeholders
* make them easy to replace
* do not invent fake package names unless clearly marked placeholder

Examples:

* `brew install <placeholder>`
* `curl -LO <release-url>`
* `https://github.com/<owner>/<repo>`

---

# Deliverable requirements

Claude Code should produce:

1. A complete Vite + Preact + TypeScript + StyleX project
2. A polished single-page landing page implementing this spec
3. Fully static output via normal Vite build
4. Clean component decomposition
5. Clean design token system
6. Hero SVG instrument with restrained animation
7. Responsive layout
8. Accessible interactions
9. Easy-to-edit placeholders for install commands and links

## Quality bar

The result should feel:

* custom
* premium
* lean
* engineered
* not template-driven

It should look like the website for a small, beloved utility made by someone who cares about tools.

---

If you want, I can also turn this into a **Claude Code prompt with explicit file-by-file instructions**, which may work even better.

