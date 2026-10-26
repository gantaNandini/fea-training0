import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import type { CategoryDTO } from '@/lib/types'

/**
 * Category tree with computed course counts (PUBLISHED + UPCOMING courses). Tag: `categories`.
 * A parent's count includes its children; a course in two categories counts once per category.
 */
export const getCategoryTree = unstable_cache(
  async (): Promise<CategoryDTO[]> => {
    const [cats, links] = await Promise.all([
      db.category.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] }),
      db.courseCategory.findMany({
        where: { course: { status: { in: ['PUBLISHED', 'UPCOMING'] } } },
        select: { categoryId: true, courseId: true },
      }),
    ])
    const coursesByCat = new Map<string, Set<string>>()
    for (const l of links) {
      if (!coursesByCat.has(l.categoryId)) coursesByCat.set(l.categoryId, new Set())
      coursesByCat.get(l.categoryId)!.add(l.courseId)
    }
    const nodes = new Map<string, CategoryDTO>()
    for (const c of cats) {
      nodes.set(c.id, {
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        parentId: c.parentId,
        order: c.order,
        courseCount: coursesByCat.get(c.id)?.size ?? 0,
        children: [],
      })
    }
    const roots: CategoryDTO[] = []
    for (const n of nodes.values()) {
      const parent = n.parentId ? nodes.get(n.parentId) : undefined
      if (parent) parent.children.push(n)
      else roots.push(n)
    }
    // parent counts = distinct courses across the parent and its children
    for (const root of roots) {
      if (root.children.length === 0) continue
      const all = new Set<string>(coursesByCat.get(root.id) ?? [])
      for (const ch of root.children) for (const id of coursesByCat.get(ch.id) ?? []) all.add(id)
      root.courseCount = all.size
    }
    return roots
  },
  ['category-tree'],
  { tags: ['categories', 'courses'], revalidate: 3600 },
)

export async function getCategories(): Promise<CategoryDTO[]> {
  return getCategoryTree()
}

/** Parents that have at least one course (REQ-069). */
export async function getCategoriesWithCourses(): Promise<CategoryDTO[]> {
  const tree = await getCategoryTree()
  return tree.filter((c) => c.courseCount > 0)
}

export async function getCategoryBySlug(slug: string): Promise<CategoryDTO | null> {
  const tree = await getCategoryTree()
  for (const root of tree) {
    if (root.slug === slug) return root
    const child = root.children.find((c) => c.slug === slug)
    if (child) return child
  }
  return null
}
