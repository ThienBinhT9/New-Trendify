import { BaseConsumer, ConsumerConfig } from "../consumer.base";
import { IMailService } from "@/application/services/mail.service";
import NodeMailerService from "@/infrastructure/services/nodemailer.service";

import { PasswordResetEmailMessage } from "@/domain/events";

/**
 * Email Consumer - Xử lý tất cả email messages
 */
export class EmailConsumer extends BaseConsumer {
  private mailService: IMailService;

  constructor() {
    const config: ConsumerConfig = {
      queueName: "email.queue",
      prefetch: 5, // Xử lý 5 emails đồng thời
      retryLimit: 3,
    };

    super(config);
    this.mailService = new NodeMailerService();
  }

  protected registerHandlers(): void {
    this.register<PasswordResetEmailMessage["data"]>(
      "email.password-reset",
      this.handlePasswordResetEmail.bind(this),
    );
  }

  /**
   * Handler: Gửi email reset password
   */
  private async handlePasswordResetEmail(data: PasswordResetEmailMessage["data"]): Promise<void> {
    await this.mailService.send(data.email, "Reset Your Password", "");
    console.log(`✅ Password reset email sent to ${data.email}`);
  }
}
