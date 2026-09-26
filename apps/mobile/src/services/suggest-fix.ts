import { Linking } from 'react-native';

import { recordSuggestFixEvent } from '@/services/suggest-fix-metrics';

/** GitHub issues/new for the public content repo — no app-held write credentials. */
export const SUGGEST_FIX_REPO = 'itzsrikanth/akshar';

export type SuggestLayer = 'translation' | 'source' | 'gloss' | 'other';

export type SuggestFixContext = {
  chapterPath?: string;
  bookId?: string;
  editionId?: string;
  chapterId?: string;
  segmentId?: string;
  contentHash?: string;
  sourceText: string;
  translationLanguage?: string | null;
  translationText?: string;
  transliterationScript?: string | null;
  transliterationText?: string;
};

export type SuggestFixPayload = SuggestFixContext & {
  layer: SuggestLayer;
  /** Gloss: surface form the reader tapped or typed. */
  selectedForm?: string;
  lemma?: string;
  currentGloss?: string;
  glossLanguage?: string | null;
  /** Proposed replacement; empty means flag-only. */
  proposedText?: string;
  note?: string;
};

const MAX_FIELD_CHARS = 1200;
const MAX_URL_CHARS = 7000;

function truncate(value: string | undefined | null, max = MAX_FIELD_CHARS): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function layerLabel(layer: SuggestLayer): string {
  switch (layer) {
    case 'translation':
      return 'translation';
    case 'source':
      return 'source text';
    case 'gloss':
      return 'word meaning';
    case 'other':
      return 'other';
  }
}

function identityLines(payload: SuggestFixPayload): string[] {
  const lines: string[] = [];
  if (payload.bookId && payload.editionId && payload.chapterId) {
    lines.push(`- bookId: \`${payload.bookId}\``);
    lines.push(`- editionId: \`${payload.editionId}\``);
    lines.push(`- chapterId: \`${payload.chapterId}\``);
  }
  if (payload.chapterPath) {
    lines.push(`- chapterPath: \`${payload.chapterPath}\``);
  }
  if (payload.segmentId) {
    lines.push(`- segmentId: \`${payload.segmentId}\``);
  }
  if (payload.contentHash) {
    lines.push(`- contentHash: \`${payload.contentHash}\``);
  }
  return lines;
}

function currentLayerBlock(payload: SuggestFixPayload): string {
  switch (payload.layer) {
    case 'translation': {
      const lang = payload.translationLanguage ?? '(preferred language unset)';
      return [
        `### Current translation (\`${lang}\`)`,
        '',
        '```',
        truncate(payload.translationText) || '(missing)',
        '```',
      ].join('\n');
    }
    case 'source':
      return ['### Current source text', '', '```', truncate(payload.sourceText) || '(empty)', '```'].join('\n');
    case 'gloss':
      return [
        '### Current word meaning',
        '',
        `- selectedForm: \`${truncate(payload.selectedForm, 200) || '(none)'}\``,
        `- lemma: \`${truncate(payload.lemma, 200) || '(none)'}\``,
        `- gloss language: \`${payload.glossLanguage ?? payload.translationLanguage ?? '(unset)'}\``,
        '',
        '```',
        truncate(payload.currentGloss) || '(missing / unavailable)',
        '```',
      ].join('\n');
    case 'other':
      return [
        '### Context (for reviewers)',
        '',
        `- source: \`${truncate(payload.sourceText, 400)}\``,
        `- translation (\`${payload.translationLanguage ?? '?'}\`): \`${truncate(payload.translationText, 400)}\``,
        `- transliteration (\`${payload.transliterationScript ?? '?'}\`): \`${truncate(payload.transliterationText, 400)}\``,
      ].join('\n');
  }
}

/** Build a GitHub issues/new URL with title + body prefilled for maintainer triage. */
export function buildSuggestFixIssueUrl(payload: SuggestFixPayload): string {
  const layer = layerLabel(payload.layer);
  const where =
    payload.segmentId ??
    payload.chapterId ??
    payload.chapterPath?.split('/').pop() ??
    'chapter';
  const title = `[content] Suggest fix: ${layer} — ${where}`;

  const bodyParts = [
    '## Suggest a fix (from Akshar app)',
    '',
    `**Layer:** ${layer}`,
    '',
    '### Identity',
    ...identityLines(payload),
    '',
    currentLayerBlock(payload),
    '',
    '### Proposed text',
    '',
    '```',
    truncate(payload.proposedText) || '(flag only — no replacement provided)',
    '```',
    '',
    '### Note from reader',
    '',
    truncate(payload.note) || '(none)',
    '',
    '---',
    '',
    '_Submitted via in-app Suggest a fix (Stage 1 → GitHub issue). Do not auto-merge; validate and open a PR._',
  ];

  let body = bodyParts.join('\n');
  const base = `https://github.com/${SUGGEST_FIX_REPO}/issues/new`;
  let url = `${base}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;

  // Keep under common URL length limits by shrinking free-text fields first.
  if (url.length > MAX_URL_CHARS) {
    const shortPayload: SuggestFixPayload = {
      ...payload,
      proposedText: truncate(payload.proposedText, 400),
      note: truncate(payload.note, 400),
      sourceText: truncate(payload.sourceText, 400),
      translationText: truncate(payload.translationText, 400),
      transliterationText: truncate(payload.transliterationText, 400),
      currentGloss: truncate(payload.currentGloss, 400),
    };
    const shortBody = [
      '## Suggest a fix (from Akshar app)',
      '',
      `**Layer:** ${layer}`,
      '',
      '### Identity',
      ...identityLines(shortPayload),
      '',
      currentLayerBlock(shortPayload),
      '',
      '### Proposed text',
      '',
      '```',
      truncate(shortPayload.proposedText, 400) || '(flag only)',
      '```',
      '',
      '### Note',
      '',
      truncate(shortPayload.note, 400) || '(none)',
      '',
      '_Body truncated for URL length._',
    ].join('\n');
    url = `${base}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(shortBody)}`;
  }

  return url;
}

export async function openSuggestFixIssue(payload: SuggestFixPayload): Promise<void> {
  const url = buildSuggestFixIssueUrl(payload);
  recordSuggestFixEvent({ type: 'github_opened', layer: payload.layer });
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error('Could not open GitHub in a browser');
  }
  await Linking.openURL(url);
}
