import type { TemplateId, ThemeId } from "./schema";

export type ThemeTokens = {
  id: ThemeId;
  label: string;
  background: string;
  ink: string;
  muted: string;
  accent: string;
  card: string;
  line: string;
  subtitle: string;
  subtitleInk: string;
};

export const themes: Record<ThemeId, ThemeTokens> = {
  "minimal-professional": {
    id: "minimal-professional",
    label: "Minimal professionnel",
    background: "#f4f1ea",
    ink: "#1c2430",
    muted: "#5c6b7a",
    accent: "#0f6e6b",
    card: "#fffdf8",
    line: "#d9d3c7",
    subtitle: "#1c2430",
    subtitleInk: "#f7f4ee",
  },
  "technical-blueprint": {
    id: "technical-blueprint",
    label: "Plan technique",
    background: "#0e1c2f",
    ink: "#e7f0ff",
    muted: "#93a4bf",
    accent: "#7eb6ff",
    card: "#16324e",
    line: "#2c5278",
    subtitle: "#07111d",
    subtitleInk: "#e7f0ff",
  },
  "educational-whiteboard": {
    id: "educational-whiteboard",
    label: "Tableau pédagogique",
    background: "#f7f4ea",
    ink: "#243022",
    muted: "#5d6b58",
    accent: "#2f6fed",
    card: "#fffef8",
    line: "#d5d0c4",
    subtitle: "#243022",
    subtitleInk: "#fffef8",
  },
  "corporate-motion": {
    id: "corporate-motion",
    label: "Motion corporate",
    background: "#101722",
    ink: "#f5f7fb",
    muted: "#a8b3c7",
    accent: "#e8a317",
    card: "#1b2838",
    line: "#31445c",
    subtitle: "#0b1018",
    subtitleInk: "#f5f7fb",
  },
  "modern-infographic": {
    id: "modern-infographic",
    label: "Infographie moderne",
    background: "#fbf7f2",
    ink: "#241c18",
    muted: "#6d645e",
    accent: "#e85d4c",
    card: "#ffffff",
    line: "#eadfd4",
    subtitle: "#241c18",
    subtitleInk: "#fffaf6",
  },
};

export const templateLabels: Record<TemplateId, string> = {
  "title-introduction": "Introduction",
  "concept-explanation": "Concept",
  "process-flow": "Flux",
  comparison: "Comparaison",
  timeline: "Chronologie",
  "hierarchy-diagram": "Hiérarchie",
  "animated-chart": "Graphique",
  "cause-effect": "Cause et effet",
  "key-takeaway": "À retenir",
  conclusion: "Conclusion",
};
