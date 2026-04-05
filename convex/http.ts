import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/api/feedback",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const entries = await ctx.runQuery(api.feedback.listFeedback);
    return new Response(JSON.stringify(entries), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/feedback/resolve",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { feedbackId } = await request.json();
    await ctx.runMutation(api.feedback.resolveFeedback, { feedbackId });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
