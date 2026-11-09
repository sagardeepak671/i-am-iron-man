import { STATIC_QUESTIONS } from "@/data/quiz";
import { archiveQuestions } from "./quiz-archive";
import type { QuizQuestion } from "./quiz";

/** The full question bank: hand-written questions plus archive-generated ones. */
export function quizBank(): QuizQuestion[] {
  return [...STATIC_QUESTIONS, ...archiveQuestions()];
}
