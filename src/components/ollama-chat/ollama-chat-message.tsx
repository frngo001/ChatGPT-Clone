import React, { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

export type ChatMessageProps = {
  message: Message;
  isLast: boolean;
  isLoading: boolean | undefined;
  reload: (chatRequestOptions?: ChatRequestOptions) => Promise<string | null | undefined>;
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

function OllamaChatMessage({ message, isLast, isLoading, reload }: ChatMessageProps) {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isThinkCollapsed, setIsThinkCollapsed] = useState<boolean>(false);
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

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  const renderAttachments = () => (
    <div className="flex gap-2">
      {message.experimental_attachments
        ?.filter((attachment) => attachment.contentType?.startsWith("image/"))
        .map((attachment, index) => (
          <img
            key={`${message.id}-${index}`}
            src={attachment.url}
            width={200}
            height={200}
            alt="attached image"
            className="rounded-md object-contain"
          />
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
          <Markdown remarkPlugins={[remarkGfm]}>{thinkContent}</Markdown>
        </div>
      </details>
    )
  );

  const renderContent = () => (
    contentParts.map((part, index) => (
      index % 2 === 0 ? (
        <Markdown key={index} remarkPlugins={[remarkGfm]}>{part}</Markdown>
      ) : (
        <pre className="whitespace-pre-wrap" key={index}>
          <CodeDisplayBlock code={part} />
        </pre>
      )
    ))
  );

  const renderActionButtons = () => (
    message.role === "assistant" && (
      <div className="pt-2 flex gap-1 items-center text-muted-foreground">
        {!isLoading && (
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
        )}
        {!isLoading && isLast && (
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
    )
  );

  return (
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
  );
}

export default memo(OllamaChatMessage, (prevProps, nextProps) => {
  if (nextProps.isLast) return false;
  return prevProps.isLast === nextProps.isLast && prevProps.message === nextProps.message;
});
