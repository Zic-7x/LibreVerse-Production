import type { ReportSubjectType } from "@platform/shared-types";

export interface SubjectPreviewData {
  subjectType: ReportSubjectType;
  subjectId: string;
  title?: string;
  contentSnippet?: string;
  authorOrOwnerId?: string;
  mediaUrl?: string;
  flaggedAt?: string;
}

export class SubjectPreviewComponent {
  renderPreview(data: SubjectPreviewData): {
    headline: string;
    body: string;
    badge: string;
    metadata: Record<string, string>;
  } {
    const badge = `[Subject: ${data.subjectType.toUpperCase()}]`;
    const headline = data.title || `Reported ${data.subjectType} #${data.subjectId}`;
    const body = data.contentSnippet || "No preview snippet available for this item.";
    const metadata: Record<string, string> = {
      SubjectID: data.subjectId,
      Type: data.subjectType,
      ...(data.authorOrOwnerId ? { AuthorID: data.authorOrOwnerId } : {}),
      ...(data.flaggedAt ? { FlaggedAt: data.flaggedAt } : {}),
    };

    return { headline, body, badge, metadata };
  }
}
