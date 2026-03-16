import { SessionEntity } from "./session.entity";

export interface ISessionRepository {
  create(sesion: SessionEntity): Promise<SessionEntity>;

  update(session: SessionEntity): Promise<SessionEntity>;

  findActiveByUserAndDevice(userId: string, deviceId: string): Promise<SessionEntity | null>;

  findById(id: string): Promise<SessionEntity | null>;

  revokeByUserAndDevice(userId: string, deviceId: string): Promise<void>;

  revokeAll(userId: string): Promise<void>;

  revokeAllExcept(userId: string, id: string): Promise<void>;

  revokeById(id: string): Promise<void>;
}
