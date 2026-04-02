/**
 * Parses a task input string into a name and tags.
 * Tags are extracted from #word patterns and normalized to lowercase.
 *
 * Example: "Fix login bug #auth #backend" → { name: "Fix login bug", tags: ["auth", "backend"] }
 */
export function parseTags(input: string): { name: string; tags: string[] } {
  const tags = [...input.matchAll(/#(\S+)/g)].map((m) => m[1].toLowerCase());
  const name = input.replace(/#\S+/g, "").trim();
  return { name, tags };
}
