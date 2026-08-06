import { hash, verify } from "@node-rs/argon2";
import type { PasswordHasher } from "../../application/interfaces/auth.js";

export class Argon2PasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return hash(plain, {
      memoryCost: 19_456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });
  }

  async verify(plain: string, storedHash: string): Promise<boolean> {
    return verify(storedHash, plain);
  }
}
