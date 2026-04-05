export const TAG_COLORS = [
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
] as const;

export type TagColor = (typeof TAG_COLORS)[number];

// Tailwind classes for each color — text color for tag labels, bg for the swatch dot
export const TAG_COLOR_MAP: Record<
  TagColor,
  { text: string; bg: string; border: string }
> = {
  red:    { text: "text-red-500",    bg: "bg-red-500",    border: "border-red-500/60" },
  orange: { text: "text-orange-500", bg: "bg-orange-500", border: "border-orange-500/60" },
  amber:  { text: "text-amber-500",  bg: "bg-amber-500",  border: "border-amber-500/60" },
  green:  { text: "text-green-500",  bg: "bg-green-500",  border: "border-green-500/60" },
  teal:   { text: "text-teal-500",   bg: "bg-teal-500",   border: "border-teal-500/60" },
  blue:   { text: "text-blue-500",   bg: "bg-blue-500",   border: "border-blue-500/60" },
  purple: { text: "text-purple-500", bg: "bg-purple-500", border: "border-purple-500/60" },
  pink:   { text: "text-pink-500",   bg: "bg-pink-500",   border: "border-pink-500/60" },
};

export function getTagTextClass(color: string | undefined): string {
  if (!color) return "";
  return (TAG_COLOR_MAP as Record<string, { text: string }>)[color]?.text ?? "";
}
