import type { KitchenModel } from "@/data/catalogue";

export type LayoutOption = "auto" | "linear" | "l-shape" | "island";
export type AmbianceOption = "daylight" | "evening";
export type FloorOption = "keep" | "refresh";

export interface RenderOptions {
  layout: LayoutOption;
  ambiance: AmbianceOption;
  floor: FloorOption;
  /** Retirer les objets du quotidien (vaisselle, bouilloire, etc.). */
  declutter: boolean;
}

export const DEFAULT_OPTIONS: RenderOptions = {
  layout: "auto",
  ambiance: "daylight",
  floor: "keep",
  declutter: true,
};

const LAYOUT_TEXT: Record<LayoutOption, string> = {
  auto:
    "Keep the existing kitchen footprint: install the new kitchen exactly where the current kitchen (or the most logical kitchen wall) is, using the same wall lengths. Do not invent an island if there is not enough floor space.",
  linear: "Install the new kitchen as a single straight run along the main wall where the kitchen currently is.",
  "l-shape": "Install the new kitchen as an L-shape along the main wall and continuing on the adjacent wall, keeping windows and doors clear.",
  island:
    "Install the back run along the main wall and add a central island parallel to it, keeping at least 100 cm of circulation between them. Only add the island if it physically fits the visible floor area.",
};

const AMBIANCE_TEXT: Record<AmbianceOption, string> = {
  daylight:
    "Lighting: keep the natural daylight of the original photo (same direction, intensity and colour temperature coming from the existing windows). Under-cabinet LEDs off or very subtle.",
  evening:
    "Lighting: early evening atmosphere. The window light is dimmer and bluish; warm 2700K under-cabinet LED strips and ceiling spotlights are on, creating soft pools of light on the worktop and backsplash.",
};

/**
 * Prompt « architectural visualisation » : la photo du client est la vérité
 * géométrique, les références définissent uniquement le mobilier.
 */
export function buildRenderPrompt(model: KitchenModel, opts: RenderOptions, refCount: number, hasZone = false): string {
  const first = hasZone ? 3 : 2;
  const refs = refCount === 1 ? `IMAGE ${first} is` : `IMAGES ${first} to ${first + refCount - 1} are`;
  const zone = hasZone
    ? [
        `IMAGE 2 is the same photo where the client has painted, in translucent red, the ONLY area that may be transformed.`,
        `STRICT ZONE RULE: install the new kitchen only inside the red area of IMAGE 2. Every part of the photo outside the red area must remain pixel-identical to IMAGE 1: same walls (including any marks), floor, ceiling, windows, radiators, objects and lighting. Never place an island, furniture or appliances outside the red area. The final image must contain no red tint.`,
      ]
    : [];
  return [
    `You are a high-end architectural photographer and interior visualisation expert working for the Swiss kitchen maker BP Cuisines.`,
    `IMAGE 1 is a real photo of a client's room. ${refs} reference photos of the kitchen model "${model.name}" that the client wants.`,
    ...zone,
    ``,
    `GOAL: produce a photograph of THE SAME ROOM as IMAGE 1, after the new "${model.name}" kitchen has been professionally installed.`,
    ``,
    `KEEP IDENTICAL TO IMAGE 1 (non-negotiable):`,
    `- exact camera position, height, perspective, lens and framing (same vanishing points, same crop, same aspect ratio);`,
    `- room geometry: walls, ceiling height, corners, beams, windows (frames, view outside), doors, radiators, sockets positions;`,
    `- ${opts.floor === "keep" ? "the existing floor material and colour" : "the room shell, but you may replace the floor with a neutral contemporary floor that suits the kitchen (light oak parquet or large-format grey tiles)"};`,
    `- the scale of the room: base cabinets 90 cm high, worktop depth 60-65 cm, wall cabinets start ~55 cm above the worktop, tall units reach ceiling height.`,
    ``,
    `REPLACE: remove the old kitchen entirely (cabinets, worktop, tiles/backsplash, old appliances, hood, fridge) and install the new kitchen.`,
    LAYOUT_TEXT[opts.layout],
    `Keep the sink near its original position (under or near the window if there is one) and the cooktop away from the window.`,
    hasZone
      ? `Inside the red area, wall surfaces not covered by furniture get fresh, clean matte white paint.`
      : `Walls not covered by the kitchen: fresh, clean matte white paint (repair stains and cracks).`,
    ``,
    `NEW KITCHEN — reproduce faithfully the materials, colours, textures, fronts, handles, worktop, backsplash and design language of the reference photos:`,
    model.spec,
    `Integrate modern built-in appliances (oven in a tall unit or under the worktop, flush induction hob, integrated or tall fridge column, discreet hood) in the style of the model.`,
    ``,
    AMBIANCE_TEXT[opts.ambiance],
    opts.declutter
      ? `Styling: clean and lightly styled like a showroom delivery photo — at most a small plant and one or two discreet objects. No clutter.`
      : `Styling: a lived-in but tidy kitchen with a few everyday objects.`,
    ``,
    `QUALITY: this must look like a real photograph taken with a full-frame camera, not a 3D render — physically correct reflections on fronts and worktop, contact shadows, ambient occlusion in corners, precise joints and alignments, straight vertical lines, natural material textures, realistic exposure. No people, no text, no logo, no watermark, no frame, no split screen.`,
  ].join("\n");
}

/** Ratios supportés par les moteurs (Nano Banana Pro / Gemini 3 Pro Image). */
export const SUPPORTED_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"] as const;
export type AspectRatio = (typeof SUPPORTED_RATIOS)[number];

export function closestRatio(width: number, height: number): AspectRatio {
  const r = width / height;
  let best: AspectRatio = "4:3";
  let bestDiff = Infinity;
  for (const s of SUPPORTED_RATIOS) {
    const [a, b] = s.split(":").map(Number);
    const d = Math.abs(Math.log(a / b) - Math.log(r));
    if (d < bestDiff) {
      bestDiff = d;
      best = s;
    }
  }
  return best;
}
