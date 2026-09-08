/**
 * plainProse — flatten light Markdown to plain text for the chat bubble.
 *
 * The Analyst bubble renders prose only (charts carry the signal — see
 * ChatBubble.md), and the fixture backend emits plain sentences. The live
 * LLM sometimes wraps its answer in `###` headings + `**bold**` + escaped
 * `\$`, which render literally in a bare <Text>. Strip that back to prose;
 * the numbers still read, just without the syntax noise.
 */

/** Strip heading markers, bold/italic/code wrappers, list bullets, over-escapes. */
export function plainProse(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      let l = line.replace(/^\s{0,3}#{1,6}\s+/, ""); // "### Heading" → "Heading"
      l = l.replace(/^(\s*)[-*+]\s+/, "$1• "); // "- item" / "* item" → "• item"
      return l;
    })
    .join("\n")
    .replace(/\*\*(.+?)\*\*/g, "$1") // **bold** → bold
    .replace(/__(.+?)__/g, "$1") // __bold__ → bold
    .replace(/`([^`]+)`/g, "$1") // `code` → code
    .replace(/\\([$#*_`~])/g, "$1") // \$ \# … → $ # …
    .replace(/\n{3,}/g, "\n\n") // collapse blank-line runs
    .trim();
}
