import React, { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Message } from "ai/react";
import type { ChatRequestOptions } from "ai";
import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import { RefreshCcw } from "lucide-react";
import {
  ChatBubble,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import ButtonWithTooltip from "@/components/button-with-tooltip";
import { Button } from "@/components/ui/button";
import CodeDisplayBlock from "@/components/code-display-block";
import TableDisplayBlock from "@/components/table-display-block";
import { Response } from "@/components/ui/response";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";

export type ChatMessageProps = {
  message: Message;
  isLast: boolean;
  isLoading: boolean | undefined;
  reload: (chatRequestOptions?: ChatRequestOptions) => Promise<string | null | undefined>;
  isSecondLast?: boolean;
};

const MOTION_CONFIG = {
  initial: { opacity: 0, scale: 1, y: 20, x: 0 },
  animate: { opacity: 1, scale: 1, y: 0, x: 0 },
  exit: { opacity: 0, scale: 1, y: 20, x: 0 },
  transition: {
    opacity: { duration: 0.1 },
    layout: {
      type: "spring" as const,
      bounce: 0.3,
      duration: 0.2,
    },
  },
};

function OllamaChatMessage({ message, isLast, reload }: ChatMessageProps) {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isThinkCollapsed, setIsThinkCollapsed] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const thinkContentRef = React.useRef<HTMLDivElement>(null);

  // Extract "think" content from Deepseek R1 models and clean message (rest) content
  const { thinkContent, cleanContent } = useMemo(() => {
    const getThinkContent = (content: string) => {
      const match = content.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
      return match ? match[1].trim() : null;
    };

    return {
      thinkContent: message.role === "assistant" ? getThinkContent(message.content) : null,
      cleanContent: message.content.replace(/<think>[\s\S]*?(?:<\/think>|$)/g, '').trim(),
    };
  }, [message.content, message.role]);

  // Auto-collapse think content when streaming starts (when cleanContent has content)
  React.useEffect(() => {
    if (thinkContent && cleanContent && cleanContent.length > 0 && !isThinkCollapsed) {
      setIsThinkCollapsed(true);
    }
  }, [thinkContent, cleanContent, isThinkCollapsed]);

  // Auto-scroll think content to bottom when content changes
  React.useEffect(() => {
    if (thinkContentRef.current && thinkContent && !isThinkCollapsed) {
      thinkContentRef.current.scrollTop = thinkContentRef.current.scrollHeight;
    }
  }, [thinkContent, isThinkCollapsed]);

  const contentParts = useMemo(() => cleanContent.split("```"), [cleanContent]);

  // Function to convert markdown text to HTML
  const markdownToHtml = (text: string): string => {
    return text
      // Bold text: **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic text: *text* or _text_
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Strikethrough: ~~text~~
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      // Inline code: `code`
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Links: [text](url)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-500 hover:text-blue-700 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br>');
  };

  // Function to detect and extract tables from markdown content
  const extractTables = (content: string) => {
    const tableRegex = /(\|.*\|[\s\S]*?)(?=\n\n|\n$|$)/g;
    const tables: Array<{ markdown: string; html: string }> = [];
    let match;
    
    while ((match = tableRegex.exec(content)) !== null) {
      const tableMarkdown = match[1].trim();
      if (tableMarkdown.includes('|') && tableMarkdown.split('\n').length >= 2) {
        // Convert markdown table to HTML
        const lines = tableMarkdown.split('\n').filter(line => line.trim());
        if (lines.length >= 2) {
          const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
          const rows = lines.slice(2).map(line => 
            line.split('|').map(cell => cell.trim()).filter(cell => cell)
          );
          
          let html = '<table class="border-collapse border border-border w-full">';
          
          // Add header
          if (headers.length > 0) {
            html += '<thead><tr>';
            headers.forEach(header => {
              html += `<th class="border border-border px-3 py-2 text-left font-semibold bg-muted">${markdownToHtml(header)}</th>`;
            });
            html += '</tr></thead>';
          }
          
          // Add body
          html += '<tbody>';
          rows.forEach(row => {
            html += '<tr>';
            row.forEach((cell, index) => {
              const tag = index < headers.length ? 'td' : 'td';
              html += `<${tag} class="border border-border px-3 py-2">${markdownToHtml(cell)}</${tag}>`;
            });
            html += '</tr>';
          });
          html += '</tbody></table>';
          
          tables.push({ markdown: tableMarkdown, html });
        }
      }
    }
    
    return tables;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };


  const renderAttachments = () => (
    <div className="flex gap-2 flex-wrap">
      {message.experimental_attachments
        ?.filter((attachment) => attachment.contentType?.startsWith("image/"))
        .map((attachment, index) => (
          <div
            key={`${message.id}-${index}`}
            className="w-10 h-10 flex-shrink-0 overflow-hidden rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setSelectedImage(attachment.url)}
          >
            <img
              src={attachment.url}
              alt="attached image"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
    </div>
  );

  const renderThinkingProcess = () => (
    thinkContent && message.role === "assistant" && (
      <details className="mb-2 text-xs" open={!isThinkCollapsed}>
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Thinking process
        </summary>
        <div ref={thinkContentRef} className="mt-2 text-muted-foreground ml-4 max-h-48 overflow-y-auto relative">
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-background to-transparent pointer-events-none z-10"></div>
          <Response className="text-xs leading-relaxed text-muted-foreground [&>h1]:text-sm [&>h1]:font-bold [&>h1]:mb-1 [&>h2]:text-xs [&>h2]:font-semibold [&>h2]:mb-1 [&>h3]:text-xs [&>h3]:font-semibold [&>h3]:mb-1 [&>p]:mb-1 [&>ul]:list-disc [&>ul]:ml-2 [&>ol]:list-decimal [&>ol]:ml-2 [&>li]:mb-0.5 [&>code]:bg-muted [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs [&>pre]:bg-muted [&>pre]:p-2 [&>pre]:rounded [&>pre]:overflow-x-auto [&>blockquote]:border-l-2 [&>blockquote]:border-border [&>blockquote]:pl-2 [&>blockquote]:italic [&>a]:text-blue-400 [&>a]:hover:text-blue-600 [&>a]:underline">
            {thinkContent}
          </Response>
        </div>
      </details>
    )
  );

  const renderContent = () => {
    return contentParts.map((part, index) => {
      if (index % 2 === 0) {
        // Regular markdown content - check for tables
        const tables = extractTables(part);
        
        if (tables.length > 0) {
          // Split content around tables and render each part
          let remainingContent = part;
          const parts: Array<{ type: 'markdown' | 'table'; content: string; tableData?: { markdown: string; html: string } }> = [];
          
          tables.forEach(table => {
            const tableIndex = remainingContent.indexOf(table.markdown);
            if (tableIndex !== -1) {
              // Add content before table
              const beforeTable = remainingContent.substring(0, tableIndex);
              if (beforeTable.trim()) {
                parts.push({ type: 'markdown', content: beforeTable });
              }
              
              // Add table
              parts.push({ type: 'table', content: '', tableData: table });
              
              // Update remaining content
              remainingContent = remainingContent.substring(tableIndex + table.markdown.length);
            }
          });
          
          // Add remaining content
          if (remainingContent.trim()) {
            parts.push({ type: 'markdown', content: remainingContent });
          }
          
          return (
            <div key={index}>
              {parts.map((partItem, partIndex) => (
                partItem.type === 'table' && partItem.tableData ? (
                  <TableDisplayBlock 
                    key={`${index}-${partIndex}`}
                    tableHtml={partItem.tableData.html}
                    tableMarkdown={partItem.tableData.markdown}
                  />
                ) : (
                  <Response 
                    key={`${index}-${partIndex}`}
                    className="text-sm leading-relaxed [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-2 [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mb-2 [&>h3]:text-base [&>h3]:font-semibold [&>h3]:mb-1 [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4 [&>li]:mb-1 [&>code]:bg-muted [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>pre]:bg-muted [&>pre]:p-3 [&>pre]:rounded [&>pre]:overflow-x-auto [&>blockquote]:border-l-4 [&>blockquote]:border-border [&>blockquote]:pl-4 [&>blockquote]:italic [&>a]:text-blue-500 [&>a]:hover:text-blue-700 [&>a]:underline"
                  >
                    {partItem.content}
                  </Response>
                )
              ))}
            </div>
          );
        } else {
          // No tables found, render normally
          return (
            <Response 
              key={index} 
              className="text-sm leading-relaxed [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-2 [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mb-2 [&>h3]:text-base [&>h3]:font-semibold [&>h3]:mb-1 [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4 [&>li]:mb-1 [&>code]:bg-muted [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>pre]:bg-muted [&>pre]:p-3 [&>pre]:rounded [&>pre]:overflow-x-auto [&>blockquote]:border-l-4 [&>blockquote]:border-border [&>blockquote]:pl-4 [&>blockquote]:italic [&>a]:text-blue-500 [&>a]:hover:text-blue-700 [&>a]:underline"
            >
              {part}
            </Response>
          );
        }
      } else {
        // Code block
        return (
          <pre className="whitespace-pre-wrap" key={index}>
            <CodeDisplayBlock code={part} />
          </pre>
        );
      }
    });
  };

  const renderActionButtons = () => (
    <div className="pt-2 flex gap-1 items-center text-muted-foreground">
      <ButtonWithTooltip side="bottom" toolTipText="Copy">
        <Button
          onClick={handleCopy}
          variant="ghost"
          size="icon"
          className="h-4 w-4 mt-2"
        >
          {isCopied ? (
            <CheckIcon className="w-3.5 h-3.5 transition-all" />
          ) : (
            <CopyIcon className="w-3.5 h-3.5 transition-all" />
          )}
        </Button>
      </ButtonWithTooltip>
      {isLast && message.role === "assistant" && (
        <ButtonWithTooltip side="bottom" toolTipText="Regenerate">
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 mt-2"
            onClick={() => reload()}
          >
            <RefreshCcw className="w-3.5 h-3.5 scale-100 transition-all" />
          </Button>
        </ButtonWithTooltip>
      )}
    </div>
  );

  return (
    <>
      <motion.div {...MOTION_CONFIG} className={`flex flex-col whitespace-pre-wrap ${message.role === "user" ? "gap-1" : "gap-2"}`}>
        <ChatBubble 
          variant={message.role === "user" ? "sent" : "received"}
          className={message.role === "assistant" ? "max-w-[95%]" : ""}
        >
          <ChatBubbleMessage className={message.role === "user" ? "p-2" : ""}>
            {renderThinkingProcess()}
            {renderAttachments()}
            {renderContent()}
            {renderActionButtons()}
          </ChatBubbleMessage>
        </ChatBubble>
      </motion.div>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 pb-2">
          </DialogHeader>
          <div className="p-4 pt-0 flex items-center justify-center">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Full size image"
                className="max-w-full max-h-[70vh] object-contain rounded-md"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default memo(OllamaChatMessage, (prevProps, nextProps) => {
  if (nextProps.isLast) return false;
  return prevProps.isLast === nextProps.isLast && prevProps.message === nextProps.message;
});
