/**
 * Catalogue des modèles BP Cuisines utilisés par le visualiseur.
 *
 * Source : réalisations et sélection Arrex publiées sur https://www.bpcuisines.ch
 * Les visuels sont optimisés par `npm run catalogue` (scripts/build-catalogue.mjs)
 * depuis assets/source/ vers public/catalogue/<id>/.
 *
 * `spec` est la fiche matière envoyée au moteur IA (en anglais : meilleure
 * compréhension par le modèle). Elle complète les photos de référence.
 */

export type Collection = "Réalisation BP" | "Sélection Arrex";

export interface KitchenModel {
  id: string;
  name: string;
  collection: Collection;
  tagline: string;
  description: string;
  tags: string[];
  /** Nuancier affiché sur la carte (façades, plan, accents). */
  swatches: { label: string; hex: string }[];
  materials: { facades: string; plan: string; credence: string; details: string };
  /** Page de la réalisation sur le site BP Cuisines. */
  url: string;
  /** Fichiers sources (assets/source) : le premier sert de visuel principal. */
  sources: string[];
  /** Index (dans `sources`) des photos envoyées comme références au moteur IA. */
  refs: number[];
  /** Implantation d'origine, utilisée par défaut si la pièce le permet. */
  layout: "linéaire" | "en L" | "en U" | "avec îlot";
  spec: string;
}

export const CATALOGUE: KitchenModel[] = [
  {
    id: "atelier-noir",
    name: "Atelier Noir",
    collection: "Réalisation BP",
    tagline: "Minérale, grands volumes gris et îlot ouvert",
    description:
      "Des colonnes effet béton texturé, une ligne noire qui regroupe les fonctions et un éclairage LED sous les meubles hauts.",
    tags: ["Sombre", "Minéral", "Îlot"],
    swatches: [
      { label: "Façades béton", hex: "#8d8b88" },
      { label: "Ligne noire", hex: "#1f1e1d" },
      { label: "Plan noir", hex: "#2a2928" },
    ],
    materials: {
      facades: "Effet béton gris texturé et laque noire mate",
      plan: "Plan de travail noir mat",
      credence: "Crédence noire, bandeau LED intégré",
      details: "Sans poignées, îlot-bar avec tabourets",
    },
    url: "https://www.bpcuisines.ch/realisations/atelier-noir",
    sources: [
      "projects__atelier-noir__00.jpg",
      "projects__atelier-noir__02.jpg",
      "performance__cuisines-atelier-column.avif",
      "projects__atelier-noir__05.jpg",
      "projects__atelier-noir__11.jpg",
    ],
    refs: [0, 1, 2],
    layout: "avec îlot",
    spec: "Tall full-height columns and wall units in a mottled grey concrete-effect laminate with visible cloudy texture; a recessed horizontal band of matte black handleless wall cabinets above a matte black backsplash with warm LED spotlights underneath; matte black thin worktop; handleless fronts with black recessed grip profiles; black built-in oven column; a long grey concrete-effect island/peninsula with a black worktop overhang and white bar stools.",
  },
  {
    id: "eclat-lunaire",
    name: "Éclat lunaire",
    collection: "Réalisation BP",
    tagline: "Graphite mat et grand îlot central",
    description:
      "Façades graphite mates en ligne continue, plan noir et crédence pierre sombre : une cuisine dense qui garde la lumière.",
    tags: ["Graphite", "Mat", "Îlot"],
    swatches: [
      { label: "Graphite mat", hex: "#4a4b4d" },
      { label: "Plan noir", hex: "#1c1c1d" },
      { label: "Crédence pierre", hex: "#3a3938" },
    ],
    materials: {
      facades: "Laque graphite mate",
      plan: "Plan noir mat fin",
      credence: "Crédence effet pierre anthracite",
      details: "Poignées profil noir, îlot avec évier",
    },
    url: "https://www.bpcuisines.ch/realisations/eclat-lunaire",
    sources: [
      "projects__eclat-lunaire__01.webp",
      "projects__eclat-lunaire__04.webp",
      "projects__eclat-lunaire__02.webp",
      "projects__eclat-lunaire__05.webp",
      "projects__eclat-lunaire__00.webp",
    ],
    refs: [0, 1, 3],
    layout: "avec îlot",
    spec: "All fronts in super-matte graphite grey (anthracite) lacquer, flat slab doors with slim black bar handles placed horizontally; full-height tall units integrating a stainless/black built-in oven and fridge; wall units in the same graphite; anthracite stone-effect backsplash with subtle veining; thin matte black worktop; a large graphite island with integrated sink, black tap and black worktop; overall monolithic, calm and precise.",
  },
  {
    id: "cuisine-verte",
    name: "Écrin de sauge",
    collection: "Réalisation BP",
    tagline: "Vert sauge, rose poudré et marbre aux veines cuivrées",
    description:
      "Grands volumes vert sauge, une ligne rose poudré au centre et un plan minéral blanc veiné de cuivre sur un grand îlot.",
    tags: ["Couleur", "Marbre", "Îlot"],
    swatches: [
      { label: "Vert sauge", hex: "#86a79a" },
      { label: "Rose poudré", hex: "#d1a287" },
      { label: "Marbre cuivré", hex: "#efe9e2" },
    ],
    materials: {
      facades: "Laque vert sauge et rose poudré",
      plan: "Céramique blanche aux veines cuivrées",
      credence: "Crédence assortie au plan",
      details: "Grand îlot avec places assises, colonnes four noir",
    },
    url: "https://www.bpcuisines.ch/realisations/cuisine-verte",
    sources: [
      "projects__cuisine-verte__00.avif",
      "projects__cuisine-verte__01.avif",
      "projects__cuisine-verte__03.avif",
      "projects__cuisine-verte__02.avif",
      "projects__cuisine-verte__04.avif",
    ],
    refs: [0, 1, 2],
    layout: "avec îlot",
    spec: "Tall units and base units in a soft matte sage green (muted mint-grey-green) lacquer; a central horizontal row of wall cabinets in powdery blush pink / soft terracotta-rose matte lacquer; handleless fronts; black built-in ovens in the tall units and a stainless steel American fridge; a large island with a thick white sintered-stone worktop with dramatic copper/rust-orange veins (Calacatta-copper look), waterfall-free, sink and black tap; white backsplash; bright and joyful.",
  },
  {
    id: "graphite-chaleureux",
    name: "Graphite chaleureux",
    collection: "Réalisation BP",
    tagline: "Graphite réchauffé par une niche en bois",
    description:
      "Les grands linéaires graphite absorbent le rangement ; une niche en chêne éclairée réchauffe l'ensemble.",
    tags: ["Graphite", "Bois", "Linéaire"],
    swatches: [
      { label: "Graphite", hex: "#45464a" },
      { label: "Chêne clair", hex: "#c79f73" },
      { label: "Plan noir", hex: "#222223" },
    ],
    materials: {
      facades: "Graphite mat, sans poignées",
      plan: "Plan noir fin",
      credence: "Niche et crédence en chêne clair éclairées",
      details: "Colonnes toute hauteur, éclairage LED chaud",
    },
    url: "https://www.bpcuisines.ch/realisations/graphite-chaleureux",
    sources: [
      "projects__graphite-chaleureux__00.jpg",
      "projects__graphite-chaleureux__04.jpg",
      "projects__graphite-chaleureux__03.jpg",
      "projects__graphite-chaleureux__01.jpg",
      "projects__graphite-chaleureux__02.jpg",
    ],
    refs: [0, 1, 2],
    layout: "linéaire",
    spec: "A long straight run of handleless matte graphite (dark warm grey) fronts with recessed black grip channels; floor-to-ceiling tall graphite columns at both ends integrating black built-in ovens; a recessed open niche between worktop and wall units clad in light natural oak veneer (backsplash and niche) washed by warm LED strip light; thin matte black worktop; graphite wall units above; minimal, warm and architectural.",
  },
  {
    id: "showroom-terracotta",
    name: "Terracotta",
    collection: "Réalisation BP",
    tagline: "Terracotta, graphite et plan minéral",
    description:
      "Une couleur franche équilibrée par le graphite et un plan minéral gris. À voir en vrai au showroom de Cernier.",
    tags: ["Couleur", "Minéral", "Îlot"],
    swatches: [
      { label: "Terracotta", hex: "#c9772f" },
      { label: "Graphite", hex: "#3d3e40" },
      { label: "Pierre grise", hex: "#6f6c69" },
    ],
    materials: {
      facades: "Laque terracotta et graphite",
      plan: "Plan minéral gris",
      credence: "Crédence pierre anthracite mouchetée",
      details: "Îlot terracotta, suspensions noires",
    },
    url: "https://www.bpcuisines.ch/realisations/showroom-terracotta",
    sources: [
      "projects__showroom-terracotta__01.jpg",
      "projects__showroom-terracotta__00.jpg",
      "projects__showroom-terracotta__02.jpg",
      "performance__cuisines-showroom-terracotta.avif",
    ],
    refs: [0, 1, 2],
    layout: "avec îlot",
    spec: "Wall cabinets and island fronts in a vivid satin terracotta / burnt-orange lacquer; tall units and base structure in matte graphite; dark anthracite speckled stone backsplash; thick grey mineral (concrete-like) worktop on the island and back run; handleless fronts; black industrial dome pendant lights above the island; black built-in appliances; bold yet balanced.",
  },
  {
    id: "cuisine-locative-optimisee",
    name: "Blanc essentiel",
    collection: "Réalisation BP",
    tagline: "Compacte, blanche et simple à entretenir",
    description:
      "La cuisine locative optimisée : façades blanches mates, plan et crédence sombres, chaque longueur sert au rangement.",
    tags: ["Clair", "Compact", "En L"],
    swatches: [
      { label: "Blanc mat", hex: "#f1f0ed" },
      { label: "Plan noir", hex: "#232323" },
      { label: "Crédence pierre", hex: "#4a4847" },
    ],
    materials: {
      facades: "Blanc mat, profils de prise noirs",
      plan: "Plan noir fin",
      credence: "Crédence effet pierre sombre",
      details: "Implantation en L, électroménager inox",
    },
    url: "https://www.bpcuisines.ch/realisations/cuisine-locative-optimisee",
    sources: [
      "projects__cuisine-locative-optimisee__01.webp",
      "projects__cuisine-locative-optimisee__00.webp",
      "projects__cuisine-locative-optimisee__02.webp",
      "projects__cuisine-locative-optimisee__03.webp",
      "performance__locatif-bulle.avif",
    ],
    refs: [0, 1, 2],
    layout: "en L",
    spec: "Flat matte white slab fronts (base and wall units) with horizontal black recessed handle profiles (black grip channels) under the worktop and between drawers; thin matte black worktop; dark grey stone-effect backsplash between worktop and wall units; stainless steel built-in oven under the worktop, black induction hob, black sink and tap; clean, bright, practical and durable.",
  },
  {
    id: "arrex-daytona",
    name: "Daytona",
    collection: "Sélection Arrex",
    tagline: "Chêne noir et marbre Patagonia",
    description:
      "Colonnes en chêne noir veiné, crédence marbre noir aux veines blanches et îlot sombre : la pièce maîtresse Arrex.",
    tags: ["Sombre", "Bois", "Marbre"],
    swatches: [
      { label: "Chêne noir", hex: "#26221f" },
      { label: "Marbre noir", hex: "#1b1a1a" },
      { label: "Veines blanches", hex: "#e8e4dd" },
    ],
    materials: {
      facades: "Chêne noir veiné, sans poignées",
      plan: "Plan sombre mat",
      credence: "Marbre noir aux veines blanches",
      details: "Bibliothèque intégrée, îlot sombre",
    },
    url: "https://www.bpcuisines.ch/cuisines-arrex",
    sources: [
      "home__12-immersive-arrex-daytona.webp",
      "home__05-amenagement-arrex-daytona.webp",
      "editorial__arrex__01-plan.webp",
      "home__07-appliance-integration-arrex-daytona.webp",
    ],
    refs: [0, 1, 2],
    layout: "avec îlot",
    spec: "Floor-to-ceiling tall units in black-stained oak veneer with visible vertical wood grain, handleless; integrated open shelving niches in the same black oak; a backsplash and back wall panel in polished black marble with bold white veins (Nero Marquina / Patagonia look); dark charcoal island with a matte dark worktop; warm beige plaster walls around; dramatic, luxurious Italian design.",
  },
  {
    id: "arrex-sauge-noyer",
    name: "Sauge & noyer",
    collection: "Sélection Arrex",
    tagline: "Vert pâle laqué et colonnes en noyer",
    description:
      "Un grand linéaire vert pâle à poignées gorge, encadré par des colonnes en noyer : architectural et lumineux.",
    tags: ["Clair", "Bois", "Architectural"],
    swatches: [
      { label: "Vert pâle", hex: "#c7d3c3" },
      { label: "Noyer", hex: "#5b3d2a" },
      { label: "Marbre blanc", hex: "#ece9e4" },
    ],
    materials: {
      facades: "Laque vert pâle et noyer naturel",
      plan: "Plan clair",
      credence: "Panneau noyer et étagères éclairées",
      details: "Gorges dorées, colonnes toute hauteur",
    },
    url: "https://www.bpcuisines.ch/cuisines-arrex",
    sources: ["home__23-architectural-kitchen-arrex.webp", "performance__expertise-electromenager.avif"],
    refs: [0, 1],
    layout: "linéaire",
    spec: "A long run of base units in a pale sage / celadon green lacquer with slim champagne-gold horizontal grip channels; floor-to-ceiling tall units and back panel in natural dark walnut veneer with integrated black ovens and backlit open shelves; light stone worktop; very architectural, symmetrical and elegant.",
  },
  {
    id: "arrex-lac",
    name: "Rive",
    collection: "Sélection Arrex",
    tagline: "Chêne naturel et pierre beige, en U",
    description:
      "Chêne naturel chaleureux et plan pierre beige, ouvert sur la fenêtre : une cuisine douce et méditerranéenne.",
    tags: ["Bois", "Clair", "En U"],
    swatches: [
      { label: "Chêne naturel", hex: "#a8835c" },
      { label: "Pierre beige", hex: "#cdbca5" },
      { label: "Laiton", hex: "#b08d57" },
    ],
    materials: {
      facades: "Chêne naturel, sans poignées",
      plan: "Pierre beige mate",
      credence: "Pierre beige assortie",
      details: "Implantation en U, robinetterie laiton",
    },
    url: "https://www.bpcuisines.ch/cuisines-arrex",
    sources: [
      "editorial__arrex__03-angle.webp",
      "editorial__arrex__02-fenetre.webp",
      "home__25-island-detail-arrex.webp",
    ],
    refs: [0, 1, 2],
    layout: "en U",
    spec: "Base units in warm natural oak veneer with horizontal grain, handleless with recessed grips; thick warm beige stone (travertine/limestone look) worktop and matching upstand; minimal or no wall cabinets so the window stays open; brushed brass tap; soft warm beige plaster walls; calm, warm, Mediterranean contemporary.",
  },
  {
    id: "arrex-loft-clair",
    name: "Loft clair",
    collection: "Sélection Arrex",
    tagline: "Colonnes blanc cassé et chêne",
    description:
      "Des colonnes blanc cassé toute hauteur, un bas en chêne et une ligne nette, idéale pour une pièce de vie ouverte.",
    tags: ["Clair", "Bois", "Ouvert"],
    swatches: [
      { label: "Blanc cassé", hex: "#ebe7df" },
      { label: "Chêne", hex: "#b48a5f" },
      { label: "Noir", hex: "#262626" },
    ],
    materials: {
      facades: "Laque blanc cassé et chêne",
      plan: "Plan clair fin",
      credence: "Sans meubles hauts, mur dégagé",
      details: "Fours en colonne, ligne minimaliste",
    },
    url: "https://www.bpcuisines.ch/cuisines-arrex",
    sources: ["home__26-arrex-showcase-light.webp"],
    refs: [0],
    layout: "linéaire",
    spec: "Floor-to-ceiling tall units in off-white / warm white matte lacquer with integrated black built-in ovens; a low run of base units in natural oak veneer with handleless fronts and a thin light worktop; no wall cabinets above the base run; airy, Scandinavian-loft feel.",
  },
];

export const getModel = (id: string) => CATALOGUE.find((m) => m.id === id);
