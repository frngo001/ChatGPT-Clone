import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Loader2, AlertTriangle } from "lucide-react";
import useOllamaChatStore from "@/stores/ollama-chat-store";
import { useDatasetStore } from "@/stores/dataset-store";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DatasetSelectorProps {
  isLoading?: boolean;
}

export function DatasetSelector({ isLoading = false }: DatasetSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDataset = useOllamaChatStore((state) => state.selectedDataset);
  const setSelectedDataset = useOllamaChatStore((state) => state.setSelectedDataset);
  
  // Get datasets from store
  const { datasets, isLoading: datasetsLoading, error } = useDatasetStore();
  
  // Reset selected dataset if it's no longer available or not processed
  React.useEffect(() => {
    if (selectedDataset && datasets.length > 0) {
      const dataset = datasets.find(d => d.id === selectedDataset);
      if (!dataset || dataset.processingStatus !== 'DATASET_PROCESSING_COMPLETED') {
        setSelectedDataset(null);
      }
    }
  }, [selectedDataset, datasets, setSelectedDataset]);
  
  // Get selected dataset name for display
  const selectedDatasetName = selectedDataset 
    ? datasets.find(d => d.id === selectedDataset)?.name || selectedDataset
    : null;

  // Check if selected dataset is processed
  const selectedDatasetData = selectedDataset 
    ? datasets.find(d => d.id === selectedDataset)
    : null;
  const isSelectedDatasetProcessed = selectedDatasetData?.processingStatus === 'DATASET_PROCESSING_COMPLETED';

  // Filter datasets that have at least one file and are processed
  const availableDatasets = datasets.filter(dataset => 
    dataset.files && 
    dataset.files.length > 0 && 
    dataset.processingStatus === 'DATASET_PROCESSING_COMPLETED'
  );

  // Get datasets that are still processing
  const processingDatasets = datasets.filter(dataset => 
    dataset.files && 
    dataset.files.length > 0 && 
    dataset.processingStatus && 
    dataset.processingStatus !== 'DATASET_PROCESSING_COMPLETED' &&
    dataset.processingStatus !== 'DATASET_PROCESSING_ERRORED'
  );

  const handleDatasetChange = (datasetId: string) => {
    setSelectedDataset(datasetId);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Warning if selected dataset is not processed */}
      {selectedDataset && !isSelectedDatasetProcessed && (
        <Alert variant="destructive" className="w-[220px] border-2 border-red-500 bg-red-950/50">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <AlertDescription className="text-sm font-medium text-red-200">
            ⚠️ Dataset wird noch verarbeitet oder ist nicht bereit!
          </AlertDescription>
        </Alert>
      )}
      
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
            {selectedDatasetName || "Dataset auswählen"}
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
          ) : availableDatasets.length > 0 || processingDatasets.length > 0 ? (
            <>
              {/* Show processed datasets */}
              {availableDatasets.map((dataset) => (
                <Button
                  key={dataset.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    handleDatasetChange(dataset.id);
                  }}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{dataset.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {dataset.files.length} Datei{dataset.files.length !== 1 ? 'en' : ''} - Bereit
                    </span>
                  </div>
                </Button>
              ))}
              
              {/* Show processing datasets */}
              {processingDatasets.map((dataset) => (
                <Button
                  key={dataset.id}
                  variant="ghost"
                  disabled
                  className="w-full justify-start"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-muted-foreground">{dataset.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {dataset.files.length} Datei{dataset.files.length !== 1 ? 'en' : ''} - Verarbeitung läuft...
                    </span>
                  </div>
                </Button>
              ))}
            </>
          ) : (
            <Button variant="ghost" disabled className="w-full">
              Keine Datasets verfügbar
            </Button>
          )}
        </PopoverContent>
      </Popover>
      </div>
    </div>
  );
}
