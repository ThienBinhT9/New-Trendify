import dotenv from "dotenv";

dotenv.config();

const emailConfig = {
  service: "gmail",
  auth: {
    user: process.env.MAIL_ADMIN,
    pass: process.env.APP_PASSWORD,
  },
};

export default emailConfig;
