export enum ESignupStep {
  CHECK_EMAIL = "CHECK_EMAIL",
  VERIFY_SIGNUP = "VERIFY_SIGNUP",
  COMPLETE_SIGNUP = "COMPLETE_SIGNUP",
}

export const SignupSettings = {
  ttlMagicLink: 15 * 60 * 1000, // 15 minutes
  ttlVerify: 3 * 60 * 60 * 1000, // 3 hours
};

export const RESET_PASSWORD_SETTINGS = {
  forgotAttemptsKey: (email: string) => `forgot:attempts:${email}`,
  resetAttemptsKey: (email: string) => `reset:attempts:${email}`,
  blockKey: (email: string) => `reset_block:${email}`,
  key: (secret: string) => `reset:${secret}`,
  keyTtl: 15 * 60,
  blockTtl: 30 * 60,
  maxAttempts: 3,
};
