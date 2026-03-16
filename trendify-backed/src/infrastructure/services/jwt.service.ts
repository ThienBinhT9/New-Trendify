import jsonwebtoken, { SignOptions } from "jsonwebtoken";
import { IJwtService, JwtPayloadBase, JwtSignOptions } from "@/application/services/jwt.service";

export class JwtService implements IJwtService {
  sign(payload: object, secret: string, options?: JwtSignOptions): string {
    const token = jsonwebtoken.sign(payload, secret, {
      algorithm: options?.algorithm || "HS256",
      expiresIn: (options?.expiresIn || "2h") as SignOptions["expiresIn"],
    });

    return token;
  }

  async verify<T extends JwtPayloadBase>(token: string, secret: string): Promise<T> {
    return new Promise((resolve, reject) => {
      jsonwebtoken.verify(token, secret, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded as T);
      });
    });
  }

  decode<T extends object = any>(token: string): T | null {
    const decoded = jsonwebtoken.decode(token);
    if (!decoded || typeof decoded === "string") return null;
    return decoded as T;
  }
}
