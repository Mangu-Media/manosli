import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Github, Instagram, MessageCircle, Twitter } from 'lucide-react'
import Logo from './Logo'
import { cn } from '@/lib/utils'
import { EASE_OUT_EXPO, EASE_IN_OUT_QUART } from '@/lib/motion'
import { getLenis } from '@/lib/scroll'

const NAV_LINKS = [
  { label: 'Experience', to: '/experience' },
  { label: 'Technology', to: '/technology' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Social', to: '/social' },
  { label: 'Spatial', to: '/spatial' },
  { label: 'Ecosystem', to: '/ecosystem' },
]

const SOCIALS = [
  { label: 'X', href: 'https://x.com', Icon: Twitter },
  { label: 'Discord', href: 'https://discord.com', Icon: MessageCircle },
  { label: 'Instagram', href: 'https://instagram.com', Icon: Instagram },
  { label: 'GitHub', href: 'https://github.com', Icon: Github },
]

/** Fixed 76px overlay nav: transparent over hero, blurs after 80px scroll (design.md §8.1) */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(() => window.scrollY > 80)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const lenis = getLenis()
    if (open) {
      document.documentElement.style.overflow = 'hidden'
      lenis?.stop()
    } else {
      document.documentElement.style.overflow = ''
      lenis?.start()
    }
    return () => {
      document.documentElement.style.overflow = ''
      lenis?.start()
    }
  }, [open])

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-[100] transition-all duration-[400ms]',
          scrolled
            ? 'border-b border-line bg-[rgba(6,3,11,0.72)] backdrop-blur-[18px]'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-6 lg:px-12">
          <Link to="/" aria-label="manosli+ — home" className="shrink-0" onClick={() => setOpen(false)}>
            <Logo />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    'group relative py-2 font-sans text-[0.9375rem] font-medium transition-colors duration-300',
                    isActive ? 'text-ghost' : 'text-mist hover:text-ghost',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    <span
                      className={cn(
                        'absolute inset-x-0 bottom-0 h-[2px] origin-left bg-aurora transition-transform duration-300',
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/download"
              className="inline-flex h-11 items-center rounded-full border border-line px-5 font-sans text-sm font-medium text-ghost transition-all duration-300 hover:border-pulse hover:bg-pulse/10"
            >
              Sign in
            </Link>
            <Link
              to="/download"
              className="group relative inline-flex h-11 items-center overflow-hidden rounded-full bg-aurora px-6 font-sans text-sm font-bold text-void transition-all duration-300 hover:shadow-glow-pulse"
            >
              <span className="relative z-10">Get early access</span>
              <span className="pointer-events-none absolute inset-y-0 left-0 w-[60px] -translate-x-full bg-white/25 blur-sm transition-transform duration-[600ms] group-hover:translate-x-[320px]" />
            </Link>
          </div>

          <button
            type="button"
            className="flex h-11 w-11 flex-col items-center justify-center gap-[7px] lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <span className={cn('h-[2px] w-6 bg-ghost transition-all duration-300', open && 'translate-y-[4.5px] rotate-45')} />
            <span className={cn('h-[2px] w-6 bg-ghost transition-all duration-300', open && '-translate-y-[4.5px] -rotate-45')} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            className="fixed inset-0 z-[99] flex flex-col bg-void lg:hidden"
            initial={{ clipPath: 'circle(0% at 100% 0%)' }}
            animate={{ clipPath: 'circle(150% at 100% 0%)' }}
            exit={{ clipPath: 'circle(0% at 100% 0%)' }}
            transition={{ duration: 0.6, ease: EASE_IN_OUT_QUART }}
          >
            <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 animate-blob-drift rounded-full bg-pulse/25 blur-[100px]" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 bottom-1/4 h-64 w-64 animate-blob-drift rounded-full bg-wave/15 blur-[100px]" style={{ animationDelay: '-9s' }} />
            <nav className="flex flex-1 flex-col justify-center gap-2 px-8 pt-[76px]" aria-label="Mobile">
              {[...NAV_LINKS, { label: 'Download', to: '/download' }].map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.15 + i * 0.06, ease: EASE_OUT_EXPO }}
                >
                  <NavLink
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'block py-2 font-display text-[clamp(2rem,7vw,3rem)] font-bold uppercase leading-tight',
                        isActive ? 'text-aurora' : 'text-ghost',
                      )
                    }
                  >
                    {l.label}
                  </NavLink>
                </motion.div>
              ))}
            </nav>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="flex items-center justify-between border-t border-line px-8 py-6"
            >
              <div className="flex gap-5">
                {SOCIALS.map(({ label, href, Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="text-smoke transition-colors duration-300 hover:text-ghost">
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
              <Link to="/download" onClick={() => setOpen(false)} className="inline-flex h-11 items-center rounded-full bg-aurora px-6 font-sans text-sm font-bold text-void">
                Get early access
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
