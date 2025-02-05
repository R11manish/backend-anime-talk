import { z } from "zod";

export const characterSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),

  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be 500 characters or less"),

  profileUrl: z.string().url("Invalid URL format"),
});

export type Character = z.infer<typeof characterSchema>;
