import type { ReactNode } from "react";

/** Inline: **negrito**, *itálico*, [texto](url) */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("[")) {
      const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)!;
      nodes.push(
        <a key={key} href={m[2]} className="underline hover:text-primary transition">
          {m[1]}
        </a>
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function MarkdownContent({ content, className = "" }: { content: string; className?: string }) {
  const blocks = (content ?? "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className={className}>
      {blocks.map((block, idx) => {
        if (block.startsWith("### ")) {
          return (
            <h3 key={idx} className="font-display text-xl md:text-2xl text-primary-dark mt-8 mb-3">
              {renderInline(block.slice(4), `h3-${idx}`)}
            </h3>
          );
        }
        if (block.startsWith("## ")) {
          return (
            <h2 key={idx} className="font-display text-2xl md:text-3xl text-primary-dark mt-10 mb-4">
              {renderInline(block.slice(3), `h2-${idx}`)}
            </h2>
          );
        }
        if (/^---+$/.test(block)) {
          return <hr key={idx} className="my-10 border-border" />;
        }
        const img = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(block);
        if (img) {
          return (
            <img
              key={idx}
              src={img[2]}
              alt={img[1]}
              className="w-full rounded-xl my-8"
              loading="lazy"
              decoding="async"
            />
          );
        }
        if (block.startsWith("> ")) {
          return (
            <blockquote key={idx} className="border-l-2 border-primary/30 pl-4 italic text-primary/70 my-6">
              {renderInline(block.replace(/^> ?/gm, ""), `q-${idx}`)}
            </blockquote>
          );
        }
        if (/^[-*] /.test(block)) {
          const items = block.split("\n").map((l) => l.replace(/^[-*] ?/, ""));
          return (
            <ul key={idx} className="list-disc pl-5 space-y-2 text-primary/80 mb-6">
              {items.map((it, i) => (
                <li key={i}>{renderInline(it, `li-${idx}-${i}`)}</li>
              ))}
            </ul>
          );
        }
        if (/^\d+\. /.test(block)) {
          const items = block.split("\n").map((l) => l.replace(/^\d+\. ?/, ""));
          return (
            <ol key={idx} className="list-decimal pl-5 space-y-2 text-primary/80 mb-6">
              {items.map((it, i) => (
                <li key={i}>{renderInline(it, `oli-${idx}-${i}`)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={idx} className="text-primary/80 leading-relaxed mb-5 whitespace-pre-line">
            {renderInline(block, `p-${idx}`)}
          </p>
        );
      })}
    </div>
  );
}

export default MarkdownContent;
