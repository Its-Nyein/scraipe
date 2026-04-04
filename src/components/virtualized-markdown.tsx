import { MessageResponse } from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useCallback, useMemo, useRef } from "react";

function splitMarkdownBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const lines = markdown.split("\n");
  let current = "";
  let inCodeFence = false;

  for (const line of lines) {
    if (line.startsWith("```")) {
      inCodeFence = !inCodeFence;
    }

    if (!inCodeFence && line.trim() === "" && current.trim() !== "") {
      blocks.push(current.trim());
      current = "";
    } else {
      current += (current ? "\n" : "") + line;
    }
  }

  if (current.trim()) {
    blocks.push(current.trim());
  }

  return blocks;
}

const MarkdownBlock = memo(({ content }: { content: string }) => (
  <MessageResponse>{content}</MessageResponse>
));
MarkdownBlock.displayName = "MarkdownBlock";

interface VirtualizedMarkdownProps {
  content: string;
  className?: string;
  maxHeight?: number;
}

export const VirtualizedMarkdown = memo(
  ({ content, className, maxHeight = 600 }: VirtualizedMarkdownProps) => {
    const blocks = useMemo(() => splitMarkdownBlocks(content), [content]);
    const scrollRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
      count: blocks.length,
      getScrollElement: () => scrollRef.current,
      estimateSize: useCallback(() => 80, []),
      overscan: 5,
    });

    return (
      <div
        ref={scrollRef}
        className={cn("item-content overflow-y-auto", className)}
        style={{ maxHeight }}
      >
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full pb-4"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <MarkdownBlock content={blocks[virtualRow.index]} />
            </div>
          ))}
        </div>
      </div>
    );
  },
);
VirtualizedMarkdown.displayName = "VirtualizedMarkdown";
