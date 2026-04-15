<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Git

Do not add `Co-Authored-By` or any self-attribution to commit messages.

# Convex

`convex/_generated/` is committed to the repo. Whenever you add or change Convex functions or schema, run `npx convex dev` locally and stage the updated `_generated/` files alongside the function changes. Vercel builds run `npx convex deploy` (which deploys schema/functions to Convex) followed by `npx next build`.

# Feedback

**Important:** The standard `WebFetch` tool and `curl` cannot reach the Convex site
(`cheerful-canary-927.convex.site`) or the Vercel app — both are blocked by the
egress proxy / return 403. `npx convex run` also fails for the same reason.

Use the **Vercel MCP tool** `web_fetch_vercel_url` instead (search for it with
ToolSearch if not already loaded). This tool can authenticate through Vercel's
protection layer.

To read user feedback:
  web_fetch_vercel_url({ url: "https://time-keeper-pink.vercel.app/api/feedback" })
Returns JSON array of { _id, text, createdAt, resolved } objects, newest first.

To mark feedback as resolved after addressing it:
  web_fetch_vercel_url({ url: "https://time-keeper-pink.vercel.app/api/feedback?action=resolve&id=<_id>" })
Always resolve feedback after you have written the code that addresses it.

# What's New Feed

Every user-visible change must be recorded in the What's New feed so users can
see what has been addressed. The feed is driven by a static array in
`src/lib/changelog.ts` — no database writes are needed.

**When you implement any change (bug fix, new feature, improvement):**

1. Open `src/lib/changelog.ts`.
2. Add a new entry to the **top** of the `CHANGELOG` array (newest first).
3. Use today's date, a short `title`, and a clear `description` that explains
   what changed and why it matters to the user.
4. Use a unique `id` in kebab-case (never reuse an existing id).

Example entry:
```typescript
{
  id: "my-feature-slug",
  date: "2026-04-15",
  title: "Short title for the change",
  description: "What changed and why it matters to the user.",
},
```

The bell icon in the nav bar shows a badge counting entries the user has not
yet seen. Entries are considered "new" if their date is after the user's last
visit to the feed. Users mark all entries as seen by opening the feed.
