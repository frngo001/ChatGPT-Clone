import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, AlertCircle, Loader2, Clock, CheckCircle2, Link, Type, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useDatasetStore } from '@/stores/dataset-store'
import { useAuthStore } from '@/stores/auth-store'
import { canWriteDataset } from '@/lib/permissions-helper'

interface AddDataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  datasetId: string
}

interface FileWithProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

interface TextWithProgress {
  text: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

interface UrlWithProgress {
  url: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

export function AddDataDialog({ open, onOpenChange, datasetId }: AddDataDialogProps) {
  const { addBulkDataToDataset, getDatasetById } = useDatasetStore()
  const { auth } = useAuthStore()
  const [files, setFiles] = useState<FileWithProgress[]>([])
  const [texts, setTexts] = useState<TextWithProgress[]>([])
  const [urls, setUrls] = useState<UrlWithProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [newText, setNewText] = useState('')
  const [newUrl, setNewUrl] = useState('')

  const maxSize = 50 * 1024 * 1024 // 50MB in bytes
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/markdown',
    'text/csv',
    'application/json',
    'text/xml',
    'text/html',
    'text/css',
    'application/javascript',
    'application/typescript',
    'text/x-typescript'
  ]

  // Allowed file extensions as fallback when MIME type is not detected
  const allowedExtensions = [
    '.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx', '.xls', '.xlsx',
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.md', '.csv', '.json', '.jsonl', '.xml', '.html', '.css',
    '.js', '.jsx', '.ts', '.tsx'
  ]

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileExtension = (filename: string): string => {
    const lastDot = filename.lastIndexOf('.')
    return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : ''
  }

  const handleFiles = useCallback((selectedFiles: File[]) => {
    const validFiles: FileWithProgress[] = []
    const invalidFiles: string[] = []

    selectedFiles.forEach(file => {
      if (file.size > maxSize) {
        invalidFiles.push(`${file.name} (zu groß: ${formatFileSize(file.size)}, max. 50MB)`)
        return
      }

      // Check MIME type or file extension as fallback
      const fileExtension = getFileExtension(file.name)
      const isValidType = allowedTypes.includes(file.type) || 
                         (file.type === '' && allowedExtensions.includes(fileExtension)) ||
                         allowedExtensions.includes(fileExtension)

      if (!isValidType) {
        invalidFiles.push(`${file.name} (nicht unterstützt: ${file.type || 'unbekannter Typ'})`)
        return
      }

      validFiles.push({
        file,
        progress: 0,
        status: 'pending'
      })
    })

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
    }

    if (invalidFiles.length > 0) {
      toast.error(`${invalidFiles.length} Datei(en) konnten nicht hinzugefügt werden:\n${invalidFiles.join('\n')}`)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFiles,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv'],
      'application/json': ['.json', '.jsonl'],
      'text/xml': ['.xml'],
      'text/html': ['.html'],
      'text/css': ['.css'],
      'application/javascript': ['.js', '.jsx'],
      'application/typescript': ['.ts', '.tsx'],
      'text/x-typescript': ['.tsx']
    },
    multiple: true,
    maxSize: maxSize,
    onDropRejected: (fileRejections) => {
      const rejectedMessages = fileRejections.map(({ file, errors }) => {
        const errorMessages = errors.map(e => e.message).join(', ')
        return `${file.name}: ${errorMessages}`
      })
      toast.error(`Datei(en) abgelehnt:\n${rejectedMessages.join('\n')}`)
    }
  })

  const addText = () => {
    if (newText.trim()) {
      setTexts(prev => [...prev, {
        text: newText.trim(),
        progress: 0,
        status: 'pending'
      }])
      setNewText('')
    }
  }

  const addUrl = () => {
    if (newUrl.trim()) {
      const trimmedUrl = newUrl.trim()
      
      // Validate different URL types
      const isValidUrl = (() => {
        // HTTP/HTTPS URLs
        if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
          try {
            new URL(trimmedUrl)
            return true
          } catch {
            return false
          }
        }
        
        // GitHub URLs
        if (trimmedUrl.startsWith('github.com') || trimmedUrl.startsWith('https://github.com/')) {
          return true
        }
        
        // S3 paths
        if (trimmedUrl.startsWith('s3://')) {
          return true
        }
        
        // Local file paths
        if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('file://') || trimmedUrl.startsWith('file:///')) {
          return true
        }
        
        return false
      })()
      
      if (isValidUrl) {
        setUrls(prev => [...prev, {
          url: trimmedUrl,
          progress: 0,
          status: 'pending'
        }])
        setNewUrl('')
      } else {
        toast.error('Bitte geben Sie eine gültige URL ein (HTTP/HTTPS, GitHub, S3 oder Dateipfad)')
      }
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const removeText = (index: number) => {
    setTexts(prev => prev.filter((_, i) => i !== index))
  }

  const removeUrl = (index: number) => {
    setUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = useCallback(async () => {
    const totalItems = files.length + texts.length + urls.length
    if (totalItems === 0) return

    // Prüfe Berechtigung
    const dataset = getDatasetById(datasetId)
    if (!dataset) {
      toast.error('Dataset nicht gefunden')
      return
    }

    if (!canWriteDataset(auth.user, dataset)) {
      toast.error('Sie haben keine Berechtigung, Daten zu diesem Dataset hinzuzufügen.')
      return
    }

    setIsUploading(true)
    
    // Mark all items as uploading
    setFiles(prev => prev.map(f => ({ ...f, status: 'uploading', progress: 50 })))
    setTexts(prev => prev.map(t => ({ ...t, status: 'uploading', progress: 50 })))
    setUrls(prev => prev.map(u => ({ ...u, status: 'uploading', progress: 50 })))

    try {
      const fileArray = files.map(f => f.file)
      const urlArray = urls.map(u => u.url)
      const textArray = texts.map(t => t.text)

      await addBulkDataToDataset(
        datasetId,
        fileArray.length > 0 ? fileArray : undefined,
        urlArray.length > 0 ? urlArray : undefined,
        textArray.length > 0 ? textArray : undefined
      )

      // Mark all as completed
      setFiles(prev => prev.map(f => ({ ...f, status: 'completed', progress: 100 })))
      setTexts(prev => prev.map(t => ({ ...t, status: 'completed', progress: 100 })))
      setUrls(prev => prev.map(u => ({ ...u, status: 'completed', progress: 100 })))

      setIsUploading(false)

      // Show success toast with summary
      const fileCount = files.length
      const urlCount = urls.length
      const textCount = texts.length
      const parts: string[] = []
      if (fileCount > 0) parts.push(`${fileCount} Datei${fileCount !== 1 ? 'en' : ''}`)
      if (urlCount > 0) parts.push(`${urlCount} URL${urlCount !== 1 ? 's' : ''}`)
      if (textCount > 0) parts.push(`${textCount} Text${textCount !== 1 ? 'e' : ''}`)

      toast.success(`${parts.join(', ')} erfolgreich hinzugefügt`)

      // Close dialog and reset state after short delay
      setTimeout(() => {
        onOpenChange(false)
        setFiles([])
        setTexts([])
        setUrls([])
      }, 500)

    } catch (error) {
      // Mark all as error
      const errorMessage = error instanceof Error ? error.message : 'Upload fehlgeschlagen'
      setFiles(prev => prev.map(f => ({ ...f, status: 'error', error: errorMessage })))
      setTexts(prev => prev.map(t => ({ ...t, status: 'error', error: errorMessage })))
      setUrls(prev => prev.map(u => ({ ...u, status: 'error', error: errorMessage })))

      setIsUploading(false)

      // ✅ Verbesserte kontextspezifische Error-Messages mit Retry-Buttons
      const isRetryable = 
        errorMessage.includes('Network') || 
        errorMessage.includes('fetch') ||
        errorMessage.includes('500') ||
        errorMessage.includes('503') ||
        errorMessage.includes('504') ||
        errorMessage.includes('timeout')

      if (errorMessage.includes('400')) {
        toast.error('Ungültige Daten', {
          description: 'Bitte überprüfen Sie die Eingaben und versuchen Sie es erneut.',
        })
      } else if (errorMessage.includes('403')) {
        toast.error('Sie haben keine Berechtigung für dieses Dataset.')
      } else if (errorMessage.includes('409')) {
        toast.error('Konflikt', {
          description: 'Fehler während der Verarbeitung. Bitte versuchen Sie es später erneut.',
          action: {
            label: 'Erneut versuchen',
            onClick: () => handleUpload(),
          },
        })
      } else if (errorMessage.includes('413')) {
        toast.error('Datei zu groß', {
          description: 'Die Datei überschreitet das maximale Größenlimit. Bitte wählen Sie eine kleinere Datei.',
        })
      } else if (isRetryable) {
        toast.error('Upload fehlgeschlagen', {
          description: 'Verbindung zum Server fehlgeschlagen. Bitte überprüfen Sie Ihre Internetverbindung.',
          duration: 10000,
          action: {
            label: 'Erneut versuchen',
            onClick: () => handleUpload(),
          },
        })
      } else {
        toast.error('Upload fehlgeschlagen', {
          description: errorMessage,
          duration: 8000,
        })
      }
    }
  }, [files, texts, urls, datasetId, addBulkDataToDataset, onOpenChange, getDatasetById, auth.user])

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const getStatusIcon = (status: 'pending' | 'uploading' | 'completed' | 'error') => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'uploading': return <Loader2 className="h-4 w-4 animate-spin" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusText = (status: 'pending' | 'uploading' | 'completed' | 'error') => {
    switch (status) {
      case 'completed': return 'Abgeschlossen'
      case 'error': return 'Fehlgeschlagen'
      case 'uploading': return 'Wird hochgeladen...'
      default: return 'Bereit'
    }
  }

  const totalItems = files.length + texts.length + urls.length

  // Reset state when dialog closes
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setFiles([])
      setTexts([])
      setUrls([])
      setNewText('')
      setNewUrl('')
      setIsUploading(false)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Daten zu Dataset hinzufügen</DialogTitle>
          <DialogDescription>
            Fügen Sie Dateien, Texte oder URLs zu diesem Dataset hinzu.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="files" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Dateien
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="urls" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              URLs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-4">
            <Card 
              {...getRootProps()}
              className={`border-2 border-dashed transition-colors cursor-pointer ${
                isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
            >
              <CardContent className="p-6 text-center">
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Dateien hochladen</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isDragActive 
                    ? 'Dateien hier ablegen...' 
                    : 'Klicken Sie, um Dateien auszuwählen oder ziehen Sie sie hierher'}
                </p>
                <div className="text-xs text-muted-foreground">
                  Unterstützte Formate: PDF, DOC, DOCX, TXT, PPT, PPTX, XLS, XLSX, JPG, PNG, GIF, WEBP, MD, CSV, JSON, XML, HTML, CSS, JS, TS, TSX, JSX, JSONL (max. 50MB)
                </div>
              </CardContent>
            </Card>

            {files.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {files.map((fileWithProgress, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 hover:bg-muted/50 transition-colors rounded">
                    {getStatusIcon(fileWithProgress.status)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {truncateText(fileWithProgress.file.name)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(fileWithProgress.file.size)}
                      </div>
                      {fileWithProgress.status === 'uploading' && (
                        <Progress value={fileWithProgress.progress} className="h-1 mt-1" />
                      )}
                      {fileWithProgress.status === 'error' && fileWithProgress.error && (
                        <div className="text-xs text-red-600 mt-1">
                          {fileWithProgress.error}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getStatusIcon(fileWithProgress.status)}
                        <span>{getStatusText(fileWithProgress.status)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={fileWithProgress.status === 'uploading'}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-3">
              <Textarea
                placeholder="Geben Sie hier Ihren Text ein..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                className="min-h-[100px]"
              />
              <Button onClick={addText} disabled={!newText.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Text hinzufügen
              </Button>
            </div>

            {texts.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {texts.map((textWithProgress, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 hover:bg-muted/50 transition-colors rounded">
                    {getStatusIcon(textWithProgress.status)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {truncateText(textWithProgress.text)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {textWithProgress.text.length} Zeichen
                      </div>
                      {textWithProgress.status === 'uploading' && (
                        <Progress value={textWithProgress.progress} className="h-1 mt-1" />
                      )}
                      {textWithProgress.status === 'error' && textWithProgress.error && (
                        <div className="text-xs text-red-600 mt-1">
                          {textWithProgress.error}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getStatusIcon(textWithProgress.status)}
                        <span>{getStatusText(textWithProgress.status)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeText(index)}
                        disabled={textWithProgress.status === 'uploading'}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="urls" className="space-y-4">
            <div className="space-y-3">
              <Input
                placeholder="https://example.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                type="url"
              />
              <Button onClick={addUrl} disabled={!newUrl.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                URL hinzufügen
              </Button>
            </div>

            {urls.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {urls.map((urlWithProgress, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 hover:bg-muted/50 transition-colors rounded">
                    {getStatusIcon(urlWithProgress.status)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {truncateText(urlWithProgress.url)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        URL
                      </div>
                      {urlWithProgress.status === 'uploading' && (
                        <Progress value={urlWithProgress.progress} className="h-1 mt-1" />
                      )}
                      {urlWithProgress.status === 'error' && urlWithProgress.error && (
                        <div className="text-xs text-red-600 mt-1">
                          {urlWithProgress.error}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getStatusIcon(urlWithProgress.status)}
                        <span>{getStatusText(urlWithProgress.status)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUrl(index)}
                        disabled={urlWithProgress.status === 'uploading'}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleDialogClose(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={totalItems === 0 || isUploading}
          >
            {isUploading ? 'Wird hochgeladen...' : `${totalItems} Element${totalItems !== 1 ? 'e' : ''} hinzufügen`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
