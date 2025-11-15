// Color theme presets for the application
export interface ColorTheme {
  name: string;
  label: string;
  icon: string;
  colors: {
    light: {
      primary: string;
      primaryHover: string;
      accent: string;
      background: string;
      card: string;
      secondary: string;
      muted: string;
      border: string;
    };
    dark: {
      primary: string;
      primaryHover: string;
      accent: string;
      background: string;
      card: string;
      secondary: string;
      muted: string;
      border: string;
    };
  };
}

export const colorThemes: Record<string, ColorTheme> = {
  ocean: {
    name: "ocean",
    label: "Ocean",
    icon: "🌊",
    colors: {
      light: {
        primary: "199 89% 48%",
        primaryHover: "199 89% 43%",
        accent: "187 85% 53%",
        background: "195 35% 97%",
        card: "195 30% 99%",
        secondary: "199 30% 94%",
        muted: "199 25% 95%",
        border: "199 20% 88%",
      },
      dark: {
        primary: "199 89% 58%",
        primaryHover: "199 89% 53%",
        accent: "187 85% 63%",
        background: "199 40% 8%",
        card: "199 35% 12%",
        secondary: "199 30% 18%",
        muted: "199 25% 20%",
        border: "199 20% 25%",
      },
    },
  },
  forest: {
    name: "forest",
    label: "Forest",
    icon: "🌲",
    colors: {
      light: {
        primary: "142 71% 45%",
        primaryHover: "142 71% 40%",
        accent: "88 50% 53%",
        background: "140 30% 97%",
        card: "140 25% 99%",
        secondary: "142 25% 94%",
        muted: "142 20% 95%",
        border: "142 20% 88%",
      },
      dark: {
        primary: "142 71% 55%",
        primaryHover: "142 71% 50%",
        accent: "88 50% 63%",
        background: "142 35% 8%",
        card: "142 30% 12%",
        secondary: "142 25% 18%",
        muted: "142 20% 20%",
        border: "142 20% 25%",
      },
    },
  },
  sunset: {
    name: "sunset",
    label: "Sunset",
    icon: "🌅",
    colors: {
      light: {
        primary: "14 90% 53%",
        primaryHover: "14 90% 48%",
        accent: "340 82% 52%",
        background: "20 35% 97%",
        card: "20 30% 99%",
        secondary: "14 30% 94%",
        muted: "14 25% 95%",
        border: "14 20% 88%",
      },
      dark: {
        primary: "14 90% 63%",
        primaryHover: "14 90% 58%",
        accent: "340 82% 62%",
        background: "14 35% 8%",
        card: "14 30% 12%",
        secondary: "14 25% 18%",
        muted: "14 20% 20%",
        border: "14 20% 25%",
      },
    },
  },
  lavender: {
    name: "lavender",
    label: "Lavender",
    icon: "💜",
    colors: {
      light: {
        primary: "262 52% 47%",
        primaryHover: "262 52% 42%",
        accent: "291 47% 51%",
        background: "265 30% 97%",
        card: "265 25% 99%",
        secondary: "262 25% 94%",
        muted: "262 20% 95%",
        border: "262 20% 88%",
      },
      dark: {
        primary: "262 52% 57%",
        primaryHover: "262 52% 52%",
        accent: "291 47% 61%",
        background: "262 35% 8%",
        card: "262 30% 12%",
        secondary: "262 25% 18%",
        muted: "262 20% 20%",
        border: "262 20% 25%",
      },
    },
  },
  cherry: {
    name: "cherry",
    label: "Cherry",
    icon: "🍒",
    colors: {
      light: {
        primary: "351 95% 45%",
        primaryHover: "351 95% 40%",
        accent: "330 65% 52%",
        background: "345 30% 97%",
        card: "345 25% 99%",
        secondary: "351 25% 94%",
        muted: "351 20% 95%",
        border: "351 20% 88%",
      },
      dark: {
        primary: "351 95% 55%",
        primaryHover: "351 95% 50%",
        accent: "330 65% 62%",
        background: "351 35% 8%",
        card: "351 30% 12%",
        secondary: "351 25% 18%",
        muted: "351 20% 20%",
        border: "351 20% 25%",
      },
    },
  },
  royal: {
    name: "royal",
    label: "Royal",
    icon: "👑",
    colors: {
      light: {
        primary: "250 69% 61%",
        primaryHover: "250 69% 56%",
        accent: "276 100% 75%",
        background: "255 30% 97%",
        card: "255 25% 99%",
        secondary: "250 25% 94%",
        muted: "250 20% 95%",
        border: "250 20% 88%",
      },
      dark: {
        primary: "250 69% 71%",
        primaryHover: "250 69% 66%",
        accent: "276 100% 85%",
        background: "250 35% 8%",
        card: "250 30% 12%",
        secondary: "250 25% 18%",
        muted: "250 20% 20%",
        border: "250 20% 25%",
      },
    },
  },
  emerald: {
    name: "emerald",
    label: "Emerald",
    icon: "💎",
    colors: {
      light: {
        primary: "160 84% 39%",
        primaryHover: "160 84% 34%",
        accent: "158 64% 52%",
        background: "160 30% 97%",
        card: "160 25% 99%",
        secondary: "160 25% 94%",
        muted: "160 20% 95%",
        border: "160 20% 88%",
      },
      dark: {
        primary: "160 84% 49%",
        primaryHover: "160 84% 44%",
        accent: "158 64% 62%",
        background: "160 35% 8%",
        card: "160 30% 12%",
        secondary: "160 25% 18%",
        muted: "160 20% 20%",
        border: "160 20% 25%",
      },
    },
  },
  midnight: {
    name: "midnight",
    label: "Midnight",
    icon: "🌙",
    colors: {
      light: {
        primary: "231 48% 48%",
        primaryHover: "231 48% 43%",
        accent: "217 33% 53%",
        background: "225 30% 97%",
        card: "225 25% 99%",
        secondary: "231 25% 94%",
        muted: "231 20% 95%",
        border: "231 20% 88%",
      },
      dark: {
        primary: "231 48% 58%",
        primaryHover: "231 48% 53%",
        accent: "217 33% 63%",
        background: "231 35% 8%",
        card: "231 30% 12%",
        secondary: "231 25% 18%",
        muted: "231 20% 20%",
        border: "231 20% 25%",
      },
    },
  },
};

export function applyColorTheme(themeName: string) {
  const theme = colorThemes[themeName];
  if (!theme) return;

  const isDark = document.documentElement.classList.contains("dark");
  const colors = isDark ? theme.colors.dark : theme.colors.light;

  const root = document.documentElement;
  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--primary-hover", colors.primaryHover);
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--background", colors.background);
  root.style.setProperty("--card", colors.card);
  root.style.setProperty("--secondary", colors.secondary);
  root.style.setProperty("--muted", colors.muted);
  root.style.setProperty("--border", colors.border);
  root.style.setProperty("--sidebar-primary", colors.primary);
  root.style.setProperty("--sidebar-background", colors.card);
  root.style.setProperty("--sidebar-accent", colors.secondary);
  root.style.setProperty("--sidebar-border", colors.border);
  root.style.setProperty("--ring", colors.primary);
  root.style.setProperty("--sidebar-ring", colors.primary);

  // Generate dynamic gradients and shadows based on theme
  root.style.setProperty("--gradient-primary", `linear-gradient(135deg, hsl(${colors.primary}), hsl(${colors.accent}))`);
  root.style.setProperty("--gradient-card", `linear-gradient(to bottom, hsl(${colors.card}), hsl(${colors.background}))`);
  root.style.setProperty("--shadow-primary", `0 10px 40px -12px hsl(${colors.primary} / 0.25)`);
  root.style.setProperty("--shadow-card", `0 4px 20px -4px hsl(${colors.primary} / 0.1)`);
  root.style.setProperty("--glow-primary", `0 0 30px hsl(${colors.primary} / 0.3)`);

  localStorage.setItem("colorTheme", themeName);
}

export function initializeColorTheme() {
  const savedColorTheme = localStorage.getItem("colorTheme") || "blue";
  applyColorTheme(savedColorTheme);
}

export function getCurrentColorTheme(): string {
  return localStorage.getItem("colorTheme") || "blue";
}
