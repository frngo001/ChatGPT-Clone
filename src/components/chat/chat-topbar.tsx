"use client";

import React, { useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Button } from "../ui/button";
import { CaretSortIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Message } from "./chat-message";

interface ChatTopbarProps {
  isLoading: boolean;
  chatId?: string;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
  models?: string[];
}

export default function ChatTopbar({
  isLoading,
  chatId,
  messages,
  setMessages,
  selectedModel,
  setSelectedModel,
  models = [],
}: ChatTopbarProps) {
  const [open, setOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const handleModelChange = (model: string) => {
    setSelectedModel && setSelectedModel(model);
    setOpen(false);
  };

  const handleCloseSidebar = () => {
    setSheetOpen(false);
  };

  return (
    <div className="w-full flex px-4 py-6 items-center justify-between lg:justify-center ">
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger>
          <HamburgerMenuIcon className="lg:hidden w-5 h-5" />
        </SheetTrigger>
        <SheetContent side="left">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Chat History</h2>
            <p className="text-sm text-muted-foreground">
              Your conversation history will appear here
            </p>
          </div>
        </SheetContent>
      </Sheet>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            disabled={isLoading}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[300px] justify-between"
          >
            {selectedModel || "Select model"}
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-1">
          {models.length > 0 ? (
            models.map((model) => (
              <Button
                key={model}
                variant="ghost"
                className="w-full"
                onClick={() => {
                  handleModelChange(model);
                }}
              >
                {model}
              </Button>
            ))
          ) : (
            <Button variant="ghost" disabled className=" w-full">
              No models available
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
