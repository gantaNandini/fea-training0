import { Breadcrumb } from './Breadcrumb'

/** Consistent top band for every inner page. */
export function PageHero({ title, subtitle, crumb }: { title: string; subtitle?: string; crumb?: string }) {
  return (
    <div className="border-b border-border bg-surface-alt">
      <div className="container-page anim-fade-up py-10 md:py-14">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: crumb ?? title }]} />
        <h1 className="mt-4 text-3xl font-extrabold md:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  )
}
