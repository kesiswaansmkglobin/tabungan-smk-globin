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
  blue: {
    name: "blue",
    label: "Biru",
    icon: "🔵",
    colors: {
      light: {
        primary: "217.2 91.2% 59.8%",
        primaryHover: "217.2 91.2% 54%",
        accent: "142 76% 36%",
      },
      dark: {
        primary: "217.2 91.2% 59.8%",
        primaryHover: "217.2 91.2% 54%",
        accent: "142 76% 46%",
      },
    },
  },
  green: {
    name: "green",
    label: "Hijau",
    icon: "🟢",
    colors: {
      light: {
        primary: "142 76% 36%",
        primaryHover: "142 76% 31%",
        accent: "217.2 91.2% 59.8%",
      },
      dark: {
        primary: "142 76% 46%",
        primaryHover: "142 76% 41%",
        accent: "217.2 91.2% 59.8%",
      },
    },
  },
  purple: {
    name: "purple",
    label: "Ungu",
    icon: "🟣",
    colors: {
      light: {
        primary: "271 81% 56%",
        primaryHover: "271 81% 51%",
        accent: "142 76% 36%",
      },
      dark: {
        primary: "271 81% 66%",
        primaryHover: "271 81% 61%",
        accent: "142 76% 46%",
      },
    },
  },
  orange: {
    name: "orange",
    label: "Oranye",
    icon: "🟠",
    colors: {
      light: {
        primary: "24 95% 53%",
        primaryHover: "24 95% 48%",
        accent: "142 76% 36%",
      },
      dark: {
        primary: "24 95% 63%",
        primaryHover: "24 95% 58%",
        accent: "142 76% 46%",
      },
    },
  },
  pink: {
    name: "pink",
    label: "Pink",
    icon: "🩷",
    colors: {
      light: {
        primary: "330 81% 60%",
        primaryHover: "330 81% 55%",
        accent: "142 76% 36%",
      },
      dark: {
        primary: "330 81% 70%",
        primaryHover: "330 81% 65%",
        accent: "142 76% 46%",
      },
    },
  },
  red: {
    name: "red",
    label: "Merah",
    icon: "🔴",
    colors: {
      light: {
        primary: "0 72% 51%",
        primaryHover: "0 72% 46%",
        accent: "142 76% 36%",
      },
      dark: {
        primary: "0 72% 61%",
        primaryHover: "0 72% 56%",
        accent: "142 76% 46%",
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
