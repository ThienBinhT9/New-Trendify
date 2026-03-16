import bcrypt from "bcrypt";
import { IPasswordService } from "@/application/services/password.service";

export class BcryptService implements IPasswordService {
  hash(raw: string): string {
    return bcrypt.hashSync(raw, 10);
  }
  compare(raw: string, hashed: string): boolean {
    return bcrypt.compareSync(raw, hashed);
  }
}
