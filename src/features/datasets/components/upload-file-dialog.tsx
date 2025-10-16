import { useState, useRef, useCallback } from 'react'
import { Upload, X, AlertCircle, Loader2, Clock, CheckCircle2 } from 'lucide-react'
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
import { toast } from 'sonner'
import { useDatasetStore } from '@/stores/dataset-store'

interface UploadFileDialogProps {
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

export function UploadFileDialog({ open, onOpenChange, datasetId }: UploadFileDialogProps) {
  const { uploadFileToDataset } = useDatasetStore()
  const [files, setFiles] = useState<FileWithProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
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
      // Check file size
      if (file.size > maxSize) {
        invalidFiles.push(`${file.name} (zu groß: ${formatFileSize(file.size)}, max. 50MB)`)
        return
      }

      // Check file type
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

    // Add valid files
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
    }

    // Show error message for invalid files
    if (invalidFiles.length > 0) {
      toast.error(`${invalidFiles.length} Datei(en) konnten nicht hinzugefügt werden:\n${invalidFiles.join('\n')}`)
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return

    setIsUploading(true)
    
    for (let i = 0; i < files.length; i++) {
      const fileWithProgress = files[i]
      
      // Update status to uploading
      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'uploading' } : f
      ))

      try {
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, progress } : f
          ))
        }

        // Upload file to dataset via API
        await uploadFileToDataset(datasetId, fileWithProgress.file, {
          fileName: fileWithProgress.file.name,
          fileType: fileWithProgress.file.type,
          fileSize: fileWithProgress.file.size,
        })

        // Mark as completed
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'completed', progress: 100 } : f
        ))

      } catch (error) {
        // Mark as error
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload fehlgeschlagen'
          } : f
        ))
      }
    }

    setIsUploading(false)
    
    // Auto-close dialog only when ALL files are successfully uploaded
    setTimeout(() => {
      setFiles(currentFiles => {
        const allCompleted = currentFiles.every(f => f.status === 'completed')
        const hasErrors = currentFiles.some(f => f.status === 'error')
        
        // Only close if all files are completed and no errors occurred
        if (allCompleted && !hasErrors && currentFiles.length > 0) {
          onOpenChange(false)
          return []
        }
        
        return currentFiles
      })
    }, 100)
  }, [files, datasetId, uploadFileToDataset, onOpenChange])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const truncateFileName = (fileName: string, maxLength: number = 30) => {
    if (fileName.length <= maxLength) return fileName
    return fileName.substring(0, maxLength) + '...'
  }

  const getStatusIcon = (status: FileWithProgress['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'uploading': return <Loader2 className="h-4 w-4  animate-spin" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusText = (status: FileWithProgress['status']) => {
    switch (status) {
      case 'completed': return 'Abgeschlossen'
      case 'error': return 'Fehlgeschlagen'
      case 'uploading': return 'Wird hochgeladen...'
      default: return 'Bereit'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dateien hochladen</DialogTitle>
          <DialogDescription>
            Wählen Sie Dateien aus, die zu diesem Dataset hochgeladen werden sollen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
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

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((fileWithProgress, index) => (
                <div key={index} className="flex items-center gap-3 p-2 hover:bg-muted/50 transition-colors rounded">
                  {getStatusIcon(fileWithProgress.status)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {truncateFileName(fileWithProgress.file.name)}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? 'Wird hochgeladen...' : `${files.length} Datei${files.length !== 1 ? 'en' : ''} hochladen`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
