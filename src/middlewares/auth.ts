import { auth } from "@/lib/auth";
import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const authFnMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    return next({ context: { session } });
  },
);

export const authMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next, request }) => {
    const url = new URL(request.url);

    if (
      !url.pathname.startsWith("/dashboard") &&
      !url.pathname.startsWith("/api/ai")
    ) {
      return next();
    }

    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      throw redirect({ to: "/signin" });
    }

    return next({ context: { session } });
  },
);
