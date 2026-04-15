/**
 * Static changelog entries for the What's New feed.
 *
 * AGENTS: When you implement a change in response to feedback or a feature request,
 * add a new entry to the TOP of this array (newest first). Use today's date (YYYY-MM-DD),
 * a short title, and a clear description of what changed and why it matters to the user.
 *
 * Example:
 *   {
 *     id: "my-feature-slug",          // unique, kebab-case, never reuse
 *     date: "2026-04-15",             // YYYY-MM-DD
 *     title: "Short title",
 *     description: "What changed and why it matters to the user.",
 *   },
 */

export interface ChangelogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "whats-new-same-day-fix",
    date: "2026-04-15",
    title: "What's New feed now catches same-day updates",
    description:
      "Fixed a bug where changelog entries added on the same day you last opened the feed would not appear as new. The bell badge and 'new' labels now correctly highlight any entry dated today.",
  },
  {
    id: "add-session-from-sessions-page",
    date: "2026-04-15",
    title: "Create sessions from the Sessions page",
    description:
      "You can now log sessions directly from the Sessions page. Tap '+ add session' to enter a task name, date, start time, and optional end time — perfect for retroactively tracking time you forgot to record.",
  },
  {
    id: "whats-new-feed",
    date: "2026-04-15",
    title: "What's New feed",
    description:
      "Added this What's New feed so you can see at a glance when feedback has been addressed. Every change made to the app will appear here. The bell icon in the nav bar shows a badge with the number of updates you haven't seen yet.",
  },
];
