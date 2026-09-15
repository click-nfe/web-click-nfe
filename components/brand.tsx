import Image from "next/image";
import Link from "next/link";

type BrandProps = {
  compact?: boolean;
  href?: string;
};

export function Brand({ compact = false, href = "/" }: BrandProps) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2.5"
      aria-label="Click NFe — página inicial"
    >
      <span className="grid size-10 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-black/8 dark:ring-white/10">
        <Image
          src="/click-nfe-logo.webp"
          alt=""
          width={40}
          height={40}
          className="size-10 object-cover"
          priority
        />
      </span>
      {!compact && (
        <span className="font-display text-2xl font-semibold tracking-[-0.035em]">
          click nfe
        </span>
      )}
    </Link>
  );
}
