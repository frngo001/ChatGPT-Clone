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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllModels } from "@/hooks/use-models";

interface ModelSelectorProps {
  isLoading?: boolean;
}

export function ModelSelector({ isLoading = false }: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const selectedModel = useOllamaChatStore((state) => state.selectedModel);
  const selectedProvider = useOllamaChatStore((state) => state.selectedProvider);
  const setSelectedModel = useOllamaChatStore((state) => state.setSelectedModel);
  const setSelectedProvider = useOllamaChatStore((state) => state.setSelectedProvider);

  // TanStack Query for model queries
  const { 
    ollamaModels, 
    deepseekModels, 
    isLoading: modelsLoading, 
    isError 
  } = useAllModels();

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setOpen(false);
  };

  const handleProviderChange = (provider: 'ollama' | 'deepseek') => {
    setSelectedProvider(provider);
    setSelectedModel(''); // Reset model when switching providers
  };

  // Extract model names
  const ollamaModelNames = ollamaModels.map(model => model.name);
  const deepseekModelNames = deepseekModels.map(model => model.id);
  
  const currentModels = selectedProvider === 'ollama' ? ollamaModelNames : deepseekModelNames;

  return (
    <div className="flex gap-2">
      <Select value={selectedProvider} onValueChange={handleProviderChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ollama">Ollama</SelectItem>
          <SelectItem value="deepseek">DeepSeek</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            disabled={isLoading}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[220px] justify-between"
          >
            {selectedModel || "Modell auswählen"}
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-1">
          {modelsLoading ? (
            <Button variant="ghost" disabled className="w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Lade Modelle...
            </Button>
          ) : isError ? (
            <Button variant="ghost" disabled className="w-full">
              Fehler beim Laden
            </Button>
          ) : currentModels.length > 0 ? (
            currentModels.map((model) => (
              <Button
                key={model}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  handleModelChange(model);
                }}
              >
                {model}
              </Button>
            ))
          ) : (
            <Button variant="ghost" disabled className="w-full">
              Keine Modelle verfügbar
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

