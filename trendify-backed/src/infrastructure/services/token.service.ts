import crypto from "crypto";
import { ITokenService } from "@/application/services/token.service";

export class TokenService implements ITokenService {
  generateRandom(length = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  generateKeyPairs() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 4096,
      publicKeyEncoding: { type: "pkcs1", format: "pem" },
      privateKeyEncoding: { type: "pkcs1", format: "pem" },
    });

    return { privateKey, publicKey };
  }

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  hash(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  compareHashes(hashA: string, hashB: string): boolean {
    if (hashA.length !== hashB.length) return false;

    return crypto.timingSafeEqual(Buffer.from(hashA), Buffer.from(hashB));
  }
}
