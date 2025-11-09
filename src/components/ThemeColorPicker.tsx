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
      <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
          Pilih Tema Warna
        </div>
        <div className="grid grid-cols-2 gap-1 p-1">
          {Object.values(colorThemes).map((theme) => (
            <DropdownMenuItem
              key={theme.name}
              onClick={() => handleThemeChange(theme.name)}
              className={`flex flex-col items-center gap-2 cursor-pointer p-3 rounded-md transition-all ${
                currentTheme === theme.name 
                  ? "bg-primary/10 ring-2 ring-primary ring-offset-2 ring-offset-background" 
                  : "hover:bg-accent"
              }`}
            >
              <span className="text-2xl">{theme.icon}</span>
              <span className="text-xs font-medium text-center">{theme.label}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
