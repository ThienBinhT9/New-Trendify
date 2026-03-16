import * as Response from "@/shared/responses";

import { ChangePasswordDTO } from "@/application/dtos/auth.dto";
import { IPasswordService } from "@/application/services";
import { IUnitOfWorkFactory } from "@/domain/unit-of-work";

export class ChangePasswordUsecase {
  constructor(
    private readonly uowFactory: IUnitOfWorkFactory,
    private readonly passwordSvc: IPasswordService,
  ) {}

  async execute(body: ChangePasswordDTO) {
    const uow = await this.uowFactory.create();

    const user = await uow.users.findById(body.userId);
    if (!user) {
      throw new Response.BadRequestError("Invalid registration details");
    }

    const isMatch = this.passwordSvc.compare(body.password, user.data.password);
    if (!isMatch) {
      throw new Response.BadRequestError("Old password is incorrect");
    }

    const isSame = this.passwordSvc.compare(body.newPassword, user.data.password);
    if (isSame) {
      throw new Response.BadRequestError("New password must be different");
    }

    const hashedPassword = this.passwordSvc.hash(body.newPassword);

    try {
      user.updatePassword(hashedPassword);

      await uow.users.update(user);
      await uow.sessions.revokeAllExcept(user.id!, body.sessionId);

      return new Response.SuccessResponse({ message: "Change password successfully" });
    } catch (error) {
      uow.rollback();

      if (error instanceof Response.BadRequestError) {
        throw error;
      }
      throw new Response.InternalServerError("Failed to change password");
    }
  }
}
