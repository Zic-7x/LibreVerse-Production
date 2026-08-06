import type pg from "pg";
import type {
  ModerationActionType,
  ModerationCaseStatus,
  ReportSubjectType,
  SanctionType,
} from "@platform/shared-types";
import type {
  CreateActionParams,
  CreateCaseParams,
  CreateSanctionParams,
  ListCasesFilter,
  ModerationRepository,
} from "../../application/interfaces/moderation.js";
import type {
  ModerationActionEntity,
  ModerationCaseEntity,
  UserSanctionEntity,
} from "../../domain/entities/moderation-entities.js";

interface CaseRow {
  id: string;
  report_id: string | null;
  subject_type: ReportSubjectType;
  subject_id: string;
  status: ModerationCaseStatus;
  assigned_to: string | null;
  priority: number;
  opened_at: Date;
  resolved_at: Date | null;
  notes: string | null;
}

interface ActionRow {
  id: string;
  case_id: string;
  moderator_user_id: string;
  action_type: ModerationActionType;
  reason: string | null;
  metadata: Record<string, unknown>;
  effective_until: Date | null;
  created_at: Date;
}

interface SanctionRow {
  id: string;
  user_id: string;
  sanction_type: SanctionType;
  source_action_id: string;
  starts_at: Date;
  ends_at: Date | null;
  revoked_at: Date | null;
}

function mapCase(row: CaseRow): ModerationCaseEntity {
  return {
    id: row.id,
    reportId: row.report_id,
    subjectType: row.subject_type,
    subjectId: row.subject_id,
    status: row.status,
    assignedTo: row.assigned_to,
    priority: row.priority,
    openedAt: row.opened_at,
    resolvedAt: row.resolved_at,
    notes: row.notes,
  };
}

function mapAction(row: ActionRow): ModerationActionEntity {
  return {
    id: row.id,
    caseId: row.case_id,
    moderatorUserId: row.moderator_user_id,
    actionType: row.action_type,
    reason: row.reason,
    metadata: row.metadata || {},
    effectiveUntil: row.effective_until,
    createdAt: row.created_at,
  };
}

function mapSanction(row: SanctionRow): UserSanctionEntity {
  return {
    id: row.id,
    userId: row.user_id,
    sanctionType: row.sanction_type,
    sourceActionId: row.source_action_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    revokedAt: row.revoked_at,
  };
}

export class PostgresModerationRepository implements ModerationRepository {
  constructor(private readonly pool: pg.Pool) {}

  async createCase(params: CreateCaseParams): Promise<ModerationCaseEntity> {
    const res = await this.pool.query<CaseRow>(
      `INSERT INTO moderation_cases (report_id, subject_type, subject_id, status, assigned_to, priority, notes)
       VALUES ($1, $2, $3, 'open', $4, $5, $6)
       RETURNING id, report_id, subject_type, subject_id, status, assigned_to, priority, opened_at, resolved_at, notes`,
      [
        params.reportId || null,
        params.subjectType,
        params.subjectId,
        params.assignedTo || null,
        params.priority ?? 0,
        params.notes || null,
      ],
    );
    return mapCase(res.rows[0]);
  }

  async findCaseById(id: string): Promise<ModerationCaseEntity | null> {
    const res = await this.pool.query<CaseRow>(
      `SELECT id, report_id, subject_type, subject_id, status, assigned_to, priority, opened_at, resolved_at, notes
       FROM moderation_cases
       WHERE id = $1`,
      [id],
    );
    return res.rows[0] ? mapCase(res.rows[0]) : null;
  }

  async listCases(filter?: ListCasesFilter): Promise<ModerationCaseEntity[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filter?.status) {
      values.push(filter.status);
      conditions.push(`status = $${values.length}`);
    }
    if (filter?.subjectType) {
      values.push(filter.subjectType);
      conditions.push(`subject_type = $${values.length}`);
    }
    if (filter?.assignedTo) {
      values.push(filter.assignedTo);
      conditions.push(`assigned_to = $${values.length}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT id, report_id, subject_type, subject_id, status, assigned_to, priority, opened_at, resolved_at, notes
      FROM moderation_cases
      ${whereClause}
      ORDER BY priority DESC, opened_at DESC
    `;

    const res = await this.pool.query<CaseRow>(query, values);
    return res.rows.map(mapCase);
  }

  async updateCase(
    id: string,
    updates: Partial<{
      status: ModerationCaseStatus;
      assignedTo: string | null;
      priority: number;
      notes: string | null;
      resolvedAt: Date | null;
    }>,
  ): Promise<ModerationCaseEntity> {
    const setClauses: string[] = [];
    const values: unknown[] = [id];

    if (updates.status !== undefined) {
      values.push(updates.status);
      setClauses.push(`status = $${values.length}`);
    }
    if (updates.assignedTo !== undefined) {
      values.push(updates.assignedTo);
      setClauses.push(`assigned_to = $${values.length}`);
    }
    if (updates.priority !== undefined) {
      values.push(updates.priority);
      setClauses.push(`priority = $${values.length}`);
    }
    if (updates.notes !== undefined) {
      values.push(updates.notes);
      setClauses.push(`notes = $${values.length}`);
    }
    if (updates.resolvedAt !== undefined) {
      values.push(updates.resolvedAt);
      setClauses.push(`resolved_at = $${values.length}`);
    }

    if (setClauses.length === 0) {
      const existing = await this.findCaseById(id);
      if (!existing) throw new Error("Case not found");
      return existing;
    }

    const query = `
      UPDATE moderation_cases
      SET ${setClauses.join(", ")}
      WHERE id = $1
      RETURNING id, report_id, subject_type, subject_id, status, assigned_to, priority, opened_at, resolved_at, notes
    `;

    const res = await this.pool.query<CaseRow>(query, values);
    return mapCase(res.rows[0]);
  }

  async createAction(params: CreateActionParams): Promise<ModerationActionEntity> {
    const res = await this.pool.query<ActionRow>(
      `INSERT INTO moderation_actions (case_id, moderator_user_id, action_type, reason, metadata, effective_until)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, case_id, moderator_user_id, action_type, reason, metadata, effective_until, created_at`,
      [
        params.caseId,
        params.moderatorUserId,
        params.actionType,
        params.reason || null,
        JSON.stringify(params.metadata || {}),
        params.effectiveUntil || null,
      ],
    );
    return mapAction(res.rows[0]);
  }

  async findActionsByCaseId(caseId: string): Promise<ModerationActionEntity[]> {
    const res = await this.pool.query<ActionRow>(
      `SELECT id, case_id, moderator_user_id, action_type, reason, metadata, effective_until, created_at
       FROM moderation_actions
       WHERE case_id = $1
       ORDER BY created_at ASC`,
      [caseId],
    );
    return res.rows.map(mapAction);
  }

  async createSanction(params: CreateSanctionParams): Promise<UserSanctionEntity> {
    const res = await this.pool.query<SanctionRow>(
      `INSERT INTO user_sanctions (user_id, sanction_type, source_action_id, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, sanction_type, source_action_id, starts_at, ends_at, revoked_at`,
      [
        params.userId,
        params.sanctionType,
        params.sourceActionId,
        params.startsAt || new Date(),
        params.endsAt || null,
      ],
    );
    return mapSanction(res.rows[0]);
  }

  async findSanctionById(sanctionId: string): Promise<UserSanctionEntity | null> {
    const res = await this.pool.query<SanctionRow>(
      `SELECT id, user_id, sanction_type, source_action_id, starts_at, ends_at, revoked_at
       FROM user_sanctions
       WHERE id = $1`,
      [sanctionId],
    );
    return res.rows[0] ? mapSanction(res.rows[0]) : null;
  }

  async findActiveSanctionsForUser(
    userId: string,
    sanctionType?: SanctionType,
  ): Promise<UserSanctionEntity[]> {
    const values: unknown[] = [userId];
    let typeClause = "";

    if (sanctionType) {
      values.push(sanctionType);
      typeClause = `AND sanction_type = $${values.length}`;
    }

    const query = `
      SELECT id, user_id, sanction_type, source_action_id, starts_at, ends_at, revoked_at
      FROM user_sanctions
      WHERE user_id = $1
        AND revoked_at IS NULL
        AND starts_at <= NOW()
        AND (ends_at IS NULL OR ends_at > NOW())
        ${typeClause}
      ORDER BY starts_at DESC
    `;

    const res = await this.pool.query<SanctionRow>(query, values);
    return res.rows.map(mapSanction);
  }

  async revokeSanction(
    sanctionId: string,
    revokedAt: Date,
  ): Promise<UserSanctionEntity | null> {
    const res = await this.pool.query<SanctionRow>(
      `UPDATE user_sanctions
       SET revoked_at = $2
       WHERE id = $1
       RETURNING id, user_id, sanction_type, source_action_id, starts_at, ends_at, revoked_at`,
      [sanctionId, revokedAt],
    );
    return res.rows[0] ? mapSanction(res.rows[0]) : null;
  }

  async softDeleteMessage(messageId: string): Promise<void> {
    await this.pool.query(
      `UPDATE messages SET deleted_at = NOW() WHERE id = $1`,
      [messageId],
    );
  }

  async softDeleteStory(storyId: string): Promise<void> {
    await this.pool.query(
      `UPDATE stories SET deleted_at = NOW() WHERE id = $1`,
      [storyId],
    );
  }

  async softDeleteMedia(mediaId: string): Promise<void> {
    await this.pool.query(
      `UPDATE media SET status = 'deleted', deleted_at = NOW() WHERE id = $1`,
      [mediaId],
    );
  }
}
