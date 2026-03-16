import * as z from "zod";

import { EUserGender } from "@/domain/user";
import { ECommonVisibility } from "@/domain/user-setting";
import { MONGODB_OBJECTID_REGEX } from "@/shared/constants/regex.constant";

export const updateProfileSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, { message: "First name must not be empty" })
      .max(50, { message: "First name must be at most 50 characters" })
      .optional(),

    lastName: z
      .string()
      .trim()
      .max(50, { message: "Last name must be at most 50 characters" })
      .optional(),

    about: z
      .string()
      .max(500, { message: "About section must be at most 500 characters" })
      .optional(),

    gender: z
      .nativeEnum(EUserGender, {
        error: () => ({ message: "Gender must be either male or female" }),
      })
      .optional(),

    dateOfBirth: z.coerce
      .date({ message: "Date of birth must be a valid date" })
      .refine((date) => date < new Date(), {
        message: "Date of birth must be in the past",
      })
      .optional(),

    profilePicture: z
      .string()
      .trim()
      .refine((v) => MONGODB_OBJECTID_REGEX.test(v), {
        message: "Profile picture must be a valid media ID",
      })
      .optional(),

    coverPicture: z
      .string()
      .trim()
      .refine((v) => MONGODB_OBJECTID_REGEX.test(v), {
        message: "Cover picture must be a valid media ID",
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be updated",
  });

export const updateSettingsSchema = z
  .object({
    // Profile Visibility
    profileVisibility: z
      .nativeEnum(ECommonVisibility, {
        message: "Invalid profile visibility value",
      })
      .optional(),

    // Interaction Settings
    allowFollowRequests: z.coerce.boolean().optional(),
    allowTagging: z.coerce.boolean().optional(),
    allowCommentOnProfile: z.coerce.boolean().optional(),
    allowMessage: z.coerce.boolean().optional(),

    // Presence Settings
    showOnlineStatus: z.coerce.boolean().optional(),
    showLastActiveTime: z.coerce.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one privacy setting must be updated",
  });

export const getUserProfileSchema = z.object({
  id: z.string().nonempty({ message: "Invalid user ID" }),
});
