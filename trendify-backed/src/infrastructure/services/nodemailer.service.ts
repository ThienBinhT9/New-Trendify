import nodemailer, { Transporter } from "nodemailer";

import emailConfig from "@/infrastructure/configs/mail.config";
import { IMailService } from "@/application/services/mail.service";

class NodeMailerService implements IMailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: emailConfig.service,
      auth: emailConfig.auth,
    });
  }

  async send(to: string, subject: string, body: string) {
    await this.transporter.sendMail({
      from: emailConfig.auth.user,
      to,
      subject,
      html: body,
    });
  }
}

export default NodeMailerService;
