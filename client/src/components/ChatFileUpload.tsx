import { useState, useRef } from "react";
import { Upload, X, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ChatFileUploadProps {
  taskId: number;
  onFileUploaded: (file: { id: number; filename: string; fileSize: number }) => void;
}

export function ChatFileUpload({ taskId, onFileUploaded }: ChatFileUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.fileUpload.uploadFile.useMutation();

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File size exceeds 100MB limit");
      return;
    }

    setIsUploading(true);
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = (e.target?.result as string).split(",")[1];
        if (!base64Data) {
          toast.error("Failed to read file");
          setIsUploading(false);
          return;
        }

        try {
          const result = await uploadMutation.mutateAsync({
            filename: file.name,
            fileData: base64Data,
            fileType: file.type || "application/octet-stream",
            taskId,
            description: `Uploaded to task #${taskId}`,
          });

          if (result.success && result.document) {
            toast.success(`File "${file.name}" uploaded successfully`);
            onFileUploaded({
              id: result.document.id,
              filename: result.document.filename,
              fileSize: result.document.fileSize,
            });
            setIsOpen(false);
          }
        } catch (error) {
          toast.error("Failed to upload file");
          console.error(error);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to process file");
      console.error(error);
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
        disabled={isUploading}
      >
        <Upload className="h-4 w-4" />
        {isUploading ? "Uploading..." : "Upload File"}
      </Button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-white dark:bg-slate-950 border border-border rounded-lg shadow-lg p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm">Upload File</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
          >
            <File className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">Drag and drop your file here</p>
            <p className="text-xs text-muted-foreground mb-3">or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isUploading}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Browse Files
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Maximum file size: 100MB
          </p>
        </div>
      )}
    </div>
  );
}
