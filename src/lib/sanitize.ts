export function sanitizeContent(markdown: string): string {
  return markdown
    .replace(/\\{2,}\n/g, "\n")
    .replace(/\\{2,}$/gm, "")
    .replace(
      /!\[[^\]]*\]\([^)]*(?:\/|%2F)(?:blog(?:\/|%2F))?authors(?:\/|%2F)[^)]*\)/gi,
      "",
    )
    .replace(
      /!\[[^\]]*\]\([^)]*[?&](?:s|size|w|width|h|height)=(?:[1-9]|[1-9]\d)\b[^)]*\)/gi,
      "",
    )
    .replace(
      /!\[[^\]]*\]\([^)]*(?:favicon|pixel|tracker|beacon|badge\.)[^)]*\)/gi,
      "",
    )
    .replace(/^(?:[A-Z][A-Za-z\s]{1,25}\n\n){3,}/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
