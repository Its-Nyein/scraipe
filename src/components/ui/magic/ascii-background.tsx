import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useCallback, useEffect, useRef, useState } from "react";

const CHARS = "...::.++-==";
const WEIGHTED = "    .  .  ..  . :  .+ . . -  . =  .  ..  . .   ";

interface AsciiBackgroundProps {
  className?: string;
  opacity?: number;
}

export function AsciiBackground({
  className,
  opacity = 0.15,
}: AsciiBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<string>("");
  const charsArrayRef = useRef<string[]>([]);
  const gridRef = useRef({ cols: 0, rows: 0, total: 0 });
  const rafRef = useRef<number>(0);
  const lastFlickerRef = useRef<number>(0);
  const [mounted, setMounted] = useState(false);
  const reducedMotion = useReducedMotion();

  const generatePattern = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();

    const charW = 9.5;
    const charH = 18;
    const cols = Math.floor(width / charW);
    const rows = Math.floor(height / charH);
    gridRef.current = { cols, rows, total: cols * rows };

    const chars: string[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const nx = Math.sin(c * 0.15) * Math.cos(r * 0.12) * 0.5 + 0.5;
        const ny = Math.cos(c * 0.08 + r * 0.1) * 0.5 + 0.5;
        const density = nx * ny;

        if (density + Math.random() * 0.4 > 0.55) {
          chars.push(
            WEIGHTED[Math.floor(Math.random() * WEIGHTED.length)] || ".",
          );
        } else {
          chars.push(" ");
        }
      }
      if (r < rows - 1) chars.push("\n");
    }

    charsArrayRef.current = chars;
    textRef.current = chars.join("");
    el.textContent = textRef.current;
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    generatePattern();

    const observer = new ResizeObserver(() => generatePattern());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [mounted, generatePattern]);

  useEffect(() => {
    if (!mounted || reducedMotion) return;
    const el = containerRef.current;
    if (!el) return;

    function flicker(now: number) {
      if (now - lastFlickerRef.current > 200) {
        lastFlickerRef.current = now;
        const chars = charsArrayRef.current;
        if (chars.length === 0) {
          rafRef.current = requestAnimationFrame(flicker);
          return;
        }

        let changed = false;
        for (let i = 0; i < 8; i++) {
          const idx = Math.floor(Math.random() * chars.length);
          if (chars[idx] === "\n") continue;

          const wasSpace = chars[idx] === " ";
          if (wasSpace && Math.random() < 0.15) {
            chars[idx] = CHARS[Math.floor(Math.random() * CHARS.length)];
            changed = true;
          } else if (!wasSpace && Math.random() < 0.2) {
            if (Math.random() < 0.4) {
              chars[idx] = " ";
            } else {
              chars[idx] = CHARS[Math.floor(Math.random() * CHARS.length)];
            }
            changed = true;
          }
        }

        if (changed && el) {
          el.textContent = chars.join("");
        }
      }
      rafRef.current = requestAnimationFrame(flicker);
    }

    rafRef.current = requestAnimationFrame(flicker);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mounted, reducedMotion]);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        opacity,
        margin: 0,
        padding: 0,
        lineHeight: "18px",
        fontSize: "13px",
        fontFamily: '"Geist Mono Variable", monospace',
        whiteSpace: "pre",
        color: "var(--foreground)",
        maskImage:
          "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        WebkitMaskImage:
          "radial-gradient(ellipse at center, black 20%, transparent 75%)",
      }}
    />
  );
}
