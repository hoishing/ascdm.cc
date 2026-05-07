import { ThemeSwitcher } from "../components/kibo-ui/theme-switcher";
import { useTheme } from "../contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <ThemeSwitcher
      value={theme}
      onChange={(t) => {
        if (t === "system") {
          const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          setTheme(isDark ? "dark" : "light");
        } else {
          setTheme(t);
        }
      }}
    />
  );
}
