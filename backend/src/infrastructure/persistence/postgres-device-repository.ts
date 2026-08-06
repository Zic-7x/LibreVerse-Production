import type pg from "pg";
import type { DevicePlatform } from "@platform/shared-types";
import type {
  CreateDeviceInput,
  DeviceRepository,
  UpdateDeviceInput,
} from "../../application/interfaces/auth.js";
import type { Device } from "../../domain/entities/auth-entities.js";

interface DeviceRow {
  id: string;
  user_id: string;
  platform: DevicePlatform;
  device_name: string | null;
  push_token: string | null;
  app_version: string | null;
  os_version: string | null;
  last_seen_at: Date | null;
  revoked_at: Date | null;
  created_at: Date;
}

function mapDevice(row: DeviceRow): Device {
  return {
    id: row.id,
    userId: row.user_id,
    platform: row.platform,
    deviceName: row.device_name,
    pushToken: row.push_token,
    appVersion: row.app_version,
    osVersion: row.os_version,
    lastSeenAt: row.last_seen_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };
}

export class PostgresDeviceRepository implements DeviceRepository {
  constructor(private readonly pool: pg.Pool) {}

  async create(input: CreateDeviceInput): Promise<Device> {
    const result = await this.pool.query<DeviceRow>(
      `INSERT INTO devices (
         user_id, platform, device_name, push_token, app_version, os_version, last_seen_at
       ) VALUES ($1, $2, $3, $4, $5, $6, now())
       RETURNING id, user_id, platform, device_name, push_token, app_version, os_version,
                 last_seen_at, revoked_at, created_at`,
      [
        input.userId,
        input.platform,
        input.deviceName,
        input.pushToken,
        input.appVersion,
        input.osVersion,
      ],
    );
    return mapDevice(result.rows[0]!);
  }

  async findById(id: string): Promise<Device | null> {
    const result = await this.pool.query<DeviceRow>(
      `SELECT id, user_id, platform, device_name, push_token, app_version, os_version,
              last_seen_at, revoked_at, created_at
       FROM devices WHERE id = $1 AND revoked_at IS NULL`,
      [id],
    );
    return result.rows[0] ? mapDevice(result.rows[0]) : null;
  }

  async findActiveDevicesForUser(userId: string): Promise<Device[]> {
    const result = await this.pool.query<DeviceRow>(
      `SELECT id, user_id, platform, device_name, push_token, app_version, os_version,
              last_seen_at, revoked_at, created_at
       FROM devices
       WHERE user_id = $1 AND revoked_at IS NULL AND push_token IS NOT NULL`,
      [userId],
    );
    return result.rows.map(mapDevice);
  }

  async clearPushToken(deviceId: string): Promise<void> {
    await this.pool.query(
      `UPDATE devices SET push_token = NULL, updated_at = now() WHERE id = $1`,
      [deviceId],
    );
  }

  async update(id: string, input: UpdateDeviceInput): Promise<Device> {
    const result = await this.pool.query<DeviceRow>(
      `UPDATE devices SET
         platform = COALESCE($2, platform),
         device_name = COALESCE($3, device_name),
         push_token = COALESCE($4, push_token),
         app_version = COALESCE($5, app_version),
         os_version = COALESCE($6, os_version),
         last_seen_at = COALESCE($7, last_seen_at),
         updated_at = now()
       WHERE id = $1 AND revoked_at IS NULL
       RETURNING id, user_id, platform, device_name, push_token, app_version, os_version,
                 last_seen_at, revoked_at, created_at`,
      [
        id,
        input.platform ?? null,
        input.deviceName ?? null,
        input.pushToken ?? null,
        input.appVersion ?? null,
        input.osVersion ?? null,
        input.lastSeenAt ?? null,
      ],
    );

    if (!result.rows[0]) {
      throw new Error(`Device not found: ${id}`);
    }

    return mapDevice(result.rows[0]);
  }

  async revoke(id: string, at: Date): Promise<void> {
    await this.pool.query(
      `UPDATE devices SET revoked_at = $2 WHERE id = $1 AND revoked_at IS NULL`,
      [id, at],
    );
  }
}
