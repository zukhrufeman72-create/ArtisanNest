import Image from "next/image"

type BrandLogoProps = {
  className?: string
  imageClassName?: string
  compact?: boolean
  dark?: boolean
  subtitle?: string
  priority?: boolean
}

export default function BrandLogo({
  className = "",
  imageClassName = "",
  compact = false,
  dark = false,
  subtitle = "Handmade Craft Store",
  priority = false,
}: BrandLogoProps) {
  if (!compact) {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <Image
          src="/images/artisan-nest-logo-clean.png"
          alt="ArtisanNest Handmade Craft Store"
          width={2074}
          height={447}
          priority={priority}
          className={`h-auto w-full object-contain ${imageClassName}`}
        />
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/images/artisan-nest-mark.png"
        alt=""
        width={512}
        height={512}
        priority={priority}
        className={`shrink-0 object-contain ${imageClassName || "size-10"}`}
      />
      <span className="min-w-0">
        <span
          className={`block font-serif text-[15px] font-bold leading-tight ${
            dark ? "text-white" : "text-[#2D1F1A]"
          }`}
        >
          ArtisanNest
        </span>
        <span
          className={`block text-[9px] uppercase tracking-[0.16em] ${
            dark ? "text-[#D39A7B]" : "text-[#9E8079]"
          }`}
        >
          {subtitle}
        </span>
      </span>
    </span>
  )
}
