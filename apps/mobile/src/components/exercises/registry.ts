import type { ExerciseTypeId } from './types';

// Adding a 6th exercise type is: one new item component + one entry here +
// one data-building branch on the screen that uses it (currently
// exercises.tsx). Nothing else needs to change.
export const EXERCISE_TYPES: { id: ExerciseTypeId; label: string }[] = [
  { id: 'answer', label: 'Answer the following' },
  { id: 'fillblank', label: 'Fill in the blanks' },
  { id: 'match', label: 'Match the following' },
  { id: 'truefalse', label: 'True or False' },
  { id: 'reasons', label: 'Give reasons' },
];
