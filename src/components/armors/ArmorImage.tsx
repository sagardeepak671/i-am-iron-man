import Image from "next/image";
import type { Armor } from "@/data/archive";
import { HudFrame } from "@/components/ui/HudFrame";

type Props = {
  armor: Pick<Armor, "designation" | "alias" | "markNumber" | "image">;
  /** `card` for list tiles, `hero` for the detail page header. */
  variant?: "card" | "hero";
  priority?: boolean;
};

/**
 * Renders the armor's image when a sourced one is on file, otherwise a
 * designed placeholder so layouts never collapse and nothing is implied.
 */
export function ArmorImage({ armor, variant = "card", priority = false }: Props) {
  const hero = variant === "hero";
  const frame = hero
    ? "aspect-[4/3] md:aspect-[5/4]"
    : "aspect-[4/3]";

  if (armor.image) {
    return (
      <figure className={`relative overflow-hidden rounded-2xl border border-white/8 bg-black/40 ${frame}`}>
        <Image
          src={armor.image.src}
          alt={armor.image.alt}
          width={armor.image.width}
          height={armor.image.height}
          priority={priority}
          className="h-full w-full object-cover"
          sizes={hero ? "(min-width: 768px) 45vw, 100vw" : "(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"}
        />
        <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-300">
          <span>{armor.image.kind.replace("-", " ")}</span>
          <span className="truncate">{armor.image.credit}</span>
        </figcaption>
      </figure>
    );
  }

  return (
    <div
      role="img"
      aria-label={`${armor.designation}: no sourced image on file`}
      className={`hud-tick relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] ${frame}`}
    >
      <span className="pointer-events-none absolute left-3 top-3 text-accent/60">
        <HudFrame corner="tl" size={hero ? 26 : 18} />
      </span>
      <span className="pointer-events-none absolute right-3 top-3 text-accent/60">
        <HudFrame corner="tr" size={hero ? 26 : 18} />
      </span>
      <span className="pointer-events-none absolute bottom-3 left-3 text-accent/60">
        <HudFrame corner="bl" size={hero ? 26 : 18} />
      </span>
      <span className="pointer-events-none absolute bottom-3 right-3 text-accent/60">
        <HudFrame corner="br" size={hero ? 26 : 18} />
      </span>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 50%, rgba(212,162,47,0.10) 0%, transparent 70%)",
        }}
      />
      <span
        aria-hidden
        className={`font-sans font-semibold tracking-tighter text-foreground/90 ${
          hero ? "text-7xl md:text-8xl" : "text-5xl"
        }`}
      >
        {armor.designation.replace(/^Mark\s+/i, "")}
      </span>
      <span
        aria-hidden
        className={`mt-2 font-mono uppercase tracking-[0.3em] text-zinc-500 ${
          hero ? "text-[11px]" : "text-[9px]"
        }`}
      >
        Mark {armor.markNumber}
        {armor.alias ? ` · ${armor.alias}` : ""}
      </span>
      <span
        aria-hidden
        className={`absolute bottom-4 font-mono uppercase tracking-[0.24em] text-zinc-600 ${
          hero ? "text-[10px]" : "text-[8px]"
        }`}
      >
        No sourced image on file
      </span>
    </div>
  );
}
