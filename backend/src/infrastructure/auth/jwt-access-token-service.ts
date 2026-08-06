import { SignJWT, jwtVerify } from "jose";
import { ApplicationError } from "../../application/errors/application-error.js";
import type {
  AccessTokenPayload,
  AccessTokenService,
} from "../../application/interfaces/auth.js";

export class JwtAccessTokenService implements AccessTokenService {
  private readonly secret: Uint8Array;

  constructor(
    jwtSecret: string,
    private readonly ttlSeconds: number,
  ) {
    this.secret = new TextEncoder().encode(jwtSecret);
  }

  async sign(payload: AccessTokenPayload): Promise<string> {
    return new SignJWT({
      sid: payload.sessionId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(payload.userId)
      .setIssuedAt()
      .setExpirationTime(`${this.ttlSeconds}s`)
      .sign(this.secret);
  }

  async verify(token: string): Promise<AccessTokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        algorithms: ["HS256"],
      });

      const userId = payload.sub;
      const sessionId = payload.sid;

      if (typeof userId !== "string" || typeof sessionId !== "string") {
        throw new ApplicationError("TOKEN_INVALID", "Invalid access token");
      }

      return { userId, sessionId };
    } catch (err) {
      if (err instanceof ApplicationError) {
        throw err;
      }
      throw new ApplicationError("TOKEN_INVALID", "Invalid access token");
    }
  }
}
