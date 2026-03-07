import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export function TopLoader() {
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setWidth(10);

      intervalRef.current = setInterval(() => {
        setWidth((w) => {
          if (w >= 90) return w;
          const remaining = 90 - w;
          return w + remaining * 0.1;
        });
      }, 150);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setWidth(100);

      timerRef.current = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 300);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-9999 h-[2px] transition-all duration-200 ease-out"
      style={{
        width: `${width}%`,
        background:
          "linear-gradient(90deg, oklch(0.55 0.2 270), oklch(0.65 0.18 285), oklch(0.6 0.15 200))",
        boxShadow: "0 0 8px oklch(0.6 0.2 285 / 0.6)",
        opacity: width === 100 ? 0 : 1,
      }}
    />
  );
}
