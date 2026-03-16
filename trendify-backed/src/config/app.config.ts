import dotenv from "dotenv";

dotenv.config();

const appConfig = {
  frontendUrl: process.env.URL_FORNT_END!,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET!,
  nodeEnv: process.env.NODE_ENV!,
  authorization: process.env.AUTHORIZATION!,
  accessTokenTtl: 14400,
  refreshTokenTtl: 604800,
  appName: process.env.APP_NAME || "Trendify",
  supportEmail: process.env.SUPPORT_EMAIL || "support@trendify.com",
};

export default appConfig;
