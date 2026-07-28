import { PublicGovLogos } from "@/components/public/public-gov-logos";
import { Link } from "@tanstack/react-router";

type PublicFooterProps = {
  siteTitle: string;
};

export function PublicFooter({ siteTitle }: PublicFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-auto border-t border-border/60 bg-background/50 py-8 text-muted-foreground text-xs sm:py-10 sm:text-sm">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 text-center sm:px-6">
        <PublicGovLogos />

        <div className="flex flex-col gap-3">
          <p className="text-pretty">
            © {year} {siteTitle}.
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
