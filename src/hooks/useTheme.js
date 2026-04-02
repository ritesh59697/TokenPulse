import { useState, useEffect } from "react";

export function useTheme() {

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("tokenpulse-theme") || "light";
  });

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }

    localStorage.setItem("tokenpulse-theme", theme);

  }, [theme]);

  const toggle = () => {
    const root = document.documentElement;

    root.classList.add("no-transition");

    const newTheme = theme === "dark" ? "light" : "dark";

    setTheme(newTheme);

    setTimeout(() => {
      root.classList.remove("no-transition");
    }, 50);
  };

  return { theme, toggle };
}