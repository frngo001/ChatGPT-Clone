import { useState, useRef, useCallback } from 'react'
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
  const { uploadFileToDataset, addTextToDataset, addUrlToDataset } = useDatasetStore()
  const [files, setFiles] = useState<FileWithProgress[]>([])
  const [texts, setTexts] = useState<TextWithProgress[]>([])
  const [urls, setUrls] = useState<UrlWithProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [newText, setNewText] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
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
      'image/webp'
    ]

    const validFiles: FileWithProgress[] = []
    const invalidFiles: string[] = []

    selectedFiles.forEach(file => {
      if (file.size > maxSize) {
        invalidFiles.push(`${file.name} (zu groß: ${formatFileSize(file.size)}, max. 50MB)`)
        return
      }

      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(`${file.name} (nicht unterstützt: ${file.type})`)
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
  }

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
      try {
        new URL(newUrl.trim()) // Validate URL
        setUrls(prev => [...prev, {
          url: newUrl.trim(),
          progress: 0,
          status: 'pending'
        }])
        setNewUrl('')
      } catch {
        toast.error('Bitte geben Sie eine gültige URL ein')
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

    setIsUploading(true)
    let hasErrors = false
    
    // Upload files
    for (let i = 0; i < files.length; i++) {
      const fileWithProgress = files[i]
      
      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'uploading' } : f
      ))

      try {
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, progress } : f
          ))
        }

        await uploadFileToDataset(datasetId, fileWithProgress.file, {
          fileName: fileWithProgress.file.name,
          fileType: fileWithProgress.file.type,
          fileSize: fileWithProgress.file.size,
        })

        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'completed', progress: 100 } : f
        ))
      } catch (error) {
        hasErrors = true
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload fehlgeschlagen'
          } : f
        ))
      }
    }

    // Upload texts
    for (let i = 0; i < texts.length; i++) {
      const textWithProgress = texts[i]
      
      setTexts(prev => prev.map((t, idx) => 
        idx === i ? { ...t, status: 'uploading' } : t
      ))

      try {
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          setTexts(prev => prev.map((t, idx) => 
            idx === i ? { ...t, progress } : t
          ))
        }

        await addTextToDataset(datasetId, textWithProgress.text)

        setTexts(prev => prev.map((t, idx) => 
          idx === i ? { ...t, status: 'completed', progress: 100 } : t
        ))
      } catch (error) {
        hasErrors = true
        setTexts(prev => prev.map((t, idx) => 
          idx === i ? { 
            ...t, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload fehlgeschlagen'
          } : t
        ))
      }
    }

    // Upload URLs
    for (let i = 0; i < urls.length; i++) {
      const urlWithProgress = urls[i]
      
      setUrls(prev => prev.map((u, idx) => 
        idx === i ? { ...u, status: 'uploading' } : u
      ))

      try {
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          setUrls(prev => prev.map((u, idx) => 
            idx === i ? { ...u, progress } : u
          ))
        }

        await addUrlToDataset(datasetId, urlWithProgress.url)

        setUrls(prev => prev.map((u, idx) => 
          idx === i ? { ...u, status: 'completed', progress: 100 } : u
        ))
      } catch (error) {
        hasErrors = true
        setUrls(prev => prev.map((u, idx) => 
          idx === i ? { 
            ...u, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload fehlgeschlagen'
          } : u
        ))
      }
    }

    setIsUploading(false)
    
    // Auto-close dialog only if no errors occurred
    if (!hasErrors) {
      // Show success toast
      toast.success(`${totalItems} Element${totalItems !== 1 ? 'e' : ''} erfolgreich hinzugefügt`)
      
      // Close dialog and reset state
      onOpenChange(false)
      setFiles([])
      setTexts([])
      setUrls([])
    } else {
      // Show error toast
      toast.error('Einige Elemente konnten nicht hinzugefügt werden')
    }
  }, [files, texts, urls, datasetId, uploadFileToDataset, addTextToDataset, addUrlToDataset, onOpenChange])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

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
              className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <CardContent className="p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Dateien hochladen</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Klicken Sie, um Dateien auszuwählen oder ziehen Sie sie hierher
                </p>
                <div className="text-xs text-muted-foreground">
                  Unterstützte Formate: PDF, DOC, DOCX, TXT, PPT, PPTX, XLS, XLSX, JPG, PNG, GIF, WEBP (max. 50MB)
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
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
