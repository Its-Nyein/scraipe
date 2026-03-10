import { auth } from "@/lib/auth";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const authFnMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    return next({ context: { session } });
  },
);

// export const authRequestMiddleware = createMiddleware({
//   type: "request",
// }).server(async ({ next }) => {
//   const request = getRequest();
//   const session = await auth.api.getSession({ headers: request.headers });
//   return next({ context: { session } });
// });
