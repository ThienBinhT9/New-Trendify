import { UserIntentEntity } from "./user-intent.entity";

export interface IUserIntentRepository {
  save(entity: UserIntentEntity): Promise<void>;

  create(entity: UserIntentEntity): Promise<void>;

  findById(id: string): Promise<UserIntentEntity | null>;

  findByEmail(email: string): Promise<UserIntentEntity | null>;

  findByToken(tokenHash: string): Promise<UserIntentEntity | null>;

  consume(intentId: string): Promise<void>;
}
