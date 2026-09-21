"use client";

import React, { useState } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageMarkdownProps {
  content: string;
  isUser?: boolean;
  className?: string;
}

function CodeBlock({
  children,
  language,
  isUser,
}: {
  children: React.ReactNode;
  language?: string;
  isUser?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const textContent = String(children).replace(/\n$/, "");

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={cn(
        "relative my-2 rounded-xl border overflow-hidden font-mono text-xs",
        isUser
          ? "bg-black/20 border-white/20 text-white"
          : "bg-muted/50 border-border/70 text-foreground"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between px-3 py-1.5 border-b text-[10px] uppercase font-bold tracking-wider",
          isUser
            ? "border-white/10 bg-white/5 text-white/70"
            : "border-border/40 bg-muted/40 text-muted-foreground"
        )}
      >
        <span>{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors cursor-pointer",
            isUser ? "hover:bg-white/10 text-white" : "hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
          title="Copy code"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-400" />
              <span className="text-[9px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span className="text-[9px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3 overflow-x-auto custom-scrollbar">
        <pre className="m-0 leading-relaxed font-mono">{children}</pre>
      </div>
    </div>
  );
}

/**
 * Preprocesses text to format run-on inline bullet points and auto-link phone numbers
 * if they are not already formatted as markdown links.
 */
function preprocessChatContent(raw: string): string {
  if (!raw) return "";

  let text = raw;

  // If the text contains inline dashes between bold headers (e.g., "name. - **Phone:** ... - **Email:** ..."),
  // convert them to clean newlines with bullet points for readability.
  text = text.replace(/([.?!])\s*-\s*\*\*/g, "$1\n\n- **");
  text = text.replace(/([^\n])\s+-\s+\*\*/g, "$1\n- **");

  // Auto-link standalone Philippine phone numbers (e.g. +63 917 111 0001, 0917 111 0001) if not already linked
  text = text.replace(
    /(^|[\s(])(\+?63\s?9\d{2}\s?\d{3}\s?\d{4}|09\d{2}\s?\d{3}\s?\d{4})(?=[)\s,.]|$)/g,
    (match, prefix, phone) => {
      const cleanDigits = phone.replace(/\s+/g, "");
      return `${prefix}[${phone}](tel:${cleanDigits})`;
    }
  );

  return text;
}

const customUrlTransform = (url: string) => {
  const trimmed = url.trim();
  if (trimmed.startsWith("tel:")) {
    return trimmed;
  }
  return defaultUrlTransform(url);
};

export function ChatMessageMarkdown({
  content,
  isUser = false,
  className,
}: ChatMessageMarkdownProps) {
  const processed = preprocessChatContent(content);

  return (
    <div
      className={cn(
        "chat-message-markdown leading-relaxed text-sm md:text-base break-words",
        isUser ? "text-primary-foreground" : "text-foreground",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={customUrlTransform}
        components={{
          // Paragraphs
          p({ children }) {
            return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
          },

          // Bold & Strong
          strong({ children }) {
            return (
              <strong
                className={cn(
                  "font-black",
                  isUser ? "text-white" : "text-foreground font-black"
                )}
              >
                {children}
              </strong>
            );
          },

          // Italic & Emphasis
          em({ children }) {
            return <em className="italic opacity-90">{children}</em>;
          },

          // Links (internal vs external vs tel/mailto)
          a({ href, children, ...props }) {
            const isExternal =
              href && (href.startsWith("http://") || href.startsWith("https://"));
            const isContact =
              href && (href.startsWith("tel:") || href.startsWith("mailto:"));

            return (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className={cn(
                  "underline underline-offset-2 transition-opacity font-semibold cursor-pointer",
                  isUser
                    ? "text-white/95 hover:opacity-80 underline-offset-4"
                    : isContact
                    ? "text-primary hover:text-primary/80 font-bold font-mono"
                    : "text-primary hover:text-primary/80"
                )}
                {...props}
              >
                {children}
              </a>
            );
          },

          // Lists
          ul({ children }) {
            return (
              <ul
                className={cn(
                  "my-2 space-y-1 pl-5 list-disc",
                  isUser ? "marker:text-white/80" : "marker:text-primary"
                )}
              >
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol
                className={cn(
                  "my-2 space-y-1 pl-5 list-decimal",
                  isUser ? "marker:text-white/80" : "marker:text-primary"
                )}
              >
                {children}
              </ol>
            );
          },
          li({ children }) {
            return <li className="leading-relaxed pl-1">{children}</li>;
          },

          // Headings
          h1({ children }) {
            return (
              <h1 className="text-base sm:text-lg font-black tracking-tight my-2.5">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-sm sm:text-base font-black tracking-tight my-2">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-xs sm:text-sm font-bold tracking-tight my-1.5">
                {children}
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className="text-xs font-bold tracking-tight my-1">
                {children}
              </h4>
            );
          },

          // Blockquotes
          blockquote({ children }) {
            return (
              <blockquote
                className={cn(
                  "border-l-2 pl-3 my-2 italic text-xs sm:text-sm",
                  isUser
                    ? "border-white/50 text-white/80"
                    : "border-primary/60 text-muted-foreground"
                )}
              >
                {children}
              </blockquote>
            );
          },

          // Tables
          table({ children }) {
            return (
              <div className="my-2.5 w-full max-w-full overflow-x-auto rounded-xl border border-border/70 bg-card/60 shadow-xs">
                <table className="min-w-full text-xs text-left border-collapse">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-muted/40 border-b border-border/60">
                {children}
              </thead>
            );
          },
          tbody({ children }) {
            return (
              <tbody className="divide-y divide-border/40 font-normal">
                {children}
              </tbody>
            );
          },
          tr({ children }) {
            return (
              <tr className="hover:bg-muted/20 transition-colors">
                {children}
              </tr>
            );
          },
          th({ children }) {
            return (
              <th className="px-3 py-2 text-[10px] uppercase font-black tracking-wider text-muted-foreground">
                {children}
              </th>
            );
          },
          td({ children }) {
            return <td className="px-3 py-2 font-medium">{children}</td>;
          },

          // Code
          code({ className: codeClassName, children, ...codeProps }) {
            const match = /language-(\w+)/.exec(codeClassName || "");
            const isMultiLine = String(children).includes("\n");

            if (match || isMultiLine) {
              return (
                <CodeBlock language={match?.[1]} isUser={isUser}>
                  {children}
                </CodeBlock>
              );
            }

            return (
              <code
                className={cn(
                  "px-1.5 py-0.5 rounded font-mono text-[0.85em] font-semibold",
                  isUser
                    ? "bg-white/20 text-white"
                    : "bg-muted/70 text-foreground border border-border/50"
                )}
                {...codeProps}
              >
                {children}
              </code>
            );
          },

          // Horizontal rule
          hr() {
            return (
              <hr
                className={cn(
                  "my-3 border-0 border-t",
                  isUser ? "border-white/20" : "border-border/60"
                )}
              />
            );
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
