import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { colorThemes, applyColorTheme, getCurrentColorTheme } from "@/utils/colorThemes";
import { useState, useEffect } from "react";

export function ThemeColorPicker() {
  const [currentTheme, setCurrentTheme] = useState(getCurrentColorTheme());

  useEffect(() => {
    // Re-apply theme when dark mode changes
    const observer = new MutationObserver(() => {
      applyColorTheme(currentTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [currentTheme]);

  const handleThemeChange = (themeName: string) => {
    applyColorTheme(themeName);
    setCurrentTheme(themeName);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Pilih warna tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
        {Object.values(colorThemes).map((theme) => (
          <DropdownMenuItem
            key={theme.name}
            onClick={() => handleThemeChange(theme.name)}
            className={`flex items-center gap-3 cursor-pointer ${
              currentTheme === theme.name ? "bg-accent/10" : ""
            }`}
          >
            <span className="text-xl">{theme.icon}</span>
            <span className="flex-1">{theme.label}</span>
            {currentTheme === theme.name && (
              <span className="text-xs text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
