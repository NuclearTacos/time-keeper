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
    id: "notes-list-continuation",
    date: "2026-04-16",
    title: "Lists auto-continue in note editor",
    description:
      "When editing a note, pressing Enter at the end of a bulleted, numbered, or task-list line now starts the next line with the same prefix (numbers increment, task checkboxes start unchecked). Press Enter again on an empty list item to exit the list.",
  },
  {
    id: "report-tag-task-filters",
    date: "2026-04-15",
    title: "Filter the report by tag and task name",
    description:
      "The report page now has filter tools above every chart. Click tag pills to show only sessions matching those tags (hierarchy-aware: selecting a supertag also matches subtags), and use the search box to narrow down by task name. The total updates in real time to reflect your filtered selection.",
  },
  {
    id: "todo-mark-complete-button",
    date: "2026-04-15",
    title: "Mark todo tasks as done",
    description:
      "Todo tasks now have a 'done' button. When a todo is running in the timer, clicking 'done' stops the session and removes it from your ToDo list in one step. Queued todos also have a checkmark button to mark them complete without starting a timer.",
  },
  {
    id: "whats-new-same-day-entries-fix",
    date: "2026-04-15",
    title: "What's New now reliably detects all new entries",
    description:
      "Fixed a bug where changelog entries added on the same day as your last visit were not marked as new. The feed now tracks exactly which entries you have seen, so any addition — even multiple updates on the same day — correctly shows a badge and 'new' label.",
  },
  {
    id: "whats-new-badge-clears-on-close",
    date: "2026-04-15",
    title: "What's New badge now clears after viewing",
    description:
      "Fixed a bug where the bell badge count didn't go away after opening the What's New feed. Today's entries are now correctly marked as seen when you view the feed.",
  },
  {
    id: "inactive-tab-wake-fix",
    date: "2026-04-15",
    title: "Faster response after leaving the app idle",
    description:
      "Fixed a lag spike that occurred when returning to the app after 30+ minutes away. The timer now instantly corrects itself when you switch back, and if the tab was idle for 30 minutes or more the page reloads automatically to restore a clean live connection.",
  },
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
