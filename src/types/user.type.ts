import { z } from "zod";

export enum UserStatus {
  ACTIVE = "ACTIVE",
  DEACTIVE = "DEACTIVE",
  PENDING = "PENDING",
}

export type userInfo = {
  name: string;
  gender: string;
  character_name: string;
  char_desc: string;
};

export const userSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s]*$/, "Name can only contain letters and spaces"),

  email: z
    .string()
    .email("Invalid email address")
    .min(5, "Email must be at least 5 characters")
    .max(255, "Email cannot exceed 255 characters"),

  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((date) => {
      const timestamp = Date.parse(date);
      const now = new Date();
      return !isNaN(timestamp) && timestamp < now.getTime();
    }, "Invalid date or date is in the future"),

  gender: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Please select a valid gender option" }),
  }),
});

export type User = z.infer<typeof userSchema>;
