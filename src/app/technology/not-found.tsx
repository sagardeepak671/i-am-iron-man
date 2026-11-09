import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/sections/Footer";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";
import { HudFrame } from "@/components/ui/HudFrame";
import { TECHNOLOGIES } from "@/data/archive";

/** Rendered for any 404 under /technology (unknown slug, malformed URL). */
export default function TechnologyNotFound() {
  return (
    <>
      <Navbar />
      <main id="main">
        <section className="relative overflow-hidden bg-background px-6 pb-24 pt-36 md:px-10 md:pb-32 md:pt-44">
          <div className="pointer-events-none absolute left-6 top-24 text-accent md:left-10 md:top-28">
            <HudFrame corner="tl" size={26} />
          </div>
          <div className="pointer-events-none absolute right-6 top-24 text-accent md:right-10 md:top-28">
            <HudFrame corner="tr" size={26} />
          </div>
          <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
            <EyebrowBadge className="self-start">404 // NO SUCH SYSTEM</EyebrowBadge>
            <h1 className="max-w-[16ch] font-sans text-5xl font-semibold leading-[0.95] tracking-tighter text-foreground md:text-7xl">
              That system is not <span className="text-accent">in the archive.</span>
            </h1>
            <p className="max-w-[52ch] font-sans text-base leading-relaxed text-zinc-400 md:text-lg">
              The archive covers six suit systems. Check the address, or pick one below.
            </p>
            <Link
              href="/technology"
              className="group inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-foreground backdrop-blur-md transition-all duration-200 hover:bg-white/[0.08] active:translate-y-[1px]"
            >
              Back to technology
              <ArrowUpRight size={14} weight="bold" className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <ul className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4 border-t border-white/8 pt-8 sm:grid-cols-3">
              {TECHNOLOGIES.map((t) => (
                <li key={t.id} className="list-none">
                  <Link href={`/technology/${t.id}`} className="group flex flex-col gap-1">
                    <span className="font-sans text-[14px] font-medium text-foreground transition-colors group-hover:text-accent">{t.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">{t.armorIds.length} armors</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
