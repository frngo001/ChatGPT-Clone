import React, { useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CaretSortIcon } from "@radix-ui/react-icons";
import useOllamaChatStore from "@/stores/ollama-chat-store";

interface ModelSelectorProps {
  isLoading?: boolean;
}

export function ModelSelector({ isLoading = false }: ModelSelectorProps) {
  const [models, setModels] = React.useState<string[]>([]);
  const [open, setOpen] = React.useState(false);
  const selectedModel = useOllamaChatStore((state) => state.selectedModel);
  const setSelectedModel = useOllamaChatStore((state) => state.setSelectedModel);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/tags");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

        const data = await res.json().catch(() => null);
        if (!data?.models?.length) return;

        setModels(data.models.map(({ name }: { name: string }) => name));
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    })();
  }, []);

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={isLoading}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[350px] justify-between"
        >
          {selectedModel || "Modell auswählen"}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-1">
        {models.length > 0 ? (
          models.map((model) => (
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
  );
}

