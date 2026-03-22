import { createMiddleware, createStart } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { authMiddleware } from "./middlewares/auth";

const loggingMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next }) => {
    const request = getRequest();
    console.log(`[${request.method}] ${request.url}`);
    return next();
  },
);

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [loggingMiddleware, authMiddleware],
  };
});
