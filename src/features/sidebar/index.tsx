"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Message } from "@/components/chat/chat-message";
import { Bot } from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  messages: Message[];
  isMobile: boolean;
  chatId: string;
}


export function Sidebar({
  isCollapsed,
  messages,
  isMobile,
  chatId,
}: SidebarProps) {

  const sidebarContent = (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center border-b px-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6" />
            <span className="font-semibold">CHTGPT Clone</span>
          </div>
        )}
        {isCollapsed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Bot className="h-6 w-6" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>CHTGPT Clone</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

    </div>
  );

  return (
    <div className={cn(
      "flex h-full w-full flex-col bg-background border-r",
      isCollapsed && "items-center"
    )}>
      {sidebarContent}
    </div>
  );
}
