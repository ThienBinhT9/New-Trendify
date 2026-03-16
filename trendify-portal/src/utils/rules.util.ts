import { Rule } from "antd/es/form";
import dayjs from "dayjs";

import { REGEXT_EMAIL, REGEXT_PASSWORD } from "./constant.util";

export const emailRules: Rule[] = [
  {
    required: true,
    message: "Please enter your email",
  },
  {
    pattern: REGEXT_EMAIL,
    message: "Please enter a valid email address",
  },
];

export const passwordRules: Rule[] = [
  {
    required: true,
    message: "Please enter your password",
  },
  {
    pattern: REGEXT_PASSWORD,
    message:
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
  },
];

export const confirmPasswordRules = (getFieldValue: (name: string) => string): Rule[] => [
  {
    required: true,
    message: "Please confirm your password",
  },
  {
    validator(_, value) {
      if (!value || getFieldValue("password") === value) {
        return Promise.resolve();
      }
      return Promise.reject(new Error("Passwords do not match"));
    },
  },
];

export const signupRules = {
  password: passwordRules,
  confirmPassword: confirmPasswordRules,
  username: [{ required: true, message: "Please enter your user name" }] as Rule[],
};

export const resetRules = {
  password: passwordRules,
  confirmPassword: confirmPasswordRules,
};

export const aboutRules: Rule[] = [
  { max: 500, message: "Mô tả không được vượt quá 500 ký tự" },
];

export const dateOfBirthRules: Rule[] = [
  {
    validator(_, value: dayjs.Dayjs | null) {
      if (!value) return Promise.resolve();
      if (value.isAfter(dayjs(), "day")) {
        return Promise.reject(new Error("Ngày sinh không thể là ngày trong tương lai"));
      }
      if (dayjs().diff(value, "year") > 120) {
        return Promise.reject(new Error("Ngày sinh không hợp lệ"));
      }
      return Promise.resolve();
    },
  },
];

export const profileRules = {
  about: aboutRules,
  dateOfBirth: dateOfBirthRules,
};
