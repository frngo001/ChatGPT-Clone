import { useState, useEffect } from 'react'
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core'
import { searchPlugin } from '@react-pdf-viewer/search'
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { useDatasetStore } from '@/stores/dataset-store'
import { datasetsApi } from '@/lib/api/datasets-api'

// CSS imports for @react-pdf-viewer
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'

interface PdfPreviewSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileId: string
  fileName: string
  datasetId: string
}

export function PdfPreviewSheet({
  open,
  onOpenChange,
  fileId,
  fileName,
  datasetId,
}: PdfPreviewSheetProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number | null>(null)
  
  const { downloadDatasetFile } = useDatasetStore()

  // Initialize plugins
  const searchPluginInstance = searchPlugin()
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [defaultTabs[0]], // Only show thumbnails
  })

  // Load PDF function
  const loadPdf = async () => {
    setIsLoading(true)
    setError(null)

    // Cleanup previous URL
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
    }

    try {
      const blob = await datasetsApi.getRawData(datasetId, fileId)
      
      // Check if it's actually a PDF
      if (blob.type !== 'application/pdf' && !fileName.toLowerCase().endsWith('.pdf')) {
        setError('Nur PDF-Dateien können angezeigt werden')
        setIsLoading(false)
        return
      }

      // Create URL for the blob
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      setIsLoading(false)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          setError('Datei nicht gefunden')
        } else {
          setError('PDF konnte nicht geladen werden')
        }
      } else {
        setError('PDF konnte nicht geladen werden')
      }
      
      setIsLoading(false)
    }
  }

  // Load PDF when sheet opens
  useEffect(() => {
    if (open && fileId && datasetId) {
      loadPdf()
    } else {
      // Reset state and cleanup URL when closed
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
      setPdfUrl(null)
      setError(null)
      setNumPages(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fileId, datasetId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  const handleDownload = async () => {
    try {
      await downloadDatasetFile(datasetId, fileId, fileName)
      toast.success('Datei erfolgreich heruntergeladen')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Herunterladen der Datei'
      toast.error(errorMessage)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:max-w-[900px] p-0 flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="flex flex-col gap-1 min-w-0">
              <SheetTitle className="text-base truncate">{fileName}</SheetTitle>
              <SheetDescription className="text-xs">
                {numPages ? `${numPages} ${numPages === 1 ? 'Seite' : 'Seiten'}` : 'PDF-Vorschau'}
              </SheetDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 px-3 text-xs shrink-0"
            >
              <Download className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </SheetHeader>

        {/* PDF Content */}
        <div className="flex-1 overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">PDF wird geladen...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background z-10">
              <div className="rounded-full bg-destructive/10 p-3">
                <svg
                  className="h-6 w-6 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium">{error}</p>
              <Button size="sm" variant="outline" onClick={loadPdf}>
                Erneut versuchen
              </Button>
            </div>
          )}

          {pdfUrl && !error && (
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <div className="h-full">
                <Viewer
                  fileUrl={pdfUrl}
                  plugins={[searchPluginInstance, defaultLayoutPluginInstance]}
                  defaultScale={SpecialZoomLevel.PageWidth}
                  onDocumentLoad={(e) => {
                    setNumPages(e.doc.numPages)
                  }}
                  theme={{
                    theme: 'auto',
                  }}
                />
              </div>
            </Worker>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

