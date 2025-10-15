import { useState } from 'react'
import { Plus, Search, Filter, Grid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Mock data for now
  const documents = [
    {
      id: '1',
      name: 'Project Documentation',
      type: 'PDF',
      size: 2048576,
      uploadDate: new Date('2024-01-15'),
      tags: ['project', 'documentation'],
    },
    {
      id: '2',
      name: 'Meeting Notes',
      type: 'DOCX',
      size: 512000,
      uploadDate: new Date('2024-01-14'),
      tags: ['meeting', 'notes'],
    },
  ]

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground">
            Manage your documents and files
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>All Documents</DropdownMenuItem>
            <DropdownMenuItem>Recently Uploaded</DropdownMenuItem>
            <DropdownMenuItem>PDF Files</DropdownMenuItem>
            <DropdownMenuItem>Word Documents</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex rounded-md border">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Documents Grid/List */}
      {filteredDocuments.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No documents found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search terms.' : 'Upload your first document to get started.'}
            </p>
            {!searchQuery && (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
            : 'space-y-4'
        }>
          {filteredDocuments.map((document) => (
            <Card
              key={document.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{document.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {document.type} • {formatFileSize(document.size)}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        ⋯
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>View</DropdownMenuItem>
                      <DropdownMenuItem>Download</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Tags */}
                  {document.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {document.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Separator />

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{document.type}</span>
                    <span>{formatDate(document.uploadDate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
