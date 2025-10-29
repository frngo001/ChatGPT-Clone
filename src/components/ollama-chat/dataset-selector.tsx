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

/**
 * Props für die DatasetSelector-Komponente
 */
interface DatasetSelectorProps {
  isLoading?: boolean;
}

/**
 * DatasetSelector - Komponente zur Auswahl von Datasets für Cognee
 * 
 * Diese Komponente ermöglicht es dem Benutzer, ein Dataset für den Cognee-Modus
 * auszuwählen. Sie filtert nur verarbeitete Datasets und zeigt Warnungen für
 * noch nicht verarbeitete Datasets an. Die Komponente wählt automatisch das
 * erste verfügbare verarbeitete Dataset als Standard.
 * 
 * @param {DatasetSelectorProps} props - Props für den DatasetSelector
 * @param {boolean} props.isLoading - Gibt an, ob der Selector gerade lädt
 * 
 * @returns {JSX.Element} Selector für Dataset-Auswahl mit Warnungen
 */
export function DatasetSelector({ isLoading = false }: DatasetSelectorProps) {
  // Local state für Popover-Öffnung
  const [open, setOpen] = React.useState(false);

  // Zustand aus dem Chat-Store holen
  const selectedDataset = useOllamaChatStore((state) => state.selectedDataset);
  const setSelectedDataset = useOllamaChatStore((state) => state.setSelectedDataset);

  // Lade Datasets aus dem Dataset-Store
  const { datasets, isLoading: datasetsLoading, error, invalidateDatasetCache } =
    useDatasetStore();
  
  /**
   * Reset das ausgewählte Dataset, wenn es nicht mehr verfügbar oder nicht verarbeitet ist
   */
  React.useEffect(() => {
    if (selectedDataset && datasets.length > 0) {
      const dataset = datasets.find((d) => d.id === selectedDataset);
      if (!dataset || dataset.processingStatus !== "DATASET_PROCESSING_COMPLETED") {
        setSelectedDataset(null);
      }
    }
  }, [selectedDataset, datasets, setSelectedDataset]);

  /**
   * Setze Standard-Dataset auf das erste verfügbare verarbeitete Dataset
   */
  React.useEffect(() => {
    if (!datasetsLoading && !error && datasets.length > 0) {
      // Filtere Datasets, die mindestens eine Datei haben und verarbeitet sind
      const availableDatasets = datasets.filter(
        (dataset) =>
          dataset.files &&
          dataset.files.length > 0 &&
          dataset.processingStatus === "DATASET_PROCESSING_COMPLETED"
      );

      if (availableDatasets.length > 0) {
        // Wenn kein Dataset ausgewählt ist, wähle das erste verfügbare
        if (!selectedDataset) {
          setSelectedDataset(availableDatasets[0].id);
        }
        // Wenn das ausgewählte Dataset nicht in der verfügbaren Liste ist, setze erstes verfügbares
        else if (!availableDatasets.find((d) => d.id === selectedDataset)) {
          setSelectedDataset(availableDatasets[0].id);
        }
      }
    }
  }, [datasetsLoading, error, datasets, selectedDataset, setSelectedDataset]);
  
  // Hole den Namen des ausgewählten Datasets für die Anzeige
  const selectedDatasetName = selectedDataset
    ? datasets.find((d) => d.id === selectedDataset)?.name || selectedDataset
    : null;

  // Prüfe, ob das ausgewählte Dataset verarbeitet ist
  const selectedDatasetData = selectedDataset
    ? datasets.find((d) => d.id === selectedDataset)
    : null;
  const isSelectedDatasetProcessed =
    selectedDatasetData?.processingStatus === "DATASET_PROCESSING_COMPLETED";

  // Filtere Datasets, die mindestens eine Datei haben und verarbeitet sind
  const availableDatasets = datasets.filter(
    (dataset) =>
      dataset.files &&
      dataset.files.length > 0 &&
      dataset.processingStatus === "DATASET_PROCESSING_COMPLETED"
  );

  // Hole Datasets, die noch verarbeitet werden
  const processingDatasets = datasets.filter(
    (dataset) =>
      dataset.files &&
      dataset.files.length > 0 &&
      dataset.processingStatus &&
      dataset.processingStatus !== "DATASET_PROCESSING_COMPLETED" &&
      dataset.processingStatus !== "DATASET_PROCESSING_ERRORED"
  );

  /**
   * Handler für Dataset-Änderung
   * Invalidiert den Cache vor der Änderung, um frischen Daten zu gewährleisten
   */
  const handleDatasetChange = (datasetId: string) => {
    // Invalidiere Cache vor Dataset-Änderung für frische Daten
    invalidateDatasetCache(datasetId);
    setSelectedDataset(datasetId);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Warnung, wenn das ausgewählte Dataset nicht verarbeitet ist */}
      {selectedDataset && !isSelectedDatasetProcessed && (
        <Alert
          variant="destructive"
          className="w-[220px] border-2 border-red-500 bg-red-950/50"
        >
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <AlertDescription className="text-sm font-medium text-red-200">
            ⚠️ Dataset wird noch verarbeitet oder ist nicht bereit!
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        {/* Dataset-Auswahl Popover */}
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
            {/* Lade-Zustand */}
            {datasetsLoading ? (
              <Button variant="ghost" disabled className="w-full">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Lade Datasets...
              </Button>
            ) : error ? (
              /* Fehler-Zustand */
              <Button variant="ghost" disabled className="w-full">
                Fehler beim Laden
              </Button>
            ) : availableDatasets.length > 0 || processingDatasets.length > 0 ? (
              <>
                {/* Zeige verarbeitete Datasets */}
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
                        {dataset.files.length} Datei{dataset.files.length !== 1 ? "en" : ""} -
                        Bereit
                      </span>
                    </div>
                  </Button>
                ))}

                {/* Zeige Datasets in Verarbeitung */}
                {processingDatasets.map((dataset) => (
                  <Button
                    key={dataset.id}
                    variant="ghost"
                    disabled
                    className="w-full justify-start"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-muted-foreground">
                        {dataset.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {dataset.files.length} Datei{dataset.files.length !== 1 ? "en" : ""} -
                        Verarbeitung läuft...
                      </span>
                    </div>
                  </Button>
                ))}
              </>
            ) : (
              /* Keine Datasets verfügbar */
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
