import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useCallback, useEffect, useRef, useState } from "react";

const DENSE_CHARS = "@#%&$";
const MID_CHARS = "+=:;~";
const LIGHT_CHARS = ".-·";

function charForDensity(d: number): string {
  if (d > 0.7)
    return DENSE_CHARS[Math.floor(Math.random() * DENSE_CHARS.length)];
  if (d > 0.45) return MID_CHARS[Math.floor(Math.random() * MID_CHARS.length)];
  if (d > 0.25)
    return LIGHT_CHARS[Math.floor(Math.random() * LIGHT_CHARS.length)];
  return " ";
}

interface AsciiBackgroundProps {
  className?: string;
  opacity?: number;
  darkOpacity?: number;
  lightOpacity?: number;
}

export function AsciiBackground({
  className,
  opacity = 0.15,
  darkOpacity,
  lightOpacity,
}: AsciiBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const charsRef = useRef<string[]>([]);
  const gridRef = useRef({ cols: 0, rows: 0 });
  const rafRef = useRef<number>(0);
  const [mounted, setMounted] = useState(false);
  const reducedMotion = useReducedMotion();

  const [resolvedOpacity, setResolvedOpacity] = useState(opacity);

  useEffect(() => {
    function sync() {
      const isDark = document.documentElement.classList.contains("dark");
      setResolvedOpacity(
        isDark ? (darkOpacity ?? opacity) : (lightOpacity ?? opacity),
      );
    }
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, [opacity, darkOpacity, lightOpacity]);

  const generateGrid = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();

    const charW = 9.5;
    const charH = 18;
    const cols = Math.floor(width / charW);
    const rows = Math.floor(height / charH);
    gridRef.current = { cols, rows };

    const chars: string[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        chars.push(" ");
      }
      if (r < rows - 1) chars.push("\n");
    }
    charsRef.current = chars;
    el.textContent = chars.join("");
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    generateGrid();
    const observer = new ResizeObserver(() => generateGrid());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [mounted, generateGrid]);

  useEffect(() => {
    if (!mounted || reducedMotion) return;
    if (!containerRef.current) return;

    let paused = false;
    let time = 0;

    function animate() {
      if (paused) return;
      const el = containerRef.current;
      if (!el) return;
      time += 0.015;

      const { cols, rows } = gridRef.current;
      const chars = charsRef.current;
      if (cols === 0 || rows === 0) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * (cols + 1) + c;

          const nx = c / cols;
          const ny = r / rows;

          const wave1 = Math.sin(nx * 6 + time) * Math.cos(ny * 4 - time * 0.7);
          const wave2 = Math.sin((nx + ny) * 5 - time * 1.3) * 0.5;
          const wave3 = Math.cos(nx * 3 - ny * 7 + time * 0.5) * 0.3;

          const cx = nx - 0.5;
          const cy = ny - 0.5;
          const radial = 1 - Math.sqrt(cx * cx + cy * cy) * 1.6;

          const density = (wave1 + wave2 + wave3) * 0.35 + 0.35;
          const masked = density * Math.max(0, radial);

          chars[idx] = charForDensity(masked);
        }
      }

      el.textContent = chars.join("");
      rafRef.current = requestAnimationFrame(animate);
    }

    function onVisibilityChange() {
      if (document.hidden) {
        paused = true;
        cancelAnimationFrame(rafRef.current);
      } else {
        paused = false;
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
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
        opacity: resolvedOpacity,
        margin: 0,
        padding: 0,
        lineHeight: "18px",
        fontSize: "13px",
        fontFamily: '"Geist Mono Variable", monospace',
        whiteSpace: "pre",
        color: "var(--brand)",
        maskImage:
          "radial-gradient(ellipse at center, black 25%, transparent 70%)",
        WebkitMaskImage:
          "radial-gradient(ellipse at center, black 25%, transparent 70%)",
      }}
    />
  );
}
