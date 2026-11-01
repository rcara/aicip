import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import type { ExplainerScene, VisualObject } from "../modules/motion/schema";
import { themes, type ThemeTokens } from "../modules/motion/themes";

function appear(frame: number, fps: number, atMs: number): number {
  const start = (atMs / 1000) * fps;
  const end = start + 0.45 * fps;
  return interpolate(frame, [start, Math.max(end, start + 1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function toneFill(theme: ThemeTokens, object: VisualObject): string {
  if (object.tone === "accent") return theme.accent;
  if (object.tone === "muted") return theme.muted;
  if (object.tone === "card") return theme.card;
  return theme.ink;
}

function toneInk(theme: ThemeTokens, object: VisualObject): string {
  if (object.tone === "accent") return theme.background;
  if (object.tone === "muted") return theme.muted;
  return theme.ink;
}

function Graphic({ object, theme, fontFamily }: { object: VisualObject; theme: ThemeTokens; fontFamily: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = appear(frame, fps, object.appearAtMs);
  const fill = toneFill(theme, object);
  const ink = toneInk(theme, object);
  const lift = object.animation === "fade-up" ? (1 - progress) * 18 : 0;
  const opacity = object.animation === "grow" || object.animation === "draw" ? 1 : progress;
  const vertical = object.height > object.width * 1.4;

  return (
    <g opacity={opacity} transform={`translate(0 ${lift})`}>
      {object.type === "arrow" ? (
        <Arrow object={object} progress={progress} color={fill} vertical={vertical} />
      ) : null}
      {object.type === "bar" ? (
        <rect
          x={object.x}
          y={object.y + object.height * (1 - progress)}
          width={object.width}
          height={Math.max(object.height * progress, 0.5)}
          rx={4}
          fill={fill}
        />
      ) : null}
      {object.type === "panel" || object.type === "node" || object.type === "badge" ? (
        <rect
          x={object.x}
          y={object.y}
          width={object.width}
          height={object.height}
          rx={object.type === "badge" ? 18 : 22}
          fill={fill}
          stroke={object.emphasis ? theme.accent : theme.line}
          strokeWidth={object.emphasis ? 3 : 1.5}
        />
      ) : null}
      {object.text ? (
        <foreignObject x={object.x} y={object.y} width={object.width} height={object.height}>
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: object.type === "text" ? "flex-start" : "center",
              textAlign: object.type === "text" ? "left" : "center",
              color: object.type === "text" ? fill : ink,
              fontFamily,
              fontSize: object.fontSize,
              fontWeight: object.emphasis || object.type === "badge" ? 650 : 500,
              lineHeight: 1.2,
              padding: object.type === "text" ? 0 : 12,
              boxSizing: "border-box",
            }}
          >
            {object.text}
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
}

function Arrow({
  object,
  progress,
  color,
  vertical,
}: {
  object: VisualObject;
  progress: number;
  color: string;
  vertical: boolean;
}) {
  if (vertical) {
    const length = object.height * progress;
    return (
      <line
        x1={object.x + object.width / 2}
        y1={object.y}
        x2={object.x + object.width / 2}
        y2={object.y + length}
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
      />
    );
  }
  const length = object.width * progress;
  const y = object.y + object.height / 2;
  return (
    <g>
      <line
        x1={object.x}
        y1={y}
        x2={object.x + length}
        y2={y}
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
      />
      {progress > 0.85 ? (
        <polygon
          points={`${object.x + object.width},${y} ${object.x + object.width - 10},${y - 6} ${object.x + object.width - 10},${y + 6}`}
          fill={color}
        />
      ) : null}
    </g>
  );
}

export function SceneFrame({
  scene,
  themeId,
  fontFamily,
}: {
  scene: ExplainerScene;
  themeId: keyof typeof themes;
  fontFamily: string;
}) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const theme = themes[themeId];
  const fadeFrames = Math.max(1, Math.round((scene.transition.durationMs / 1000) * fps));
  const fadeIn = interpolate(frame, [0, fadeFrames], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - fadeFrames, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = scene.transition.type === "cut" ? 1 : Math.min(fadeIn, fadeOut);
  const elapsed = (frame / fps) * 1000;
  const cue = scene.subtitles.find((item) => elapsed >= item.startMs && elapsed < item.endMs);
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ opacity, width: "100%", height: "100%", background: theme.background, fontFamily }}>
      <svg width="100%" height="100%" viewBox="0 0 1280 720">
        <rect x="64" y="22" width="1152" height="6" rx="3" fill={theme.line} />
        <rect x="64" y="22" width={1152 * progress} height="6" rx="3" fill={theme.accent} />
        {scene.objects.map((object) => (
          <Graphic key={object.id} object={object} theme={theme} fontFamily={fontFamily} />
        ))}
        {cue ? (
          <g>
            <rect x="180" y="626" width="920" height="72" rx="16" fill={theme.subtitle} />
            <foreignObject x="200" y="634" width="880" height="56">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  color: theme.subtitleInk,
                  fontFamily,
                  fontSize: 24,
                  lineHeight: 1.25,
                }}
              >
                {cue.text}
              </div>
            </foreignObject>
          </g>
        ) : null}
      </svg>
    </div>
  );
}
