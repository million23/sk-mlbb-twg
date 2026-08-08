import { PUBLIC_GOV_LOGOS } from "@/lib/public-site";
import { cn } from "@/lib/utils";

type PublicGovLogosProps = {
  className?: string;
  /** Tailwind size classes for each mark. */
  sizeClassName?: string;
  align?: "start" | "center";
};

export function PublicGovLogos({
  className,
  sizeClassName = "size-14 sm:size-16",
  align = "center",
}: PublicGovLogosProps) {
  return (
    <ul
      className={cn(
        "m-0 flex list-none flex-wrap items-center gap-3 p-0 sm:gap-4",
        align === "center" ? "justify-center" : "justify-start",
        className,
      )}
    >
      {PUBLIC_GOV_LOGOS.map((logo) => {
        const image = (
          <img
            src={logo.src}
            alt={logo.alt}
            width={72}
            height={72}
            className="size-full object-contain object-center"
            loading="lazy"
            decoding="async"
          />
        );

        return (
          <li key={logo.src} className="m-0 p-0">
            {logo.href ? (
              <a
                href={logo.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center justify-center opacity-90 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  sizeClassName,
                )}
                aria-label={`${logo.alt} on Facebook`}
              >
                {image}
              </a>
            ) : (
              <span
                className={cn(
                  "flex items-center justify-center",
                  sizeClassName,
                )}
              >
                {image}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
