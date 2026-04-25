import { auth } from "@/lib/auth";
import { prisma } from "#/db";
import { openrouter } from "#/lib/open-router";
import {
  consumeRateLimit,
  RateLimitError,
  stripRateLimitPrefix,
} from "#/lib/rate-limit";
import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";

export const Route = createFileRoute("/api/ai/summary")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        });
        if (!session?.user) {
          return new Response("Unauthorized", { status: 401 });
        }
        const user = session.user;

        const { itemId, prompt } = await request.json();

        if (!itemId || !prompt) {
          return new Response("Missing itemId or prompt", { status: 400 });
        }

        const item = await prisma.scrapedData.findUnique({
          where: {
            id: itemId,
            userId: user.id,
          },
        });

        if (!item) {
          return new Response("Item not found", { status: 404 });
        }

        try {
          await consumeRateLimit(user.id, "ai");
        } catch (err) {
          if (err instanceof RateLimitError) {
            return new Response(stripRateLimitPrefix(err.message), {
              status: 429,
            });
          }
          throw err;
        }

        const summary = streamText({
          model: openrouter.chat("stepfun/step-3.5-flash:free"),
          system: `You are a helpful assistant that creates concise, informative summaries of web content.
Your summaries should:
- Be 2-3 paragraphs long
- Capture the main points and key takeaways
- Be written in a clear, professional tone`,
          prompt: `Please summarize the following content:\n\n${prompt}`,
        });

        // Return the stream in the format useCompletion expects
        return summary.toTextStreamResponse();
      },
    },
  },
});
