import * as z from "zod";

import { REGEXT_EMAIL, REGEXT_PASSWORD } from "../../shared/constants";

export const startSignupSchema = z.object({
  email: z.string().regex(REGEXT_EMAIL, { message: "Invalid email format!" }).trim(),
});

export const verifySignupSchema = z.object({
  token: z.string().nonempty("token is required"),
});

export const completeSignupSchema = z.object({
  password: z.string().regex(REGEXT_PASSWORD, { message: "Invalid password format!" }),
  username: z.string().nonempty({ message: "username is required" }),
  firstName: z.string().nonempty({ message: "firstname is required" }),
  lastName: z.string().optional(),
});

export const signInSchema = z.object({
  email: z.string().regex(REGEXT_EMAIL, { message: "Invalid login credentials." }),
  password: z.string().regex(REGEXT_PASSWORD, { message: "Invalid login credentials." }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().regex(REGEXT_EMAIL, { message: "Invalid email format!" }),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().regex(REGEXT_PASSWORD, { message: "Invalid password format!" }),
  token: z.string().nonempty({ message: "Invalid request format!" }),
});

export const changePasswordSchema = z.object({
  userId: z.string().nonempty({ message: "Invalid request format!" }),
  password: z.string().regex(REGEXT_PASSWORD, { message: "Invalid password format!" }),
  newPassword: z.string().regex(REGEXT_PASSWORD, { message: "Invalid new password format!" }),
});
