// Initialize theme from localStorage on app start
export function initializeTheme() {
  const savedTheme = localStorage.getItem("theme");
  
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else if (savedTheme === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    // Check system preference if no saved theme
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  }
}
