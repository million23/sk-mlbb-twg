import { useTheme } from "@/components/theme-provider";
import { useResolvedTheme } from "@/hooks/use-resolved-theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Check, Monitor, Moon, Sun } from "lucide-react";

type PublicThemeToggleProps = {
  className?: string;
};

export function PublicThemeToggle({ className }: PublicThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const resolved = useResolvedTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={cn(
              "shrink-0 border-border/80 bg-background/80 backdrop-blur-sm",
              className,
            )}
            aria-label="Choose color theme"
          >
            {resolved === "dark" ? (
              <Moon className="size-4" aria-hidden />
            ) : (
              <Sun className="size-4" aria-hidden />
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="size-4" aria-hidden />
            Light
            <Check
              className={cn(
                "ml-auto size-4",
                theme === "light" ? "opacity-100" : "opacity-0",
              )}
              aria-hidden
            />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="size-4" aria-hidden />
            Dark
            <Check
              className={cn(
                "ml-auto size-4",
                theme === "dark" ? "opacity-100" : "opacity-0",
              )}
              aria-hidden
            />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <Monitor className="size-4" aria-hidden />
            System
            <Check
              className={cn(
                "ml-auto size-4",
                theme === "system" ? "opacity-100" : "opacity-0",
              )}
              aria-hidden
            />
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
