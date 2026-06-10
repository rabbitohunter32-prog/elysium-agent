import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { FileText, Download, Trash2, Search, Loader2, Upload, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function DocumentsContent() {
  const { data: documents, isLoading } = trpc.documents.list.useQuery();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocuments = documents?.filter(doc =>
    doc.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileText className="w-5 h-5" />;
    if (fileType.includes("pdf")) return <FileText className="w-5 h-5 text-red-500" />;
    if (fileType.includes("image")) return <FileText className="w-5 h-5 text-blue-500" />;
    if (fileType.includes("text")) return <FileText className="w-5 h-5 text-green-500" />;
    return <FileText className="w-5 h-5" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Document Center</h1>
          </div>
          <p className="text-muted-foreground">
            View and manage all files generated or uploaded by the agent
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-border/50"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload File
            </Button>
          </div>

          {/* Documents List */}
          {isLoading ? (
            <Card className="border-border/50">
              <CardContent className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : filteredDocuments.length > 0 ? (
            <div className="space-y-3">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="border-border/50 hover:bg-accent/5 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 p-3 bg-accent/10 rounded-lg">
                        {getFileIcon(doc.fileType || undefined)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {doc.filename || "Untitled Document"}
                        </h3>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {doc.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(doc.fileSize || undefined)}</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </div>
                          <span className="px-2 py-1 bg-accent/20 rounded text-xs font-medium text-accent-foreground capitalize">
                            {doc.documentType}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(doc.storageUrl || "", doc.filename || "document")}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => toast.info("Delete functionality coming soon")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border/50">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-foreground font-medium mb-2">No documents yet</p>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No documents match your search"
                    : "Documents generated by the agent will appear here"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          {documents && documents.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {documents.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Generated Files
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {documents.filter(d => d.documentType === "generated").length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Size
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {formatFileSize(
                      documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0)
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Documents() {
  return (
    <ProtectedRoute>
      <DocumentsContent />
    </ProtectedRoute>
  );
}
