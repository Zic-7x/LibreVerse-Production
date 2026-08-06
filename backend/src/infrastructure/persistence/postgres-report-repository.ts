import type pg from "pg";
import type {
  ReportStatus,
  ReportSubject,
  ReportSubjectType,
} from "@platform/shared-types";
import type {
  CreateReportParams,
  ReportRepository,
  SubjectValidationResult,
} from "../../application/interfaces/report.js";
import type { ReportEntity } from "../../domain/entities/report-entities.js";

interface ReportRow {
  id: string;
  reporter_user_id: string;
  reason_code: string;
  description: string | null;
  status: ReportStatus;
  created_at: Date;
  updated_at: Date;
  resolved_at: Date | null;
}

interface SubjectRow {
  report_id: string;
  subject_type: ReportSubjectType;
  subject_id: string;
}

export class PostgresReportRepository implements ReportRepository {
  constructor(private readonly pool: pg.Pool) {}

  async createReport(params: CreateReportParams): Promise<ReportEntity> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const reportRes = await client.query<ReportRow>(
        `INSERT INTO reports (reporter_user_id, reason_code, description, status)
         VALUES ($1, $2, $3, 'open')
         RETURNING id, reporter_user_id, reason_code, description, status, created_at, updated_at, resolved_at`,
        [
          params.reporterUserId,
          params.reasonCode,
          params.description || null,
        ],
      );

      const reportRow = reportRes.rows[0];

      for (const s of params.subjects) {
        await client.query(
          `INSERT INTO report_subjects (report_id, subject_type, subject_id)
           VALUES ($1, $2, $3)`,
          [reportRow.id, s.subjectType, s.subjectId],
        );
        await client.query(
          `INSERT INTO moderation_cases (report_id, subject_type, subject_id, status)
           VALUES ($1, $2, $3, 'open')`,
          [reportRow.id, s.subjectType, s.subjectId],
        );
      }

      await client.query("COMMIT");

      return {
        id: reportRow.id,
        reporterUserId: reportRow.reporter_user_id,
        reasonCode: reportRow.reason_code,
        description: reportRow.description,
        status: reportRow.status,
        subjects: params.subjects,
        createdAt: reportRow.created_at,
        updatedAt: reportRow.updated_at,
        resolvedAt: reportRow.resolved_at,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<ReportEntity | null> {
    const reportRes = await this.pool.query<ReportRow>(
      `SELECT id, reporter_user_id, reason_code, description, status, created_at, updated_at, resolved_at
       FROM reports
       WHERE id = $1`,
      [id],
    );

    if (reportRes.rows.length === 0) {
      return null;
    }

    const row = reportRes.rows[0];

    const subjectsRes = await this.pool.query<SubjectRow>(
      `SELECT subject_type, subject_id
       FROM report_subjects
       WHERE report_id = $1`,
      [id],
    );

    const subjects: ReportSubject[] = subjectsRes.rows.map((s) => ({
      subjectType: s.subject_type,
      subjectId: s.subject_id,
    }));

    return {
      id: row.id,
      reporterUserId: row.reporter_user_id,
      reasonCode: row.reason_code,
      description: row.description,
      status: row.status,
      subjects,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedAt: row.resolved_at,
    };
  }

  async findByReporter(reporterUserId: string): Promise<ReportEntity[]> {
    const reportsRes = await this.pool.query<ReportRow>(
      `SELECT id, reporter_user_id, reason_code, description, status, created_at, updated_at, resolved_at
       FROM reports
       WHERE reporter_user_id = $1
       ORDER BY created_at DESC`,
      [reporterUserId],
    );

    if (reportsRes.rows.length === 0) {
      return [];
    }

    const reportIds = reportsRes.rows.map((r) => r.id);

    const subjectsRes = await this.pool.query<SubjectRow>(
      `SELECT report_id, subject_type, subject_id
       FROM report_subjects
       WHERE report_id = ANY($1::uuid[])`,
      [reportIds],
    );

    const subjectsByReportId = new Map<string, ReportSubject[]>();
    for (const s of subjectsRes.rows) {
      const list = subjectsByReportId.get(s.report_id) || [];
      list.push({
        subjectType: s.subject_type,
        subjectId: s.subject_id,
      });
      subjectsByReportId.set(s.report_id, list);
    }

    return reportsRes.rows.map((row) => ({
      id: row.id,
      reporterUserId: row.reporter_user_id,
      reasonCode: row.reason_code,
      description: row.description,
      status: row.status,
      subjects: subjectsByReportId.get(row.id) || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedAt: row.resolved_at,
    }));
  }

  async findActiveDuplicate(
    reporterUserId: string,
    reasonCode: string,
    subjects: ReportSubject[],
  ): Promise<ReportEntity | null> {
    if (subjects.length === 0) return null;

    // Check open or under_review reports by reporter with same reason_code
    const reportsRes = await this.pool.query<ReportRow>(
      `SELECT id, reporter_user_id, reason_code, description, status, created_at, updated_at, resolved_at
       FROM reports
       WHERE reporter_user_id = $1 AND reason_code = $2 AND status IN ('open', 'under_review')`,
      [reporterUserId, reasonCode],
    );

    for (const r of reportsRes.rows) {
      const existingSubjectsRes = await this.pool.query<SubjectRow>(
        `SELECT subject_type, subject_id
         FROM report_subjects
         WHERE report_id = $1`,
        [r.id],
      );

      const existingSubjects = existingSubjectsRes.rows;
      if (existingSubjects.length !== subjects.length) continue;

      const isMatch = subjects.every((s) =>
        existingSubjects.some(
          (es) => es.subject_type === s.subjectType && es.subject_id === s.subjectId,
        ),
      );

      if (isMatch) {
        return {
          id: r.id,
          reporterUserId: r.reporter_user_id,
          reasonCode: r.reason_code,
          description: r.description,
          status: r.status,
          subjects: existingSubjects.map((es) => ({
            subjectType: es.subject_type,
            subjectId: es.subject_id,
          })),
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          resolvedAt: r.resolved_at,
        };
      }
    }

    return null;
  }

  async validateSubjectExists(
    subjectType: ReportSubjectType,
    subjectId: string,
  ): Promise<SubjectValidationResult> {
    switch (subjectType) {
      case "user": {
        const res = await this.pool.query<{ id: string }>(
          `SELECT id FROM users WHERE id = $1`,
          [subjectId],
        );
        if (res.rows.length === 0) return { exists: false };
        return { exists: true, ownerUserId: res.rows[0].id };
      }
      case "message": {
        const res = await this.pool.query<{
          id: string;
          sender_user_id: string;
          conversation_id: string;
        }>(
          `SELECT id, sender_user_id, conversation_id FROM messages WHERE id = $1 AND deleted_at IS NULL`,
          [subjectId],
        );
        if (res.rows.length === 0) return { exists: false };
        return {
          exists: true,
          ownerUserId: res.rows[0].sender_user_id,
          conversationId: res.rows[0].conversation_id,
        };
      }
      case "community": {
        const res = await this.pool.query<{ id: string; owner_user_id: string }>(
          `SELECT id, owner_user_id FROM communities WHERE id = $1 AND archived_at IS NULL`,
          [subjectId],
        );
        if (res.rows.length === 0) return { exists: false };
        return { exists: true, ownerUserId: res.rows[0].owner_user_id };
      }
      case "story": {
        const res = await this.pool.query<{ id: string; author_user_id: string }>(
          `SELECT id, author_user_id FROM stories WHERE id = $1 AND deleted_at IS NULL`,
          [subjectId],
        );
        if (res.rows.length === 0) return { exists: false };
        return { exists: true, ownerUserId: res.rows[0].author_user_id };
      }
      case "media": {
        const res = await this.pool.query<{ id: string; uploader_user_id: string }>(
          `SELECT id, uploader_user_id FROM media WHERE id = $1 AND deleted_at IS NULL`,
          [subjectId],
        );
        if (res.rows.length === 0) return { exists: false };
        return { exists: true, ownerUserId: res.rows[0].uploader_user_id };
      }
      default:
        return { exists: false };
    }
  }

  async isConversationParticipant(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const res = await this.pool.query(
      `SELECT 1 FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [conversationId, userId],
    );
    return res.rows.length > 0;
  }

  async getReportCountInWindow(
    reporterUserId: string,
    windowMinutes: number,
  ): Promise<number> {
    const res = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM reports
       WHERE reporter_user_id = $1 AND created_at >= NOW() - ($2 || ' minutes')::INTERVAL`,
      [reporterUserId, windowMinutes],
    );
    return parseInt(res.rows[0]?.count || "0", 10);
  }
}
