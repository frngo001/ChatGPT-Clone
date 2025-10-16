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
import { useDatasetStore } from "@/stores/dataset-store";

interface DatasetSelectorProps {
  isLoading?: boolean;
}

export function DatasetSelector({ isLoading = false }: DatasetSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDataset = useOllamaChatStore((state) => state.selectedDataset);
  const setSelectedDataset = useOllamaChatStore((state) => state.setSelectedDataset);
  
  // Get datasets from store
  const { datasets, isLoading: datasetsLoading, error } = useDatasetStore();

  // Filter datasets that have at least one file
  const availableDatasets = datasets.filter(dataset => dataset.files && dataset.files.length > 0);

  const handleDatasetChange = (datasetName: string) => {
    setSelectedDataset(datasetName);
    setOpen(false);
  };

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            disabled={isLoading}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[220px] justify-between"
          >
            {selectedDataset || "Dataset auswählen"}
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-1">
          {datasetsLoading ? (
            <Button variant="ghost" disabled className="w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Lade Datasets...
            </Button>
          ) : error ? (
            <Button variant="ghost" disabled className="w-full">
              Fehler beim Laden
            </Button>
          ) : availableDatasets.length > 0 ? (
            availableDatasets.map((dataset) => (
              <Button
                key={dataset.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  handleDatasetChange(dataset.name);
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{dataset.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {dataset.files.length} Datei{dataset.files.length !== 1 ? 'en' : ''}
                  </span>
                </div>
              </Button>
            ))
          ) : (
            <Button variant="ghost" disabled className="w-full">
              Keine Datasets verfügbar
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
