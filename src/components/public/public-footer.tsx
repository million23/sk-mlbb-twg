type PublicFooterProps = {
  siteTitle: string;
};

export function PublicFooter({ siteTitle }: PublicFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-auto border-t border-border/60 bg-background/50 py-6 text-muted-foreground text-xs sm:py-8 sm:text-sm">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 space-y-3">
        <p className="text-pretty">
          © {year} {siteTitle}. Public information only.
        </p>
        <p className="text-pretty">
          Made with ❤️ by <a href="https://geraldchavez.xyz/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Gerald Chavez</a>
        </p>
      </div>
    </footer>
  );
}
