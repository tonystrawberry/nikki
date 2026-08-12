"use client";

/**
 * Renders post HTML and upgrades ```mermaid fenced blocks into SVG diagrams.
 * remark-html emits <pre><code class="language-mermaid">…</code></pre>.
 */
import { useEffect, useRef } from "react";

interface PostContentProps {
  html: string;
  className?: string;
}

export function PostContent({ html, className }: PostContentProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    let cancelled = false;

    async function renderMermaid() {
      const blocks = root!.querySelectorAll("pre code.language-mermaid");
      if (blocks.length === 0) return;

      const mermaid = (await import("mermaid")).default;
      if (cancelled) return;

      mermaid.initialize({
        startOnLoad: false,
        theme: "neutral",
        securityLevel: "loose",
        fontFamily: "inherit",
      });

      await Promise.all(
        Array.from(blocks).map(async (block, i) => {
          const code = block.textContent?.trim();
          if (!code) return;

          const pre = block.parentElement;
          if (!pre || pre.dataset.mermaidRendered === "true") return;

          try {
            const id = `mermaid-${i}-${Math.random().toString(36).slice(2, 9)}`;
            const { svg } = await mermaid.render(id, code);
            if (cancelled) return;

            const wrapper = document.createElement("div");
            wrapper.className = "mermaid-diagram";
            wrapper.setAttribute("role", "img");
            wrapper.innerHTML = svg;
            pre.replaceWith(wrapper);
          } catch (err) {
            console.error("Mermaid render failed:", err);
            pre.dataset.mermaidRendered = "error";
          }
        })
      );
    }

    void renderMermaid();
    return () => {
      cancelled = true;
    };
  }, [html]);

  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
