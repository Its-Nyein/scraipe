import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useEffect, useRef, useState } from "react";

const SCRAMBLE_CHARS = "!@#$%^&*()_+-=[]{}|;:,./<>?";

interface ScrambleTextProps {
  text: string;
  duration?: number;
  delay?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export function ScrambleText({
  text,
  duration = 1000,
  delay = 0,
  className,
  as: Tag = "span",
}: ScrambleTextProps) {
  const [display, setDisplay] = useState(text);
  const reducedMotion = useReducedMotion();
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(text);
      return;
    }

    const startTime = performance.now() + delay;

    function animate(now: number) {
      if (now < startTime) {
        let s = "";
        for (const char of text) {
          s +=
            char === " "
              ? " "
              : SCRAMBLE_CHARS[
                  Math.floor(Math.random() * SCRAMBLE_CHARS.length)
                ];
        }
        setDisplay(s);
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const revealed = Math.floor(progress * text.length);

      let s = "";
      for (let i = 0; i < text.length; i++) {
        if (i < revealed) {
          s += text[i];
        } else if (text[i] === " ") {
          s += " ";
        } else {
          s +=
            SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
      }
      setDisplay(s);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [text, duration, delay, reducedMotion]);

  return (
    <Tag className={className} aria-label={text}>
      {display}
    </Tag>
  );
}
