"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cross2Icon,
  ImageIcon,
  PaperPlaneIcon,
  StopIcon,
} from "@radix-ui/react-icons";
import { Mic, SendHorizonal } from "lucide-react";
import useSpeechToText from "@/hooks/useSpeechRecognition";
import MultiImagePicker from "../image-embedder";
import { ChatInput } from "../ui/chat/chat-input";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  experimental_attachments?: Array<{
    contentType?: string;
    url: string;
  }>;
}

interface ChatBottombarProps {
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  stop: () => void;
  setInput?: React.Dispatch<React.SetStateAction<string>>;
  input: string;
  base64Images?: string[] | null;
  setBase64Images?: (images: string[] | null) => void;
  selectedModel?: string;
}

export default function ChatBottombar({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop,
  setInput,
  base64Images,
  setBase64Images,
  selectedModel,
}: ChatBottombarProps) {
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const { isListening, transcript, startListening, stopListening } =
    useSpeechToText({ continuous: true });

  const listen = () => {
    isListening ? stopVoiceInput() : startListening();
  };

  const stopVoiceInput = () => {
    setInput && setInput(transcript.length ? transcript : "");
    stopListening();
  };

  const handleListenClick = () => {
    listen();
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  return (
    <div className="px-4 pb-7 flex justify-between w-full items-center relative ">
      <AnimatePresence initial={false}>
        <form
          onSubmit={handleSubmit}
          className="w-full items-center flex flex-col bg-accent dark:bg-card rounded-lg "
        >
          <ChatInput
            value={isListening ? (transcript.length ? transcript : "") : input}
            ref={inputRef}
            onKeyDown={handleKeyPress}
            onChange={handleInputChange}
            name="message"
            placeholder={!isListening ? "Enter your prompt here" : "Listening"}
            className="max-h-40 px-6 pt-6 border-0 shadow-none bg-accent rounded-lg text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed dark:bg-card"
          />

          <div className="flex w-full items-center p-2">
            {isLoading ? (
              // Loading state
              <div className="flex w-full justify-between">
                <MultiImagePicker 
                  disabled 
                  onImagesPick={setBase64Images || (() => {})} 
                />
                <div>
                  <Button
                    className="shrink-0 rounded-full"
                    variant="ghost"
                    size="icon"
                    type="button"
                    disabled
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                  <Button
                    className="shrink-0 rounded-full"
                    variant="ghost"
                    size="icon"
                    type="submit"
                    onClick={(e) => {
                      e.preventDefault();
                      stop();
                    }}
                  >
                    <StopIcon className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ) : (
              // Default state
              <div className="flex w-full justify-between">
                <MultiImagePicker
                  disabled={isLoading}
                  onImagesPick={setBase64Images || (() => {})}
                />
                <div>
                  {/* Microphone button with animation when listening */}
                  <Button
                    className={`shrink-0 rounded-full ${
                      isListening
                        ? "relative bg-blue-500/30 hover:bg-blue-400/30"
                        : ""
                    }`}
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={handleListenClick}
                    disabled={isLoading}
                  >
                    <Mic className="w-5 h-5" />
                    {isListening && (
                      <span className="animate-pulse absolute h-[120%] w-[120%] rounded-full bg-blue-500/30" />
                    )}
                  </Button>

                  {/* Send button */}
                  <Button
                    className="shrink-0 rounded-full"
                    variant="ghost"
                    size="icon"
                    type="submit"
                    disabled={
                      isLoading ||
                      !input?.trim() ||
                      isListening ||
                      !selectedModel
                    }
                  >
                    <SendHorizonal className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          {base64Images && (
            <div className="w-full flex px-2 pb-2 gap-2 ">
              {base64Images.map((image, index) => {
                return (
                  <div
                    key={index}
                    className="relative bg-muted-foreground/20 flex w-fit flex-col gap-2 p-1 border-t border-x rounded-md"
                  >
                    <div className="flex text-sm">
                      <img
                        src={image}
                        width={20}
                        height={20}
                        className="h-auto rounded-md w-auto max-w-[100px] max-h-[100px]"
                        alt={""}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        const updatedImages = (prevImages: string[]) =>
                          prevImages.filter((_, i) => i !== index);
                        setBase64Images && setBase64Images(updatedImages(base64Images));
                      }}
                      size="icon"
                      className="absolute -top-1.5 -right-1.5 text-white cursor-pointer bg-red-500 hover:bg-red-600 w-4 h-4 rounded-full flex items-center justify-center"
                    >
                      <Cross2Icon className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </form>
      </AnimatePresence>
    </div>
  );
}
