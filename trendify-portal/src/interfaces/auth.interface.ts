export interface ISignIn {
  email: string;
  password: string;
}

export interface ISignUp {
  email: string;
  password: string;
}

export enum EVerifyEmailType {
  FORGOT = "forgot",
  CREATE = "create",
}

export enum ESignupStep {
  CHECK_EMAIL = "CHECK_EMAIL",
  VERIFY_SIGNUP = "VERIFY_SIGNUP",
  COMPLETE_SIGNUP = "COMPLETE_SIGNUP",
}
