// Item shapes for each exercise-type component. Deliberately plain data —
// no `Segment`/schema types leak in here — so these components can be
// reused later by a from-scratch assessment page whose content doesn't
// come from a chapter's source JSON at all (see docs/roadmap.md #4).

export type ExerciseTypeId = 'answer' | 'fillblank' | 'match' | 'truefalse' | 'reasons';

export type AnswerItem = {
  id: string;
  group?: string;
  question: string;
  questionTransliteration?: string;
  questionTranslation?: string;
  answer: string;
  answerTransliteration?: string;
  answerTranslation?: string;
};

export type FillBlankItem = {
  id: string;
  before: string;
  after: string;
  transliteration?: string;
  translation?: string;
  answer: string;
};

export type MatchItem = {
  id: string;
  term: string;
  definition: string;
  transliteration?: string;
  translation?: string;
};

export type TrueFalseItem = {
  id: string;
  statement: string;
  transliteration?: string;
  translation?: string;
  answer: boolean;
};

export type ReasonsItem = {
  id: string;
  question: string;
  questionTransliteration?: string;
  questionTranslation?: string;
  reason: string;
  reasonTransliteration?: string;
  reasonTranslation?: string;
};
