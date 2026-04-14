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
