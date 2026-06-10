import { storagePut, storageGet } from "./storage";
import { getDb } from "./db";
import { documents } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface FileUploadOptions {
  userId: number;
  filename: string;
  fileBuffer: Buffer;
  fileType: string;
  taskId?: number;
  description?: string;
}

export interface FileUploadResult {
  id: number;
  filename: string;
  fileSize: number;
  fileType: string;
  storageUrl: string;
  storageKey: string;
  documentType: "uploaded" | "generated";
  createdAt: Date;
}

/**
 * Upload a file to S3 storage and create a document record
 */
export async function uploadFile(options: FileUploadOptions): Promise<FileUploadResult> {
  const { userId, filename, fileBuffer, fileType, taskId, description } = options;

  if (!filename || filename.trim().length === 0) {
    throw new Error("Filename is required");
  }

  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error("File buffer is required");
  }

  if (fileBuffer.length > 100 * 1024 * 1024) {
    throw new Error("File size exceeds 100MB limit");
  }

  // Sanitize filename
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = `uploads/${userId}/${Date.now()}-${sanitizedFilename}`;

  try {
    // Upload to S3
    const { url: storageUrl, key } = await storagePut(
      storageKey,
      fileBuffer,
      fileType || "application/octet-stream"
    );

    // Create database record
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }

    const result = await db.insert(documents).values({
      userId,
      taskId,
      filename: sanitizedFilename,
      fileType: fileType || "application/octet-stream",
      fileSize: fileBuffer.length,
      storageKey: key,
      storageUrl,
      documentType: "uploaded",
      description: description || null,
    });

    const insertId = result[0]?.insertId;
    if (!insertId) {
      throw new Error("Failed to create document record");
    }

    // Retrieve the created document
    const createdDoc = await db
      .select()
      .from(documents)
      .where(eq(documents.id, insertId as number))
      .limit(1);

    if (!createdDoc[0]) {
      throw new Error("Failed to retrieve created document");
    }

    const doc = createdDoc[0];
    return {
      id: doc.id,
      filename: doc.filename || "",
      fileSize: doc.fileSize || 0,
      fileType: doc.fileType || "",
      storageUrl: doc.storageUrl || "",
      storageKey: doc.storageKey || "",
      documentType: doc.documentType as "uploaded" | "generated",
      createdAt: doc.createdAt,
    };
  } catch (error) {
    console.error("[FileUpload] Upload failed:", error);
    throw error;
  }
}

/**
 * Download a file from S3 storage
 */
export async function downloadFile(documentId: number, userId: number): Promise<string> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }

    // Verify ownership
    const doc = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (!doc[0]) {
      throw new Error("Document not found");
    }

    if (doc[0].userId !== userId) {
      throw new Error("Access denied");
    }

    // Get signed download URL
    const { url } = await storageGet(doc[0].storageKey || "");
    return url;
  } catch (error) {
    console.error("[FileDownload] Download failed:", error);
    throw error;
  }
}

/**
 * Delete a file from S3 storage and database
 */
export async function deleteFile(documentId: number, userId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }

    // Verify ownership
    const doc = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (!doc[0]) {
      throw new Error("Document not found");
    }

    if (doc[0].userId !== userId) {
      throw new Error("Access denied");
    }

    // Delete from database
    await db.delete(documents).where(eq(documents.id, documentId));

    // Note: S3 deletion would require additional AWS SDK setup
    // For now, we rely on database deletion and S3 lifecycle policies
    return true;
  } catch (error) {
    console.error("[FileDelete] Delete failed:", error);
    throw error;
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(documentId: number, userId: number) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }

    const doc = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (!doc[0]) {
      throw new Error("Document not found");
    }

    if (doc[0].userId !== userId) {
      throw new Error("Access denied");
    }

    return {
      id: doc[0].id,
      filename: doc[0].filename,
      fileType: doc[0].fileType,
      fileSize: doc[0].fileSize,
      createdAt: doc[0].createdAt,
      description: doc[0].description,
    };
  } catch (error) {
    console.error("[FileMetadata] Retrieval failed:", error);
    throw error;
  }
}
