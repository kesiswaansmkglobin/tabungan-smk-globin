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
    };
    dark: {
      primary: string;
      primaryHover: string;
      accent: string;
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
      },
      dark: {
        primary: "199 89% 58%",
        primaryHover: "199 89% 53%",
        accent: "187 85% 63%",
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
      },
      dark: {
        primary: "142 71% 55%",
        primaryHover: "142 71% 50%",
        accent: "88 50% 63%",
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
      },
      dark: {
        primary: "14 90% 63%",
        primaryHover: "14 90% 58%",
        accent: "340 82% 62%",
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
      },
      dark: {
        primary: "262 52% 57%",
        primaryHover: "262 52% 52%",
        accent: "291 47% 61%",
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
      },
      dark: {
        primary: "351 95% 55%",
        primaryHover: "351 95% 50%",
        accent: "330 65% 62%",
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
      },
      dark: {
        primary: "250 69% 71%",
        primaryHover: "250 69% 66%",
        accent: "276 100% 85%",
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
      },
      dark: {
        primary: "160 84% 49%",
        primaryHover: "160 84% 44%",
        accent: "158 64% 62%",
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
      },
      dark: {
        primary: "231 48% 58%",
        primaryHover: "231 48% 53%",
        accent: "217 33% 63%",
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
  root.style.setProperty("--sidebar-primary", colors.primary);
  root.style.setProperty("--ring", colors.primary);
  root.style.setProperty("--sidebar-ring", colors.primary);

  localStorage.setItem("colorTheme", themeName);
}

export function initializeColorTheme() {
  const savedColorTheme = localStorage.getItem("colorTheme") || "blue";
  applyColorTheme(savedColorTheme);
}

export function getCurrentColorTheme(): string {
  return localStorage.getItem("colorTheme") || "blue";
}
