import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Download, Edit, Trash2, FileText, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useDatasetStore } from '@/stores/dataset-store'
import { DeleteFileDialog } from './delete-file-dialog'

export function FileDetailPage() {
  const { datasetId, fileId } = useParams({ 
    from: '/_authenticated/library/datasets/$datasetId/files/$fileId' 
  })
  const navigate = useNavigate()
  const { getDatasetById } = useDatasetStore()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const dataset = getDatasetById(datasetId)
  const file = dataset?.files.find(f => f.id === fileId)

  if (!dataset || !file) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold">File not found</h3>
          <p className="text-muted-foreground mb-4">
            The file you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate({ to: `/library/datasets/${datasetId}` })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dataset
          </Button>
        </div>
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type === 'text/url') return '🔗'
    if (type.includes('image')) return '🖼️'
    if (type.includes('pdf')) return '📄'
    if (type.includes('text')) return '📝'
    if (type.includes('video')) return '🎥'
    if (type.includes('audio')) return '🎵'
    return '📁'
  }

  const handleDeleteFile = () => {
    setShowDeleteDialog(true)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: `/library/datasets/${datasetId}` })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dataset
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-2xl">{getFileIcon(file.type)}</span>
            {file.name}
          </h1>
          <p className="text-muted-foreground">
            From dataset: {dataset.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleDeleteFile}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* File Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">File Information</CardTitle>
          <CardDescription>
            Details about this file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">File Name</h4>
                {file.type === 'text/url' || file.type === 'text/uri-list' ? (
                  <a
                    href={file.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 w-fit"
                  >
                    {file.name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-sm">{file.name}</p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">File Type</h4>
                <p className="text-sm">{file.type}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">File Size</h4>
                <p className="text-sm">{formatFileSize(file.size)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Upload Date</h4>
                <p className="text-sm">{formatDate(file.uploadDate)}</p>
              </div>
            </div>

            <Separator />

            {/* Dataset Info */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Dataset</h4>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{dataset.name}</Badge>
                <span className="text-sm text-muted-foreground">
                  {dataset.files.length} files total
                </span>
              </div>
              {dataset.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {dataset.description}
                </p>
              )}
            </div>

            {/* Tags */}
            {dataset.tags.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {dataset.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Content Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">File Content</CardTitle>
          <CardDescription>
            Preview of the file content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-center">
            <div className="space-y-4">
              <div className="text-6xl">{getFileIcon(file.type)}</div>
              <div>
                <h3 className="text-lg font-semibold">{file.name}</h3>
                <p className="text-muted-foreground">
                  {file.type} • {formatFileSize(file.size)}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download File
                </Button>
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  View Content
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DeleteFileDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        datasetId={datasetId}
        fileId={fileId}
        fileName={file.name}
        onSuccess={() => {
          // Navigate back to dataset after successful deletion
          navigate({ to: `/library/datasets/${datasetId}` })
        }}
      />
    </div>
  )
}
