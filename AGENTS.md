<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Git

Do not add `Co-Authored-By` or any self-attribution to commit messages.

# Convex

`convex/_generated/` is committed to the repo. Whenever you add or change Convex functions or schema, run `npx convex dev` locally and stage the updated `_generated/` files alongside the function changes. Vercel builds run `npx convex deploy` (which deploys schema/functions to Convex) followed by `npx next build`.

# Feedback

To read user feedback, use WebFetch:
  GET https://cheerful-canary-927.convex.site/api/feedback
Returns JSON array of { _id, text, createdAt, resolved } objects, newest first.

To mark feedback as resolved after addressing it:
  POST https://cheerful-canary-927.convex.site/api/feedback/resolve
  Body: { "feedbackId": "<_id from the feedback entry>" }
