"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggleTheme() {
    const nextTheme = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.style.colorScheme = nextTheme;
    window.localStorage.setItem("click-nfe-theme", nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="icon-button"
      aria-label="Alternar tema claro ou escuro"
      title="Alternar tema"
    >
      <Moon className="dark:hidden" size={17} />
      <Sun className="hidden dark:block" size={17} />
    </button>
  );
}
