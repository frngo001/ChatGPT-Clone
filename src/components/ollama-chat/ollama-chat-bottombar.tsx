import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cross2Icon,
  StopIcon,
} from "@radix-ui/react-icons";
import { Mic, CircleArrowUp, X } from "lucide-react";
import useSpeechToText from "@/hooks/useSpeechRecognition";
import MultiImagePicker from "@/components/image-embedder";
import useOllamaChatStore from "@/stores/ollama-chat-store";
import type { ChatRequestOptions } from "ai";
import { ChatInput } from "@/components/ui/chat/chat-input";

interface ChatBottombarProps {
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    chatRequestOptions?: ChatRequestOptions
  ) => void;
  isLoading: boolean;
  stop: () => void;
  setInput?: React.Dispatch<React.SetStateAction<string>>;
  input: string;
}

export default function OllamaChatBottombar({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop,
  setInput,
}: ChatBottombarProps) {
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const base64Images = useOllamaChatStore((state) => state.base64Images);
  const setBase64Images = useOllamaChatStore((state) => state.setBase64Images);
  const selectedModel = useOllamaChatStore((state) => state.selectedModel);
  
  const [showError, setShowError] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const { isListening, transcript, error, startListening, stopListening } =
    useSpeechToText({ continuous: true, lang: "de-DE" });

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

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setShowError(false);
    }
  }, [error]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  return (
    <div className="px-4 pb-7 flex justify-between w-full items-center relative ">
      <AnimatePresence>
        {showError && error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-16 left-0 right-0 mx-4 bg-destructive/95 text-destructive-foreground px-4 py-3 rounded-md text-sm shadow-lg flex items-start justify-between gap-2"
          >
            <p className="flex-1">{error}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0 hover:bg-destructive-foreground/20"
              onClick={() => setShowError(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        <form
          onSubmit={handleSubmit}
          className="w-full items-center flex flex-col  bg-accent dark:bg-secondary rounded-lg "
        >
          <ChatInput
            value={isListening ? (transcript.length ? transcript : "") : input}
            ref={inputRef}
            onKeyDown={handleKeyPress}
            onChange={handleInputChange}
            name="message"
            placeholder={!isListening ? "Was willst du wissen?" : "Listening"}
            className="max-h-40 px-6 pt-6 border-0 shadow-none bg-accent rounded-lg text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed dark:bg-secondary"
          />

          <div className="flex w-full items-center p-2">
            {isLoading ? (
              // Loading state
              <div className="flex w-full justify-between">
                <MultiImagePicker disabled onImagesPick={setBase64Images} />
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
                  onImagesPick={setBase64Images}
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
                    <Mic className="size-6" />
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
                    <CircleArrowUp className="size-6" />
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
                        width={40}
                        height={40}
                        className="h-auto rounded-md w-auto max-w-[200px] max-h-[200px]"
                        alt=""
                      />
                    </div>
                    <Button
                      onClick={() => {
                        const updatedImages = (prevImages: string[]) =>
                          prevImages.filter((_, i) => i !== index);
                        setBase64Images(updatedImages(base64Images));
                      }}
                      size="icon"
                      className="absolute -top-1.5 -right-1.5 text-white cursor-pointer  bg-red-500 hover:bg-red-600 w-4 h-4 rounded-full flex items-center justify-center"
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
