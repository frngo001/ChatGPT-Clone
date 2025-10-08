"use client";

import React, { useState } from "react";
import { ChatLayout } from "./chat-layout";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { v4 as uuidv4 } from "uuid";
import { Header } from "@/components/layout/header";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { ProfileDropdown } from "@/components/profile-dropdown";

export default function OllamaChatPage() {
  // Generate a temporary ID for new chats - will be replaced when first message is sent
  const [id] = useState(() => `new-chat-${Date.now()}`);
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState("");

  const onOpenChange = (isOpen: boolean) => {
    if (userName) return setOpen(isOpen);
    setUserName("Anonymous");
    setOpen(isOpen);
  };

  const handleSetUserName = () => {
    if (userName.trim()) {
      setOpen(false);
    }
  };

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main Content ===== */}
      <main className="flex h-[calc(100dvh-4rem)] flex-col items-center">
        <Dialog open={open} onOpenChange={onOpenChange}>
          <ChatLayout
            key={id}
            id={id}
            initialMessages={[]}
            selectedModel="gpt-4"
            setSelectedModel={() => {}}
            models={["gpt-4", "gpt-3.5-turbo", "claude-3", "llama-2"]}
          />
          <DialogContent className="flex flex-col space-y-4">
            <DialogHeader className="space-y-2">
              <DialogTitle>Welcome to CHTGPT Clone!</DialogTitle>
              <DialogDescription>
                Enter your name to get started. This is just to personalize your
                experience.
              </DialogDescription>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Name</Label>
                  <Input
                    id="username"
                    placeholder="Enter your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSetUserName();
                      }
                    }}
                  />
                </div>
                <Button onClick={handleSetUserName} className="w-full">
                  Get Started
                </Button>
              </div>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
