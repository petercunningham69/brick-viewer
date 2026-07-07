// Brick catalogue: filenames must follow <Name>_1_White.jpg / _2_Cement_Grey.jpg / _3_Buff.jpg
export const MORTARS = [
  { key: "1_White", label: "White" },
  { key: "2_Cement_Grey", label: "Cement Grey" },
  { key: "3_Buff", label: "Buff" },
];

export const BRICKS = [
  "Bivio",
  "Hubertus",
  "Imperia",
  "Lima",
  "Lupus",
  "Perla",
  "Tigra",
  "Vecto",
].map((name) => ({
  name,
  slug: name.toLowerCase(),
  thumb: `images/${name}_1_White.jpg`,
  images: Object.fromEntries(
    MORTARS.map((m) => [m.key, `images/${name}_${m.key}.jpg`])
  ),
}));

export function findBrick(slug) {
  return BRICKS.find((b) => b.slug === slug);
}
