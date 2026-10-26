import type { CategoryDTO } from '@/lib/types'
import { Logo } from './Logo'
import { MegaMenu } from './MegaMenu'
import { SearchBar } from './SearchBar'
import { MobileDrawer } from './MobileDrawer'
import { MobileSearch } from './MobileSearch'
import { CompareLink } from './CompareLink'
import { AuthControls } from './AuthControls'
import { MiniCart } from '@/components/cart/MiniCart'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

/**
 * Server component shell (REQ-032): never reads cookies or calls auth(), so every page using it
 * stays static/ISR. The interactive bits are client islands fed by /api/me/state.
 */
export function Header({ categories, companyName }: { categories: CategoryDTO[]; companyName: string }) {
  return (
    <header className="site-header sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="container-page flex h-16 items-center gap-2 lg:gap-4">
        {/* < 1024: hamburger, logo, search icon, cart */}
        <MobileDrawer categories={categories} companyName={companyName} />
        <Logo name={companyName} />
        <div className="hidden lg:block">
          <MegaMenu categories={categories} />
        </div>
        <div className="hidden max-w-md flex-1 lg:block">
          <SearchBar />
        </div>
        <div className="ml-auto flex items-center gap-1 lg:gap-2">
          <MobileSearch />
          <CompareLink />
          <MiniCart />
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
          <div className="hidden lg:block">
            <AuthControls />
          </div>
        </div>
      </div>
    </header>
  )
}
