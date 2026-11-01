import type { AuthoredScene, TemplateProps } from "../compile";

export const INCIDENT_VOICE = "espeak-ng:fr";

export const incidentProject = {
  id: "incident-it",
  version: 1,
  title: "Gestion des incidents IT",
  language: "fr" as const,
  theme: "minimal-professional" as const,
};

type Script = {
  id: string;
  title: string;
  narration: string;
  props: TemplateProps;
};

export const incidentScripts: Script[] = [
  {
    id: "introduction",
    title: "Introduction",
    narration:
      "Un incident informatique, c'est un service qui ne tient plus sa promesse. Voici comment on le mène, de la déclaration jusqu'à la clôture.",
    props: {
      template: "title-introduction",
      kicker: "Gestion des incidents IT",
      title: "De la déclaration à la clôture",
      lede: "Un service interrompu suit un chemin visible, du signal jusqu'au retour à la normale.",
    },
  },
  {
    id: "declaration",
    title: "Déclarer",
    narration:
      "Tout commence par un signal. Une personne, une sonde ou un collègue décrit ce qui est cassé, depuis quand, et qui est touché. On le déclare, sans attendre la solution.",
    props: {
      template: "process-flow",
      title: "Déclarer, puis avancer",
      emphasis: 0,
      steps: [
        { label: "Déclarer" },
        { label: "Qualifier" },
        { label: "Prioriser" },
        { label: "Escalader" },
        { label: "Résoudre" },
        { label: "Clôturer" },
      ],
    },
  },
  {
    id: "qualification",
    title: "Qualifier",
    narration:
      "Qualifier, c'est distinguer un incident d'une demande. L'incident dégrade un service déjà promis. La demande ajoute quelque chose de nouveau, et elle se planifie.",
    props: {
      template: "comparison",
      title: "Incident ou demande",
      left: {
        title: "Incident",
        points: ["Un service déjà promis", "Il est dégradé ou arrêté", "On le rétablit"],
      },
      right: {
        title: "Demande",
        points: ["Quelque chose de nouveau", "Rien n'est cassé", "On la planifie"],
      },
    },
  },
  {
    id: "priorisation",
    title: "Prioriser",
    narration:
      "La priorité croise l'urgence et l'impact. Un écran lent pour une personne n'a pas le même poids qu'un service arrêté pour tous les clients.",
    props: {
      template: "animated-chart",
      title: "L'impact change la priorité",
      unit: "Ampleur touchée",
      bars: [
        { label: "Une personne", value: 1 },
        { label: "Une équipe", value: 3 },
        { label: "Tous les clients", value: 5 },
      ],
    },
  },
  {
    id: "escalade",
    title: "Escalader",
    narration:
      "Si l'équipe qui reçoit l'incident ne peut pas le résoudre, elle le transmet plus haut, avec le contexte. Le ticket ne disparaît pas entre deux niveaux.",
    props: {
      template: "hierarchy-diagram",
      title: "Le ticket monte, le contexte reste",
      root: "Niveau 1",
      children: ["Niveau 2", "Niveau 3", "Fournisseur"],
    },
  },
  {
    id: "resolution",
    title: "Résoudre",
    narration:
      "Résoudre, c'est diagnostiquer, corriger ou contourner, puis vérifier que le symptôme a disparu pour les personnes touchées.",
    props: {
      template: "timeline",
      title: "Rétablir, puis vérifier",
      events: [
        { label: "Diagnostiquer", detail: "ce qui a changé" },
        { label: "Corriger", detail: "ou contourner" },
        { label: "Vérifier", detail: "le symptôme a disparu" },
      ],
    },
  },
  {
    id: "cloture",
    title: "Clôturer",
    narration:
      "On clôture seulement quand le service est rétabli, la personne qui a déclaré est informée, et la trace reste utile pour la prochaine fois.",
    props: {
      template: "key-takeaway",
      title: "Clôturer, ce n'est pas oublier",
      takeaway: "Le service est rétabli, et quelqu'un le sait.",
      points: ["Service rétabli", "Personne informée", "Trace conservée"],
    },
  },
  {
    id: "conclusion",
    title: "Conclusion",
    narration:
      "Déclarer, qualifier, prioriser, escalader, résoudre, clôturer. Ce cycle rend le service visible, et il garde le calme dans l'équipe.",
    props: {
      template: "conclusion",
      title: "Un cycle, pas une surprise",
      summary: "Chaque étape laisse une trace que la suivante peut lire.",
      steps: ["Déclarer", "Qualifier", "Prioriser", "Escalader", "Résoudre", "Clôturer"],
    },
  },
];

export function incidentAudioSrc(id: string): string {
  return `motion/incident/${id}.wav`;
}

export function toAuthored(
  script: Script,
  audioDurationMs: number,
  words: AuthoredScene["words"],
): AuthoredScene {
  return {
    id: script.id,
    title: script.title,
    narration: script.narration,
    audioSrc: incidentAudioSrc(script.id),
    voice: INCIDENT_VOICE,
    audioDurationMs,
    words,
    props: script.props,
  };
}
