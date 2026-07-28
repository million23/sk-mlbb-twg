import { PUBLIC_GOV_LOGOS } from "@/lib/public-site";
import { Link } from "@tanstack/react-router";

type PublicFooterProps = {
  siteTitle: string;
};

export function PublicFooter({ siteTitle }: PublicFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-auto border-t border-border/60 bg-background/50 py-8 text-muted-foreground text-xs sm:py-10 sm:text-sm">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 text-center sm:px-6">
        <ul className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {PUBLIC_GOV_LOGOS.map((logo) => {
            const image = (
              <img
                src={logo.src}
                alt={logo.alt}
                width={64}
                height={64}
                className="size-14 object-contain transition-opacity sm:size-16"
                loading="lazy"
                decoding="async"
              />
            );

            return (
              <li key={logo.src}>
                {logo.href ? (
                  <a
                    href={logo.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block opacity-90 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`${logo.alt} on Facebook`}
                  >
                    {image}
                  </a>
                ) : (
                  image
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col gap-3">
          <p className="text-pretty">
            © {year} {siteTitle}. Public information only.
          </p>
          <p className="text-pretty">
            Made with ❤️ by{" "}
            <a
              href="https://geraldchavez.xyz/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              Gerald Chavez
            </a>
          </p>
          <p>
            <Link
              to="/app/auth/login"
              className="text-muted-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
            >
              Admin
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
