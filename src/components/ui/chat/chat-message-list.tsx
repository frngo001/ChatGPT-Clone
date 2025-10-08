import * as React from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  smooth?: boolean;
}

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
  ({ className, children, smooth = false, ...props }, _ref) => {
    const [isAtBottom, setIsAtBottom] = React.useState(true);
    const [autoScrollEnabled, setAutoScrollEnabled] = React.useState(true);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = React.useCallback(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: smooth ? "smooth" : "auto",
        });
      }
    }, [smooth]);

    const checkIfAtBottom = React.useCallback(() => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isAtBottomNow = scrollHeight - scrollTop - clientHeight < 100;
        setIsAtBottom(isAtBottomNow);
      }
    }, []);

    const disableAutoScroll = React.useCallback(() => {
      setAutoScrollEnabled(false);
    }, []);

    React.useEffect(() => {
      const scrollElement = scrollRef.current;
      if (!scrollElement) return;

      const handleScroll = () => {
        checkIfAtBottom();
      };

      scrollElement.addEventListener("scroll", handleScroll);
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }, [checkIfAtBottom]);

    React.useEffect(() => {
      if (autoScrollEnabled) {
        scrollToBottom();
      }
    }, [children, autoScrollEnabled, scrollToBottom]);

    return (
      <div className="relative w-full h-full">
        <div
          className={`flex flex-col w-full h-full p-6 overflow-y-auto ${className}`}
          ref={scrollRef}
          onWheel={disableAutoScroll}
          onTouchMove={disableAutoScroll}
          {...props}
        >
          <div className="flex flex-col gap-6">{children}</div>
        </div>

        {!isAtBottom && (
          <Button
            onClick={() => {
              scrollToBottom();
            }}
            size="icon"
            variant="outline"
            className="absolute bottom-2 left-1/2 transform -translate-x-1/2 inline-flex rounded-full shadow-md"
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }
);

ChatMessageList.displayName = "ChatMessageList";

export { ChatMessageList };
