import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Cross2Icon, StopIcon } from "@radix-ui/react-icons";
import { Mic, CircleArrowUp, X, ChevronDown, Loader2 } from "lucide-react";
import { GlobeAmericasSolidIcon } from "@/components/ui/icons/heroicons-globe-americas-solid";
import useSpeechToText from "@/hooks/useSpeechRecognition";
import MultiImagePicker from "@/components/image-embedder";
import useOllamaChatStore from "@/stores/ollama-chat-store";
import type { ChatRequestOptions } from "ai";
import { ChatInput } from "@/components/ui/chat/chat-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ButtonWithTooltip from "@/components/button-with-tooltip";
import { ContextMessage } from "@/components/ui/context-message";

/**
 * Props for the OllamaChatBottombar component
 */
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
  contextText?: string | null;
  onRemoveContext?: () => void;
}

/**
 * OllamaChatBottombar - Bottom bar for chat input with extended features
 * 
 * This component provides the input bar for the chat with the following functions:
 * - Text input with multi-line support
 * - Speech-to-text recognition
 * - Multiple image upload
 * - Chat mode switch (General/Cognee)
 * - Web search (optional for General mode)
 * - Image preview with remove function
 * - Auto-hide for error messages
 * 
 * @param {ChatBottombarProps} props - Props for the bottom bar
 * @returns {JSX.Element} Bottom bar component with all input functions
 */
export default function OllamaChatBottombar({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop,
  setInput,
  contextText,
  onRemoveContext,
}: ChatBottombarProps) {
  // Reference for the input field
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Get state from store
  const base64Images = useOllamaChatStore((state) => state.base64Images);
  const setBase64Images = useOllamaChatStore((state) => state.setBase64Images);
  const selectedModel = useOllamaChatStore((state) => state.selectedModel);
  const chatMode = useOllamaChatStore((state) => state.chatMode);
  const setChatMode = useOllamaChatStore((state) => state.setChatMode);
  const selectedDataset = useOllamaChatStore((state) => state.selectedDataset);
  const webSearchEnabled = useOllamaChatStore((state) => state.webSearchEnabled);
  const setWebSearchEnabled = useOllamaChatStore((state) => state.setWebSearchEnabled);

  // Local state for error display
  const [showError, setShowError] = useState(false);

  /**
   * Handler for keyboard events
   * Sends message on Enter (without Shift)
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  // Speech-to-text hook
  const { isListening, transcript, error, startListening, stopListening } =
    useSpeechToText({ continuous: true, lang: "de-DE" });

  /**
   * Toggle for speech recording
   */
  const listen = () => {
    isListening ? stopVoiceInput() : startListening();
  };

  /**
   * Ends speech recording and sets content into input field
   */
  const stopVoiceInput = () => {
    setInput && setInput(transcript.length ? transcript : "");
    stopListening();
  };

  /**
   * Handler for microphone click
   */
  const handleListenClick = () => {
    listen();
  };

  /**
   * Auto-hide for error messages after 5 seconds
   */
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

  /**
   * Auto-focus on input field
   */
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  /**
   * Handler für Bild-Upload: Fügt neue Bilder zu den bestehenden hinzu
   */
  const handleImagesPick = React.useCallback((newImages: string[]) => {
    if (base64Images && base64Images.length > 0) {
      // Füge neue Bilder zu den bestehenden hinzu
      setBase64Images([...base64Images, ...newImages]);
    } else {
      // Setze neue Bilder, wenn keine vorhanden sind
      setBase64Images(newImages);
    }
  }, [base64Images, setBase64Images]);

  return (
    <div className="px-4 pb-7 flex justify-between w-full items-center relative">
      {/* Error banner with animation */}
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

      {/* Main form */}
      <AnimatePresence initial={false}>
        <form
          onSubmit={handleSubmit}
          className="w-full items-center flex flex-col bg-accent dark:bg-secondary rounded-lg px-2 py-2"
        >
          {/* Kontext-Nachricht im Input-Bereich */}
          {contextText && onRemoveContext && (
            <AnimatePresence mode="wait">
              <ContextMessage
                key={contextText}
                text={contextText}
                onRemove={onRemoveContext}
              />
            </AnimatePresence>
          )}
          
          {/* Chat input field */}
          <ChatInput
            value={isListening ? (transcript.length ? transcript : "") : input}
            ref={inputRef}
            onKeyDown={handleKeyPress}
            onChange={handleInputChange}
            name="message"
            placeholder={!isListening ? "Was willst du wissen?" : "Listening"}
            className="max-h-40 px-6 pt-6 border-0 shadow-none bg-accent rounded-lg text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed dark:bg-secondary"
          />

          {/* Button area */}
          <div className="flex w-full items-center p-2">
            {isLoading ? (
              /* Loading state */
              <div className="flex w-full justify-between">
                <MultiImagePicker disabled onImagesPick={setBase64Images} />
                <div className="flex items-center gap-2">
                  <Button
                    className="shrink-0 rounded-full"
                    variant="ghost"
                    size="icon"
                    type="button"
                    disabled
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                  <ButtonWithTooltip toolTipText="Generierung stoppen" side="top">
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        duration: 0.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                      }}
                      className="relative"
                    >
                  <Button
                        className="shrink-0 rounded-full bg-secondary hover:bg-secondary/80 dark:bg-secondary/60 dark:hover:bg-secondary/70 text-foreground dark:text-foreground shadow-lg relative overflow-hidden border-2 border-primary/40 dark:border-primary/50"
                    size="icon"
                        type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      stop();
                    }}
                  >
                        {/* Pulsierender Hintergrund-Effekt */}
                        <motion.div
                          className="absolute inset-0 bg-primary/20 dark:bg-primary/30 rounded-full"
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.4, 0, 0.4],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                        {/* Spinner Animation */}
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <Loader2 className="w-4 h-4 absolute opacity-40 dark:opacity-50 text-primary dark:text-primary" />
                        </motion.div>
                        {/* Stop Icon */}
                        <StopIcon className="w-5 h-5 relative z-10 text-foreground dark:text-foreground" />
                  </Button>
                    </motion.div>
                  </ButtonWithTooltip>
                </div>
              </div>
            ) : (
              /* Default state */
              <div className="flex w-full justify-between">
                {/* Left side: Image picker and mode selection */}
                <div className="flex items-center gap-2">
                  {/* Image upload */}
                  <MultiImagePicker
                    disabled={isLoading}
                    onImagesPick={handleImagesPick}
                  />
                  {/* Chat mode dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        disabled={isLoading}
                      >
                        {chatMode === "general" ? "General" : "Cognee"}
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={() => setChatMode("general")}
                        className={chatMode === "general" ? "bg-accent" : ""}
                      >
                        General Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setChatMode("cognee")}
                        className={chatMode === "cognee" ? "bg-accent" : ""}
                      >
                        Cognee
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {/* Right side: action buttons */}
                <div>
                  {/* Microphone button with animation when listening */}
                  <ButtonWithTooltip
                    toolTipText={
                      isListening
                        ? "Sprachaufnahme stoppen"
                        : "Sprachaufnahme"
                    }
                    side="top"
                  >
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
                  </ButtonWithTooltip>

                  {/* Web search button - only visible in general mode */}
                  {chatMode === "general" && (
                    <ButtonWithTooltip
                      toolTipText={
                        webSearchEnabled
                          ? "Web-Suche deaktivieren"
                          : "Web-Suche aktivieren"
                      }
                      side="top"
                    >
                      <Button
                        className={`shrink-0 rounded-full ${
                          webSearchEnabled
                            ? "bg-primary/30 hover:bg-primary/40"
                            : ""
                        }`}
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                        disabled={isLoading}
                      >
                        <GlobeAmericasSolidIcon
                          className={`size-6 ${
                            webSearchEnabled
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </Button>
                    </ButtonWithTooltip>
                  )}

                  {/* Send button */}
                  <ButtonWithTooltip toolTipText="Send message" side="top">
                    <Button
                      className="shrink-0 rounded-full"
                      variant="ghost"
                      size="icon"
                      type="submit"
                      disabled={
                        isLoading ||
                        !input?.trim() ||
                        isListening ||
                        (chatMode === "general" && !selectedModel) ||
                        (chatMode === "cognee" && !selectedDataset)
                      }
                    >
                      <CircleArrowUp className="size-6" />
                    </Button>
                  </ButtonWithTooltip>
                </div>
              </div>
            )}
          </div>

          {/* Image preview with remove button */}
          {base64Images && base64Images.length > 0 && (
            <div className="w-full px-2 pb-2">
              <div 
                className="flex gap-2 overflow-x-auto pb-1"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
                }}
              >
                {base64Images.map((image, index) => {
                  // Use a combination of index and a portion of the base64 string as key for better uniqueness
                  const imageKey = `${index}-${image.substring(0, 20)}`;
                  return (
                    <div
                      key={imageKey}
                      className="relative bg-muted-foreground/20 flex-shrink-0 rounded-md border border-border overflow-hidden group"
                    >
                      <div className="relative w-32 h-32">
                        <img
                          src={image}
                          alt={`Uploaded image ${index + 1}`}
                          className="w-full h-full object-cover rounded-md"
                        />
                        {/* Remove button */}
                        <Button
                          onClick={() => {
                            const updatedImages = base64Images.filter((_, i) => i !== index);
                            setBase64Images(updatedImages.length > 0 ? updatedImages : null);
                          }}
                          size="icon"
                          className="absolute top-1 right-1 text-white cursor-pointer bg-gray-600 hover:bg-gray-700 w-5 h-5 rounded-full flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity shadow-md"
                          aria-label={`Bild ${index + 1} entfernen`}
                        >
                          <Cross2Icon className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </form>
      </AnimatePresence>
    </div>
  );
}
