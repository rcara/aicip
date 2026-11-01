import { cuesForNarration, type TimedWord } from "./cues";
import {
  FRAME_WIDTH,
  HOLD_MS,
  SAFE_X,
  framesFromMs,
  type ExplainerScene,
  type TemplateId,
  type ThemeId,
  type VideoProject,
  type VisualObject,
} from "./schema";

export type Step = { label: string; detail?: string };
export type Side = { title: string; points: string[] };
export type BarPoint = { label: string; value: number };
export type CauseLink = { cause: string; effect: string; link: string };

export type TemplateProps =
  | { template: "title-introduction"; kicker: string; title: string; lede: string }
  | { template: "concept-explanation"; title: string; concept: string; points: string[] }
  | { template: "process-flow"; title: string; steps: Step[]; emphasis: number }
  | { template: "comparison"; title: string; left: Side; right: Side }
  | { template: "timeline"; title: string; events: Step[] }
  | { template: "hierarchy-diagram"; title: string; root: string; children: string[] }
  | { template: "animated-chart"; title: string; unit: string; bars: BarPoint[] }
  | { template: "cause-effect"; title: string; link: CauseLink }
  | { template: "key-takeaway"; title: string; takeaway: string; points: string[] }
  | { template: "conclusion"; title: string; summary: string; steps: string[] };

export type AuthoredScene = {
  id: string;
  title: string;
  narration: string;
  audioSrc: string;
  voice: string;
  audioDurationMs: number;
  words: TimedWord[];
  props: TemplateProps;
};

export type ProjectDraft = {
  id: string;
  version: number;
  title: string;
  language: "fr" | "en";
  theme: ThemeId;
  scenes: AuthoredScene[];
};

type ObjectInput = {
  id: string;
  type: VisualObject["type"];
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  fontSize?: number;
  appearAtMs?: number;
  animation?: VisualObject["animation"];
  tone?: VisualObject["tone"];
  emphasis?: boolean;
};

function object(input: ObjectInput): VisualObject {
  return {
    id: input.id,
    type: input.type,
    x: input.x,
    y: input.y,
    width: input.width,
    height: input.height,
    ...(input.text ? { text: input.text } : {}),
    fontSize: input.fontSize ?? (input.type === "text" ? 28 : 22),
    appearAtMs: input.appearAtMs ?? 0,
    animation: input.animation ?? "fade-up",
    tone: input.tone ?? "ink",
    emphasis: input.emphasis ?? false,
  };
}

function titleObject(text: string): VisualObject {
  return object({
    id: "title",
    type: "text",
    x: SAFE_X,
    y: 48,
    width: 1040,
    height: 56,
    text,
    fontSize: 36,
    appearAtMs: 0,
    animation: "fade-up",
    tone: "ink",
  });
}

function layoutTitle(props: Extract<TemplateProps, { template: "title-introduction" }>): VisualObject[] {
  return [
    object({
      id: "accent-bar",
      type: "bar",
      x: SAFE_X,
      y: 210,
      width: 96,
      height: 8,
      appearAtMs: 0,
      animation: "draw",
      tone: "accent",
    }),
    object({
      id: "kicker",
      type: "text",
      x: SAFE_X,
      y: 232,
      width: 1000,
      height: 40,
      text: props.kicker,
      fontSize: 22,
      appearAtMs: 80,
      tone: "accent",
    }),
    object({
      id: "headline",
      type: "text",
      x: SAFE_X,
      y: 284,
      width: 1080,
      height: 140,
      text: props.title,
      fontSize: 64,
      appearAtMs: 200,
    }),
    object({
      id: "lede",
      type: "text",
      x: SAFE_X,
      y: 450,
      width: 980,
      height: 110,
      text: props.lede,
      fontSize: 28,
      appearAtMs: 520,
      tone: "muted",
    }),
  ];
}

function layoutConcept(props: Extract<TemplateProps, { template: "concept-explanation" }>): VisualObject[] {
  const objects = [
    titleObject(props.title),
    object({
      id: "concept",
      type: "panel",
      x: SAFE_X,
      y: 140,
      width: 420,
      height: 420,
      text: props.concept,
      fontSize: 40,
      appearAtMs: 120,
      animation: "highlight",
      tone: "accent",
      emphasis: true,
    }),
  ];
  props.points.slice(0, 3).forEach((point, index) => {
    objects.push(
      object({
        id: `point-${index + 1}`,
        type: "node",
        x: 540,
        y: 150 + index * 140,
        width: 676,
        height: 116,
        text: point,
        fontSize: 26,
        appearAtMs: 280 + index * 180,
        tone: "card",
      }),
    );
  });
  return objects;
}

function layoutProcess(props: Extract<TemplateProps, { template: "process-flow" }>): VisualObject[] {
  const steps = props.steps.slice(0, 6);
  const count = steps.length;
  const gap = 18;
  const arrowWidth = 26;
  const usable = FRAME_WIDTH - SAFE_X * 2;
  const nodeWidth = Math.floor((usable - (count - 1) * (gap + arrowWidth)) / count);
  const objects = [titleObject(props.title)];
  steps.forEach((step, index) => {
    const x = SAFE_X + index * (nodeWidth + gap + arrowWidth);
    const emphasized = index === props.emphasis;
    objects.push(
      object({
        id: `step-${index + 1}`,
        type: "node",
        x,
        y: 250,
        width: nodeWidth,
        height: 180,
        text: step.label,
        fontSize: 22,
        appearAtMs: 160 + index * 140,
        animation: "fade-up",
        tone: emphasized ? "accent" : "card",
        emphasis: emphasized,
      }),
    );
    if (index < count - 1) {
      objects.push(
        object({
          id: `arrow-${index + 1}`,
          type: "arrow",
          x: x + nodeWidth + 6,
          y: 332,
          width: arrowWidth + gap - 12,
          height: 8,
          appearAtMs: 280 + index * 140,
          animation: "draw",
          tone: "accent",
        }),
      );
    }
  });
  return objects;
}

function layoutComparison(props: Extract<TemplateProps, { template: "comparison" }>): VisualObject[] {
  const objects = [titleObject(props.title)];
  const sides = [
    { id: "left", x: SAFE_X, side: props.left },
    { id: "right", x: 676, side: props.right },
  ] as const;
  sides.forEach((entry, sideIndex) => {
    objects.push(
      object({
        id: `${entry.id}-panel`,
        type: "panel",
        x: entry.x,
        y: 150,
        width: 540,
        height: 430,
        appearAtMs: 120 + sideIndex * 160,
        animation: "highlight",
        tone: "card",
        emphasis: sideIndex === 0,
      }),
    );
    objects.push(
      object({
        id: `${entry.id}-title`,
        type: "text",
        x: entry.x + 28,
        y: 176,
        width: 484,
        height: 56,
        text: entry.side.title,
        fontSize: 32,
        appearAtMs: 200 + sideIndex * 160,
        tone: sideIndex === 0 ? "accent" : "ink",
      }),
    );
    entry.side.points.slice(0, 3).forEach((point, index) => {
      objects.push(
        object({
          id: `${entry.id}-point-${index + 1}`,
          type: "text",
          x: entry.x + 28,
          y: 260 + index * 90,
          width: 484,
          height: 72,
          text: point,
          fontSize: 24,
          appearAtMs: 320 + sideIndex * 160 + index * 120,
          tone: "ink",
        }),
      );
    });
  });
  return objects;
}

function layoutTimeline(props: Extract<TemplateProps, { template: "timeline" }>): VisualObject[] {
  const events = props.events.slice(0, 4);
  const objects = [
    titleObject(props.title),
    object({
      id: "spine",
      type: "bar",
      x: 108,
      y: 150,
      width: 6,
      height: 420,
      appearAtMs: 80,
      animation: "grow",
      tone: "accent",
    }),
  ];
  events.forEach((event, index) => {
    const y = 150 + index * 110;
    objects.push(
      object({
        id: `marker-${index + 1}`,
        type: "badge",
        x: 92,
        y: y + 28,
        width: 38,
        height: 38,
        text: String(index + 1),
        fontSize: 18,
        appearAtMs: 180 + index * 160,
        tone: "accent",
        emphasis: true,
      }),
    );
    objects.push(
      object({
        id: `event-${index + 1}`,
        type: "node",
        x: 168,
        y,
        width: 980,
        height: 92,
        text: event.detail ? `${event.label} — ${event.detail}` : event.label,
        fontSize: 26,
        appearAtMs: 220 + index * 160,
        tone: "card",
      }),
    );
  });
  return objects;
}

function layoutHierarchy(props: Extract<TemplateProps, { template: "hierarchy-diagram" }>): VisualObject[] {
  const children = props.children.slice(0, 4);
  const objects = [
    titleObject(props.title),
    object({
      id: "root",
      type: "node",
      x: 430,
      y: 140,
      width: 420,
      height: 96,
      text: props.root,
      fontSize: 28,
      appearAtMs: 120,
      tone: "accent",
      emphasis: true,
    }),
  ];
  const width = 250;
  const gap = 24;
  const total = children.length * width + (children.length - 1) * gap;
  const start = Math.round((FRAME_WIDTH - total) / 2);
  children.forEach((child, index) => {
    const x = start + index * (width + gap);
    objects.push(
      object({
        id: `link-${index + 1}`,
        type: "arrow",
        x: x + width / 2 - 4,
        y: 248,
        width: 8,
        height: 36,
        appearAtMs: 240 + index * 80,
        animation: "draw",
        tone: "accent",
      }),
    );
    objects.push(
      object({
        id: `child-${index + 1}`,
        type: "node",
        x,
        y: 300,
        width,
        height: 180,
        text: child,
        fontSize: 24,
        appearAtMs: 320 + index * 120,
        tone: "card",
      }),
    );
  });
  return objects;
}

function layoutChart(props: Extract<TemplateProps, { template: "animated-chart" }>): VisualObject[] {
  const bars = props.bars.slice(0, 5);
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  const slot = Math.floor(1100 / bars.length);
  const barWidth = Math.min(120, slot - 36);
  const objects = [
    titleObject(props.title),
    object({
      id: "unit",
      type: "text",
      x: SAFE_X,
      y: 112,
      width: 400,
      height: 32,
      text: props.unit,
      fontSize: 18,
      appearAtMs: 80,
      tone: "muted",
    }),
  ];
  bars.forEach((bar, index) => {
    const height = Math.max(36, Math.round((bar.value / max) * 280));
    const x = 120 + index * slot;
    const y = 470 - height;
    objects.push(
      object({
        id: `bar-${index + 1}`,
        type: "bar",
        x,
        y,
        width: barWidth,
        height,
        appearAtMs: 180 + index * 140,
        animation: "grow",
        tone: index === bars.length - 1 ? "accent" : "card",
        emphasis: index === bars.length - 1,
      }),
    );
    objects.push(
      object({
        id: `bar-label-${index + 1}`,
        type: "text",
        x: x - 10,
        y: 486,
        width: barWidth + 48,
        height: 72,
        text: bar.label,
        fontSize: 18,
        appearAtMs: 240 + index * 140,
        tone: "ink",
      }),
    );
  });
  return objects;
}

function layoutCause(props: Extract<TemplateProps, { template: "cause-effect" }>): VisualObject[] {
  return [
    titleObject(props.title),
    object({
      id: "cause",
      type: "node",
      x: SAFE_X,
      y: 240,
      width: 360,
      height: 180,
      text: props.link.cause,
      fontSize: 28,
      appearAtMs: 120,
      tone: "card",
    }),
    object({
      id: "cause-arrow",
      type: "arrow",
      x: 450,
      y: 322,
      width: 70,
      height: 8,
      appearAtMs: 300,
      animation: "draw",
      tone: "accent",
    }),
    object({
      id: "link",
      type: "badge",
      x: 540,
      y: 250,
      width: 200,
      height: 150,
      text: props.link.link,
      fontSize: 22,
      appearAtMs: 420,
      tone: "accent",
      emphasis: true,
    }),
    object({
      id: "effect-arrow",
      type: "arrow",
      x: 760,
      y: 322,
      width: 70,
      height: 8,
      appearAtMs: 560,
      animation: "draw",
      tone: "accent",
    }),
    object({
      id: "effect",
      type: "node",
      x: 856,
      y: 240,
      width: 360,
      height: 180,
      text: props.link.effect,
      fontSize: 28,
      appearAtMs: 680,
      animation: "highlight",
      tone: "card",
      emphasis: true,
    }),
  ];
}

function layoutTakeaway(props: Extract<TemplateProps, { template: "key-takeaway" }>): VisualObject[] {
  const objects = [
    titleObject(props.title),
    object({
      id: "takeaway",
      type: "panel",
      x: SAFE_X,
      y: 140,
      width: 1152,
      height: 160,
      text: props.takeaway,
      fontSize: 32,
      appearAtMs: 120,
      animation: "highlight",
      tone: "accent",
      emphasis: true,
    }),
  ];
  props.points.slice(0, 3).forEach((point, index) => {
    objects.push(
      object({
        id: `check-${index + 1}`,
        type: "node",
        x: SAFE_X + index * 390,
        y: 340,
        width: 366,
        height: 200,
        text: point,
        fontSize: 26,
        appearAtMs: 300 + index * 160,
        tone: "card",
      }),
    );
  });
  return objects;
}

function layoutConclusion(props: Extract<TemplateProps, { template: "conclusion" }>): VisualObject[] {
  const objects = [
    titleObject(props.title),
    object({
      id: "summary",
      type: "text",
      x: SAFE_X,
      y: 130,
      width: 1100,
      height: 100,
      text: props.summary,
      fontSize: 28,
      appearAtMs: 120,
      tone: "muted",
    }),
  ];
  props.steps.slice(0, 6).forEach((step, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    objects.push(
      object({
        id: `step-${index + 1}`,
        type: "badge",
        x: SAFE_X + column * 390,
        y: 270 + row * 140,
        width: 360,
        height: 112,
        text: `${index + 1}. ${step}`,
        fontSize: 26,
        appearAtMs: 240 + index * 120,
        tone: index === props.steps.length - 1 ? "accent" : "card",
        emphasis: index === props.steps.length - 1,
      }),
    );
  });
  return objects;
}

export function layoutTemplate(props: TemplateProps): VisualObject[] {
  switch (props.template) {
    case "title-introduction":
      return layoutTitle(props);
    case "concept-explanation":
      return layoutConcept(props);
    case "process-flow":
      return layoutProcess(props);
    case "comparison":
      return layoutComparison(props);
    case "timeline":
      return layoutTimeline(props);
    case "hierarchy-diagram":
      return layoutHierarchy(props);
    case "animated-chart":
      return layoutChart(props);
    case "cause-effect":
      return layoutCause(props);
    case "key-takeaway":
      return layoutTakeaway(props);
    case "conclusion":
      return layoutConclusion(props);
    default: {
      const never: never = props;
      return never;
    }
  }
}

export function compileScene(scene: AuthoredScene): ExplainerScene {
  const objects = layoutTemplate(scene.props);
  const lastAppear = objects.reduce((max, item) => Math.max(max, item.appearAtMs), 0);
  const durationMs = Math.max(scene.audioDurationMs + HOLD_MS, lastAppear + 700);
  return {
    id: scene.id,
    template: scene.props.template,
    title: scene.title,
    narration: {
      text: scene.narration,
      audioSrc: scene.audioSrc,
      durationMs: scene.audioDurationMs,
      voice: scene.voice,
    },
    durationMs,
    durationInFrames: framesFromMs(durationMs),
    transition: { type: "fade", durationMs: 240 },
    objects,
    subtitles: cuesForNarration(scene.id, scene.narration, scene.audioDurationMs, scene.words),
  };
}

export function compileProject(draft: ProjectDraft): VideoProject {
  return {
    id: draft.id,
    version: draft.version,
    schemaVersion: 1,
    title: draft.title,
    language: draft.language,
    aspectRatio: "16:9",
    theme: draft.theme,
    fps: 30,
    width: 1280,
    height: 720,
    scenes: draft.scenes.map(compileScene),
  };
}

export function sampleProps(template: TemplateId): TemplateProps {
  switch (template) {
    case "title-introduction":
      return { template, kicker: "Sujet", title: "Une idée claire", lede: "Une seule promesse, dite simplement." };
    case "concept-explanation":
      return { template, title: "Concept", concept: "Idée", points: ["Un fait", "Un exemple", "Une limite"] };
    case "process-flow":
      return {
        template,
        title: "Flux",
        emphasis: 0,
        steps: [{ label: "Un" }, { label: "Deux" }, { label: "Trois" }],
      };
    case "comparison":
      return {
        template,
        title: "Comparer",
        left: { title: "A", points: ["Fait A"] },
        right: { title: "B", points: ["Fait B"] },
      };
    case "timeline":
      return { template, title: "Temps", events: [{ label: "Début", detail: "On part" }, { label: "Fin", detail: "On vérifie" }] };
    case "hierarchy-diagram":
      return { template, title: "Niveaux", root: "Source", children: ["Un", "Deux"] };
    case "animated-chart":
      return { template, title: "Mesure", unit: "unités", bars: [{ label: "Petit", value: 1 }, { label: "Grand", value: 3 }] };
    case "cause-effect":
      return { template, title: "Lien", link: { cause: "Cause", effect: "Effet", link: "donc" } };
    case "key-takeaway":
      return { template, title: "Retenir", takeaway: "Une phrase suffit.", points: ["A", "B", "C"] };
    case "conclusion":
      return { template, title: "Fin", summary: "Le chemin tient en peu d'étapes.", steps: ["Voir", "Nommer", "Agir"] };
    default: {
      const never: never = template;
      return never;
    }
  }
}

export function sampleScene(template: TemplateId, audioDurationMs = 4000): AuthoredScene {
  const props = sampleProps(template);
  return {
    id: `sample-${template}`,
    title: props.template === "title-introduction" ? props.title : "title" in props ? props.title : template,
    narration: "Phrase de narration utilisée pour l'essai.",
    audioSrc: `motion/samples/${template}.mp3`,
    voice: "fixture",
    audioDurationMs,
    words: [],
    props,
  };
}
