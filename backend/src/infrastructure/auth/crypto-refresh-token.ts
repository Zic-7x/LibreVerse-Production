import { createHash, randomBytes } from "node:crypto";
import type {
  RefreshTokenGenerator,
  RefreshTokenPair,
} from "../../application/interfaces/auth.js";

export class CryptoRefreshTokenGenerator implements RefreshTokenGenerator {
  generate(): RefreshTokenPair {
    const token = randomBytes(32).toString("base64url");
    return { token, hash: this.hash(token) };
  }

  hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
