import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

/**
 * Pythagoras Engineering Consultancy & Services — brand mark.
 * Teal equilateral triangle with three interlocking woven arrow chevrons
 * (clockwise triskelion). Each arm passes over the next arm's body.
 * Brand colour: #2AD4D4. Rotation centre: (100, 115).
 */
export function LogoMark({ className }: { className?: string }) {
  // Outer white shape of each arm (thick angular arrowhead, pointing up)
  const outer = '82,155 78,105 55,68 72,55 94,88 106,88 128,55 145,68 122,105 118,155'
  // Teal inner hollow (carves the arm body open)
  const inner = '89,148 86,108 65,76 72,55 94,88 106,88 128,55 135,76 114,108 111,148'
  // Right leg re-drawn white (woven "passes over" the next arm)
  const overLeg = '106,88 128,55 145,68 122,105 118,155 111,148 114,108 135,76'
  // Teal hollow restored inside that re-drawn leg
  const overLegHollow = '106,88 128,55 135,76 114,108 111,148'

  return (
    <svg viewBox="0 0 200 178" aria-hidden="true" className={cn('h-8 w-auto shrink-0', className)}>
      <defs>
        <clipPath id="lm-tri">
          <polygon points="100,5 195,170 5,170" />
        </clipPath>
      </defs>
      {/* Teal background triangle */}
      <polygon points="100,5 195,170 5,170" fill="#2AD4D4" />
      <g clipPath="url(#lm-tri)">
        {/* Layer 1 — all three arm outlines in white */}
        <polygon fill="white" points={outer} />
        <polygon fill="white" transform="rotate(120,100,115)" points={outer} />
        <polygon fill="white" transform="rotate(240,100,115)" points={outer} />
        {/* Layer 2 — teal hollows carve each arm body */}
        <polygon fill="#2AD4D4" points={inner} />
        <polygon fill="#2AD4D4" transform="rotate(120,100,115)" points={inner} />
        <polygon fill="#2AD4D4" transform="rotate(240,100,115)" points={inner} />
        {/* Layer 3 — right leg re-drawn white (woven over/under effect) */}
        <polygon fill="white" points={overLeg} />
        <polygon fill="white" transform="rotate(120,100,115)" points={overLeg} />
        <polygon fill="white" transform="rotate(240,100,115)" points={overLeg} />
        {/* Layer 4 — restore teal hollow in re-drawn leg */}
        <polygon fill="#2AD4D4" points={overLegHollow} />
        <polygon fill="#2AD4D4" transform="rotate(120,100,115)" points={overLegHollow} />
        <polygon fill="#2AD4D4" transform="rotate(240,100,115)" points={overLegHollow} />
        {/* Central hub */}
        <polygon fill="#2AD4D4" points="94,88 106,88 113,100 100,115 87,100" />
      </g>
    </svg>
  )
}

export function Logo({ name, className, href = '/' }: { name: string; className?: string; href?: string }) {
  return (
    <Link
      href={href}
      aria-label={`${name} — home`}
      className={cn('inline-flex min-h-11 items-center gap-2.5 font-display text-xl font-extrabold tracking-tight', className)}
    >
      <LogoMark />
      <span className="text-plum-800 dark:text-white">{name}</span>
    </Link>
  )
}
