import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { sanitizeRichText } from '@/lib/utils/sanitize'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { buildMetadata } from '@/lib/utils/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Trainee Details',
  description: 'Meet the trainer behind the Pythagoras programmes.',
  path: '/about/trainee-details',
})
export const revalidate = 300

/**
 * Trainee Details tab (MoM item 3, R3).
 * Data comes from the InstructorProfile rows that also power /instructors/[id].
 * Edit trainer details in Admin → Profile (LinkedIn/Facebook/YouTube are saved to SiteSettings
 * as social_linkedin / social_facebook / social_youtube until the schema migration is applied).
 *
 * NOTE: socialFacebook and socialYoutube fields require the DB migration in STEP 4 to exist on
 * InstructorProfile. Until then those fields will be undefined and the links will be omitted.
 */
export default async function TraineeDetailsPage() {
  const trainers = await db.user.findMany({
    where: { role: 'INSTRUCTOR' },
    select: {
      id: true,
      name: true,
      image: true,
      instructorProfile: {
        select: {
          title: true,
          bio: true,
          socialLinkedIn: true,
          socialTwitter: true,
          socialWebsite: true,
          // socialFacebook and socialYoutube added in migration 20261118_trainee_footer
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-3xl">Trainee Details</h1>
        <p className="mt-2 text-muted-foreground">Meet the trainer behind the programmes.</p>
      </header>

      {trainers.map((t) => {
        const ip = t.instructorProfile
        // Cast to allow optional fields added by migration (graceful if not yet applied)
        const fb = (ip as { socialFacebook?: string | null } | null)?.socialFacebook
        const yt = (ip as { socialYoutube?: string | null } | null)?.socialYoutube
        const bioHtml = ip?.bio ? sanitizeRichText(ip.bio) : null

        return (
          <article
            key={t.id}
            className="grid gap-8 md:grid-cols-[220px_1fr]"
            aria-labelledby={`trainer-${t.id}`}
          >
            <div>
              <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted">
                <PlaceholderArt
                  src={t.image}
                  alt={t.name ?? 'Trainer'}
                  fill
                  sizes="220px"
                  className="object-cover"
                />
              </div>
            </div>
            <div>
              <h2 id={`trainer-${t.id}`} className="text-2xl">{t.name}</h2>
              {ip?.title && <p className="mt-1 text-muted-foreground">{ip.title}</p>}

              <ul className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                {ip?.socialLinkedIn && (
                  <li>
                    <a className="text-link hover:underline" href={ip.socialLinkedIn} target="_blank" rel="noopener noreferrer">
                      LinkedIn
                    </a>
                  </li>
                )}
                {fb && (
                  <li>
                    <a className="text-link hover:underline" href={fb} target="_blank" rel="noopener noreferrer">
                      Facebook
                    </a>
                  </li>
                )}
                {yt && (
                  <li>
                    <a className="text-link hover:underline" href={yt} target="_blank" rel="noopener noreferrer">
                      YouTube
                    </a>
                  </li>
                )}
                {ip?.socialWebsite && (
                  <li>
                    <a className="text-link hover:underline" href={ip.socialWebsite} target="_blank" rel="noopener noreferrer">
                      Website
                    </a>
                  </li>
                )}
              </ul>

              {bioHtml ? (
                <div
                  className="prose-content mt-6 max-w-none"
                  dangerouslySetInnerHTML={{ __html: bioHtml }}
                />
              ) : null}
            </div>
          </article>
        )
      })}

      {trainers.length === 0 && (
        <p className="text-muted-foreground">Trainer details will be added soon.</p>
      )}
    </div>
  )
}
