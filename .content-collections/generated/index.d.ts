import type configuration from "../../content-collections.ts";
import type { GetTypeByName } from "@content-collections/core";

export type Blog = GetTypeByName<typeof configuration, "blog">;
export declare const allBlogs: Array<Blog>;

export {};
