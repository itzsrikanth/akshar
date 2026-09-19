/**
 * Split source text into display tokens without breaking Kannada grapheme
 * clusters (letters + combining marks stay together).
 */
export type SourceToken = {
  index: number;
  text: string;
  /** True when the token is a word/number (selectable), not space/punctuation. */
  selectable: boolean;
};

const TOKEN_RE = /(\s+)|([\p{L}\p{M}\p{N}]+)|([^\s\p{L}\p{M}\p{N}]+)/gu;

export function tokenizeSource(text: string): SourceToken[] {
  const tokens: SourceToken[] = [];
  let index = 0;
  for (const match of text.matchAll(TOKEN_RE)) {
    const [, space, word, other] = match;
    const raw = space ?? word ?? other ?? '';
    if (!raw) continue;
    tokens.push({
      index,
      text: raw,
      selectable: Boolean(word),
    });
    index += 1;
  }
  return tokens;
}

/** Strip surrounding punctuation for lexicon lookup; keep letters/marks/digits. */
export function normalizeLookupForm(token: string): string {
  const trimmed = token.trim();
  const core = trimmed.replace(/^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu, '');
  return core || trimmed;
}
