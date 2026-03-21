import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useCallback, useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  phase: number;
}

interface MatrixBackgroundProps {
  className?: string;
  opacity?: number;
  darkOpacity?: number;
  lightOpacity?: number;
}

const REF_AREA = 1920 * 1080;

function getScaledParams(width: number, height: number) {
  const scale = Math.sqrt((width * height) / REF_AREA);
  return {
    particleCount: Math.max(30, Math.round(80 * scale)),
    connectDist: Math.max(100, Math.round(180 * scale)),
  };
}

export function MatrixBackground({
  className,
  opacity = 0.15,
  darkOpacity,
  lightOpacity,
}: MatrixBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const connectDistRef = useRef(180);
  const mouseRef = useRef({ x: -1000, y: -1000 });
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

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const { particleCount, connectDist } = getScaledParams(width, height);
    connectDistRef.current = connectDist;

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const baseRadius = Math.random() * 1.8 + 0.5;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: baseRadius,
        baseRadius,
        phase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    initParticles();
    const observer = new ResizeObserver(() => initParticles());
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [mounted, initParticles]);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onMouseLeave() {
      mouseRef.current = { x: -1000, y: -1000 };
    }

    canvas.parentElement?.addEventListener("mousemove", onMouseMove);
    canvas.parentElement?.addEventListener("mouseleave", onMouseLeave);
    return () => {
      canvas.parentElement?.removeEventListener("mousemove", onMouseMove);
      canvas.parentElement?.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const style = getComputedStyle(document.documentElement);
    let color = style.getPropertyValue("--brand").trim();
    let paused = false;
    let time = 0;

    function animate() {
      if (paused || !ctx || !canvas) return;
      time += 0.008;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width;
      const h = canvas.height;
      const logicalW = w / dpr;
      const logicalH = h / dpr;
      const particles = particlesRef.current;
      const connectDist = connectDistRef.current;
      const mouse = mouseRef.current;
      const mouseRadius = 120;

      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const mouseDist = Math.sqrt(dx * dx + dy * dy);

        if (mouseDist < mouseRadius && mouseDist > 0) {
          const force = (1 - mouseDist / mouseRadius) * 0.8;
          p.vx += (dx / mouseDist) * force;
          p.vy += (dy / mouseDist) * force;
        }

        p.vx *= 0.98;
        p.vy *= 0.98;

        const baseSpeed = 0.15;
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed < baseSpeed) {
          p.vx += (Math.random() - 0.5) * 0.05;
          p.vy += (Math.random() - 0.5) * 0.05;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = logicalW;
        if (p.x > logicalW) p.x = 0;
        if (p.y < 0) p.y = logicalH;
        if (p.y > logicalH) p.y = 0;

        p.radius = p.baseRadius * (0.8 + 0.4 * Math.sin(time * 2 + p.phase));
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 0.5 * dpr;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectDist) {
            const alpha = (1 - dist / connectDist) * 0.35;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(particles[i].x * dpr, particles[i].y * dpr);
            ctx.lineTo(particles[j].x * dpr, particles[j].y * dpr);
            ctx.stroke();
          }
        }
      }

      ctx.shadowColor = color;
      ctx.fillStyle = color;

      for (const p of particles) {
        const glow = p.radius * 4 * dpr;
        ctx.shadowBlur = glow;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(p.x * dpr, p.y * dpr, p.radius * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
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

    const themeObserver = new MutationObserver(() => {
      const s = getComputedStyle(document.documentElement);
      color = s.getPropertyValue("--brand").trim();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    document.addEventListener("visibilitychange", onVisibilityChange);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [mounted, reducedMotion]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: resolvedOpacity,
      }}
    />
  );
}
