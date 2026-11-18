/**
 * Pure sequential-unlock logic (MoM item 7, R7).
 * No DB, no React — the server (API routes, page loaders) and the sidebar both use this,
 * so "what is locked" can never disagree between UI and enforcement.
 *
 * Rules:
 * - Walk lessons in curriculum order (section.order then lesson.order).
 * - A VIDEO lesson is COMPLETE when its video is fully watched AND (has quiz → quiz passed).
 *   A video without a quiz completes on watch alone (no dead-lock for un-authored quizzes).
 * - Every lesson after the first incomplete VIDEO is LOCKED.
 * - DOCUMENT lessons never block progress.
 * - Free-preview lessons are never locked.
 */
export type LessonKind = 'VIDEO' | 'DOCUMENT' | (string & {})

export interface CurriculumLesson {
  id: string
  type: LessonKind
  isFreePreview: boolean
  hasQuiz: boolean
}
export interface CurriculumSection {
  order: number
  lessons: Array<CurriculumLesson & { order: number }>
}
export interface LessonProgressFlags {
  videoCompleted: boolean
  quizPassed: boolean
}
export type LessonState = 'locked' | 'available' | 'video_done' | 'completed'

export interface LessonGate {
  lessonId: string
  state: LessonState
  locked: boolean
  isVideo: boolean
  videoCompleted: boolean
  quizRequired: boolean
  quizPassed: boolean
}

export const PASS_PERCENT_DEFAULT = 80

export function flattenCurriculum(sections: CurriculumSection[]): CurriculumLesson[] {
  return [...sections]
    .sort((a, b) => a.order - b.order)
    .flatMap((s) => [...s.lessons].sort((a, b) => a.order - b.order))
}

export function isLessonComplete(lesson: CurriculumLesson, p: LessonProgressFlags): boolean {
  if (lesson.type !== 'VIDEO') return true
  if (!p.videoCompleted) return false
  return lesson.hasQuiz ? p.quizPassed : true
}

export function computeGates(
  lessons: CurriculumLesson[],
  progress: Record<string, LessonProgressFlags | undefined>,
): LessonGate[] {
  let blocked = false
  return lessons.map((l) => {
    const p = progress[l.id] ?? { videoCompleted: false, quizPassed: false }
    const isVideo = l.type === 'VIDEO'
    const locked = blocked && !l.isFreePreview
    const complete = isLessonComplete(l, p)
    let state: LessonState
    if (locked) state = 'locked'
    else if (!isVideo) state = 'available'
    else if (complete) state = 'completed'
    else if (p.videoCompleted) state = 'video_done' // watched, quiz still to pass
    else state = 'available'
    if (isVideo && !complete) blocked = true
    return {
      lessonId: l.id,
      state,
      locked,
      isVideo,
      videoCompleted: isVideo && p.videoCompleted,
      quizRequired: isVideo && l.hasQuiz,
      quizPassed: isVideo && l.hasQuiz && p.quizPassed,
    }
  })
}

export function summarise(gates: LessonGate[]) {
  const videos = gates.filter((g) => g.isVideo)
  const done = videos.filter((g) => g.state === 'completed').length
  return {
    totalVideos: videos.length,
    completedVideos: done,
    percent: videos.length ? Math.round((done / videos.length) * 100) : 0,
  }
}

/** id of the lesson that comes next after `lessonId`, if any */
export function nextLessonId(lessons: CurriculumLesson[], lessonId: string): string | null {
  const i = lessons.findIndex((l) => l.id === lessonId)
  return i >= 0 && i + 1 < lessons.length ? lessons[i + 1].id : null
}
