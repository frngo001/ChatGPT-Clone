import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Loader2 } from "lucide-react";
import useOllamaChatStore from "@/stores/ollama-chat-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllModels } from "@/hooks/use-models";

/**
 * Props for the ModelSelector component
 */
interface ModelSelectorProps {
  isLoading?: boolean;
}

/**
 * ModelSelector - AI model selection component (Ollama or DeepSeek)
 * 
 * This component allows the user to choose between different AI models.
 * It supports both Ollama and DeepSeek models with automatic selection
 * of default models.
 * 
 * @param {ModelSelectorProps} props - Props for ModelSelector
 * @param {boolean} props.isLoading - Indicates if the selector is loading
 * 
 * @returns {JSX.Element} Selector for model and provider selection
 */
export function ModelSelector({ isLoading = false }: ModelSelectorProps) {
  // Local state for popover open status
  const [open, setOpen] = React.useState(false);

  // Get state from store
  const selectedModel = useOllamaChatStore((state) => state.selectedModel);
  const selectedProvider = useOllamaChatStore((state) => state.selectedProvider);
  const setSelectedModel = useOllamaChatStore((state) => state.setSelectedModel);
  const setSelectedProvider = useOllamaChatStore((state) => state.setSelectedProvider);

  // Load models with TanStack Query
  const { ollamaModels, deepseekModels, isLoading: modelsLoading, isError } =
    useAllModels();

  // Extract model names
  const ollamaModelNames = ollamaModels.map((model) => model.name);
  const deepseekModelNames = deepseekModels.map((model) => model.id);

  // Current model list based on selected provider
  const currentModels = selectedProvider === "ollama" ? ollamaModelNames : deepseekModelNames;

  /**
   * Set default model when models are loaded
   * Automatically selects the first available model if no model is selected yet
   */
  React.useEffect(() => {
    if (!modelsLoading && !isError) {
      if (selectedProvider === "deepseek" && deepseekModelNames.length > 0) {
        // For DeepSeek: use "deepseek-chat" as default, otherwise first model
        const defaultModel = deepseekModelNames.includes("deepseek-chat")
          ? "deepseek-chat"
          : deepseekModelNames[0];
        if (!selectedModel || !deepseekModelNames.includes(selectedModel)) {
          setSelectedModel(defaultModel);
        }
      } else if (selectedProvider === "ollama" && ollamaModelNames.length > 0) {
        // For Ollama: use the first model from the list
        if (!selectedModel || !ollamaModelNames.includes(selectedModel)) {
          setSelectedModel(ollamaModelNames[0]);
        }
      }
    }
  }, [
    modelsLoading,
    isError,
    selectedProvider,
    ollamaModelNames,
    deepseekModelNames,
    selectedModel,
    setSelectedModel,
  ]);

  /**
   * Handler for model change
   */
  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setOpen(false);
  };

  /**
   * Handler for provider change
   * Switches between Ollama and DeepSeek and automatically selects the default model
   */
  const handleProviderChange = (provider: "ollama" | "deepseek") => {
    setSelectedProvider(provider);

    // Automatically select the default model for the new provider
    if (provider === "ollama" && ollamaModelNames.length > 0) {
      setSelectedModel(ollamaModelNames[0]);
    } else if (provider === "deepseek" && deepseekModelNames.length > 0) {
      const defaultModel = deepseekModelNames.includes("deepseek-chat")
        ? "deepseek-chat"
        : deepseekModelNames[0];
      setSelectedModel(defaultModel);
    } else {
      setSelectedModel(""); // No models available
    }
  };

  return (
    <div className="flex gap-2">
      {/* Provider selection (Ollama or DeepSeek) */}
      <Select value={selectedProvider} onValueChange={handleProviderChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ollama">Ollama</SelectItem>
          <SelectItem value="deepseek">DeepSeek</SelectItem>
        </SelectContent>
      </Select>

      {/* Model selection popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            disabled={isLoading}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[220px] justify-between"
          >
            <span className="truncate text-left">
              {selectedModel || "Modell auswählen"}
            </span>
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-2" align="start">
          {/* Loading state */}
          {modelsLoading ? (
            <Button variant="ghost" disabled className="w-full justify-start px-3">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading models...
            </Button>
          ) : isError ? (
            /* Error state */
            <Button variant="ghost" disabled className="w-full justify-start px-3">
              Error loading
            </Button>
          ) : currentModels.length > 0 ? (
            /* List of available models */
            <div className="max-h-[300px] overflow-y-auto">
              {currentModels.map((model) => (
                <Button
                  key={model}
                  variant="ghost"
                  className="w-full justify-start text-left px-3 py-2 h-auto"
                  onClick={() => {
                    handleModelChange(model);
                  }}
                >
                  <span className="truncate block w-full">{model}</span>
                </Button>
              ))}
            </div>
          ) : (
            /* No models available */
            <Button variant="ghost" disabled className="w-full justify-start px-3">
              No models available
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

