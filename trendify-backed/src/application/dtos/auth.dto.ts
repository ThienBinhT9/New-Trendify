export interface StartSignUpDTO {
  email: string;
}

export interface VerifySignUpDTO {
  token: string;
}

export interface CompleteSignUpDTO {
  signupSession: string;
  deviceId: string;
  password: string;
  username: string;
  firstName: string;
  lastName?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface SignInDTO {
  email: string;
  password: string;
  deviceId: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface SignOutDTO {
  sessionId: string;
  userId: string;
  logoutAll?: boolean;
}

export interface RefreshDTO {
  refreshToken: string;
  sessionId: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

export interface ChangePasswordDTO {
  userId: string;
  sessionId: string;
  password: string;
  newPassword: string;
}
