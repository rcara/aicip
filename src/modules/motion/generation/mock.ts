import type { TemplateId } from "@/modules/motion/schema";

import { parseModelDocument, type ModelDocument, type ModelTemplateProps } from "./document";

const FRENCH =
  /\b(le|la|les|des|une|un|est|dans|pour|avec|que|qui|sur|par|au|aux|du|en|et|ou|cette|ce|ces|d'un|d'une|explique|expliquer)\b/gi;
const ENGLISH = /\b(the|and|of|to|for|with|from|this|that|explain|how|what|when|where|into|about)\b/gi;

export function clip(value: string, max: number): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  if (max < 2) return trimmed.slice(0, max);
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export function detectLanguage(topic: string, sourceText: string, requested?: "fr" | "en"): "fr" | "en" {
  if (requested === "fr" || requested === "en") return requested;
  const blob = `${topic}\n${sourceText}`;
  const french = blob.match(FRENCH)?.length ?? 0;
  const english = blob.match(ENGLISH)?.length ?? 0;
  if (french > english) return "fr";
  if (english > french) return "en";
  return /[àâçéèêëîïôùûüœ]/i.test(blob) ? "fr" : "en";
}

export function chooseTemplates(topic: string, sourceText: string): TemplateId[] {
  const blob = `${topic}\n${sourceText}`.toLowerCase();
  const middle: TemplateId[] = [];
  if (/versus|\bvs\b|comparer|compare|différence|difference/.test(blob)) middle.push("comparison");
  if (/cause|effet|effect|because|parce que/.test(blob)) middle.push("cause-effect");
  if (/\d+\s*%|pourcent|percent|graphique|chart/.test(blob)) middle.push("animated-chart");
  if (/hiérarch|hierarch|escalad|escalat|organigram/.test(blob)) middle.push("hierarchy-diagram");
  if (/chronolog|timeline|d'abord|ensuite|afterwards/.test(blob)) middle.push("timeline");
  if (/étapes|etapes|process|workflow|incident/.test(blob)) middle.push("process-flow");
  if (middle.length === 0) middle.push("concept-explanation");
  const room = 5;
  return ["title-introduction", ...middle.slice(0, room), "key-takeaway", "conclusion"];
}

type Copy = {
  audience: string;
  objective: (topic: string) => string;
  kicker: string;
  lede: (topic: string) => string;
  conceptTitle: string;
  concept: string;
  points: string[];
  processTitle: string;
  steps: string[];
  comparisonTitle: string;
  leftTitle: string;
  rightTitle: string;
  leftPoints: string[];
  rightPoints: string[];
  timelineTitle: string;
  events: Array<{ label: string; detail: string }>;
  hierarchyTitle: string;
  root: string;
  children: string[];
  chartTitle: string;
  unit: string;
  bars: Array<{ label: string; value: number }>;
  causeTitle: string;
  cause: string;
  effect: string;
  link: string;
  takeawayTitle: string;
  takeaway: string;
  takeawayPoints: string[];
  conclusionTitle: string;
  summary: string;
  conclusionSteps: string[];
  narration: (title: string, topic: string, excerpt: string) => string;
};

const copy: Record<"fr" | "en", Copy> = {
  fr: {
    audience: "Public non spécialiste",
    objective: (topic) => `Expliquer « ${topic} » avec un plan court et des scènes du catalogue.`,
    kicker: "Explication",
    lede: (topic) => `Ce qui devient clair quand on suit ${topic}.`,
    conceptTitle: "Idée principale",
    concept: "Essentiel",
    points: ["Un fait observable", "Un exemple concret", "Une limite à connaître"],
    processTitle: "Étapes",
    steps: ["Nommer", "Qualifier", "Agir", "Vérifier"],
    comparisonTitle: "Deux cas",
    leftTitle: "Premier cas",
    rightTitle: "Second cas",
    leftPoints: ["Un critère net"],
    rightPoints: ["Un autre critère"],
    timelineTitle: "Ordre",
    events: [
      { label: "Début", detail: "On pose le sujet" },
      { label: "Suite", detail: "On avance" },
      { label: "Fin", detail: "On vérifie" },
    ],
    hierarchyTitle: "Niveaux",
    root: "Origine",
    children: ["Premier niveau", "Second niveau"],
    chartTitle: "Repères",
    unit: "repères",
    bars: [
      { label: "Faible", value: 2 },
      { label: "Moyen", value: 5 },
      { label: "Élevé", value: 8 },
    ],
    causeTitle: "Cause et effet",
    cause: "Cause",
    effect: "Effet",
    link: "entraîne",
    takeawayTitle: "À retenir",
    takeaway: "Une idée, puis une action.",
    takeawayPoints: ["Nommer le sujet", "Suivre l'ordre", "Vérifier le résultat"],
    conclusionTitle: "Conclusion",
    summary: "Le sujet tient en quelques étapes.",
    conclusionSteps: ["Voir", "Nommer", "Agir"],
    narration: (title, topic, excerpt) =>
      excerpt ? `${title}. Il s'agit de ${topic}. ${excerpt}` : `${title}. Il s'agit de ${topic}.`,
  },
  en: {
    audience: "Non-specialist audience",
    objective: (topic) => `Explain “${topic}” with a short plan and catalogue scenes.`,
    kicker: "Explanation",
    lede: (topic) => `What becomes clear when you follow ${topic}.`,
    conceptTitle: "Main idea",
    concept: "Core",
    points: ["One observable fact", "One concrete example", "One limit to know"],
    processTitle: "Steps",
    steps: ["Name", "Qualify", "Act", "Check"],
    comparisonTitle: "Two cases",
    leftTitle: "First case",
    rightTitle: "Second case",
    leftPoints: ["One clear criterion"],
    rightPoints: ["Another criterion"],
    timelineTitle: "Order",
    events: [
      { label: "Start", detail: "State the subject" },
      { label: "Middle", detail: "Move forward" },
      { label: "End", detail: "Check the result" },
    ],
    hierarchyTitle: "Levels",
    root: "Origin",
    children: ["First level", "Second level"],
    chartTitle: "Markers",
    unit: "markers",
    bars: [
      { label: "Low", value: 2 },
      { label: "Middle", value: 5 },
      { label: "High", value: 8 },
    ],
    causeTitle: "Cause and effect",
    cause: "Cause",
    effect: "Effect",
    link: "leads to",
    takeawayTitle: "Takeaway",
    takeaway: "One idea, then one action.",
    takeawayPoints: ["Name the subject", "Follow the order", "Check the result"],
    conclusionTitle: "Conclusion",
    summary: "The subject fits in a few steps.",
    conclusionSteps: ["See", "Name", "Act"],
    narration: (title, topic, excerpt) =>
      excerpt ? `${title}. This scene covers ${topic}. ${excerpt}` : `${title}. This scene covers ${topic}.`,
  },
};

function sentences(value: string): string[] {
  return value
    .split(/[\n.!?]+/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => part.length > 1);
}

function propsFor(template: TemplateId, topic: string, sourceText: string, language: "fr" | "en"): ModelTemplateProps {
  const text = copy[language];
  const subject = clip(topic, 120);
  const excerpt = clip(sentences(sourceText)[0] ?? "", 160);
  const sourcedPoints = sentences(sourceText)
    .slice(0, 3)
    .map((sentence) => clip(sentence, 80))
    .filter((sentence) => sentence.length > 0);
  switch (template) {
    case "title-introduction":
      return {
        template,
        kicker: text.kicker,
        title: subject,
        lede: excerpt ? clip(excerpt, 180) : clip(text.lede(subject), 180),
      };
    case "concept-explanation":
      return {
        template,
        title: text.conceptTitle,
        concept: text.concept,
        points: sourcedPoints.length > 0 ? sourcedPoints : text.points,
      };
    case "process-flow":
      return {
        template,
        title: text.processTitle,
        emphasis: 0,
        steps: text.steps.map((label) => ({ label })),
      };
    case "comparison":
      return {
        template,
        title: text.comparisonTitle,
        left: { title: text.leftTitle, points: text.leftPoints },
        right: { title: text.rightTitle, points: text.rightPoints },
      };
    case "timeline":
      return { template, title: text.timelineTitle, events: text.events };
    case "hierarchy-diagram":
      return { template, title: text.hierarchyTitle, root: text.root, children: text.children };
    case "animated-chart":
      return { template, title: text.chartTitle, unit: text.unit, bars: text.bars };
    case "cause-effect":
      return {
        template,
        title: text.causeTitle,
        link: { cause: text.cause, effect: text.effect, link: text.link },
      };
    case "key-takeaway":
      return {
        template,
        title: text.takeawayTitle,
        takeaway: text.takeaway,
        points: text.takeawayPoints,
      };
    case "conclusion":
      return {
        template,
        title: text.conclusionTitle,
        summary: text.summary,
        steps: text.conclusionSteps,
      };
    default: {
      const never: never = template;
      return never;
    }
  }
}

export function mockDocument(input: { topic: string; sourceText: string; language: "fr" | "en" }): ModelDocument {
  const language = input.language;
  const text = copy[language];
  const topic = clip(input.topic, 160);
  const excerpt = clip(sentences(input.sourceText)[0] ?? "", 160);
  const scenes = chooseTemplates(input.topic, input.sourceText).map((template) => {
    const props = propsFor(template, topic, input.sourceText, language);
    return {
      narration: clip(text.narration(props.title, clip(topic, 120), excerpt), 280),
      props,
    };
  });
  return parseModelDocument({
    language,
    title: topic,
    objective: clip(text.objective(clip(topic, 120)), 400),
    audience: text.audience,
    plan: scenes.map((scene) => ({ heading: scene.props.title })),
    scenes,
  });
}
