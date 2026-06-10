import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { uploadFile, downloadFile, deleteFile, getFileMetadata } from "./fileUploadHandler";
import * as db from "./db";

// Mock the storage module
vi.mock("./storage", () => ({
  storagePut: vi.fn(async (key: string, data: Buffer, type: string) => ({
    url: `/manus-storage/${key}`,
    key: key,
  })),
  storageGet: vi.fn(async (key: string) => ({
    url: `/manus-storage/${key}?signed=true`,
    key: key,
  })),
}));

describe("File Upload Handler", () => {
  const mockUserId = 1;
  const mockTaskId = 123;
  const mockFilename = "test-document.pdf";
  const mockFileBuffer = Buffer.from("PDF content here");
  const mockFileType = "application/pdf";

  describe("uploadFile", () => {
    it("should upload a file successfully", async () => {
      const result = await uploadFile({
        userId: mockUserId,
        filename: mockFilename,
        fileBuffer: mockFileBuffer,
        fileType: mockFileType,
        taskId: mockTaskId,
      });

      expect(result).toBeDefined();
      expect(result.filename).toBe(mockFilename);
      expect(result.fileSize).toBe(mockFileBuffer.length);
      expect(result.documentType).toBe("uploaded");
      expect(result.storageUrl).toContain("/manus-storage/");
    });

    it("should reject empty filename", async () => {
      await expect(
        uploadFile({
          userId: mockUserId,
          filename: "",
          fileBuffer: mockFileBuffer,
          fileType: mockFileType,
        })
      ).rejects.toThrow("Filename is required");
    });

    it("should reject empty file buffer", async () => {
      await expect(
        uploadFile({
          userId: mockUserId,
          filename: mockFilename,
          fileBuffer: Buffer.from(""),
          fileType: mockFileType,
        })
      ).rejects.toThrow("File buffer is required");
    });

    it("should reject files exceeding 100MB", async () => {
      const largeBuffer = Buffer.alloc(101 * 1024 * 1024);
      await expect(
        uploadFile({
          userId: mockUserId,
          filename: mockFilename,
          fileBuffer: largeBuffer,
          fileType: mockFileType,
        })
      ).rejects.toThrow("File size exceeds 100MB limit");
    });

    it("should sanitize filename", async () => {
      const result = await uploadFile({
        userId: mockUserId,
        filename: "test@#$%^&*().pdf",
        fileBuffer: mockFileBuffer,
        fileType: mockFileType,
      });

      expect(result.filename).not.toContain("@");
      expect(result.filename).not.toContain("#");
    });

    it("should include task ID in storage key", async () => {
      const result = await uploadFile({
        userId: mockUserId,
        filename: mockFilename,
        fileBuffer: mockFileBuffer,
        fileType: mockFileType,
        taskId: mockTaskId,
      });

      expect(result.storageKey).toContain(`uploads/${mockUserId}/`);
    });
  });

  describe("downloadFile", () => {
    it("should return download URL for authorized user", async () => {
      // First upload a file
      const uploaded = await uploadFile({
        userId: mockUserId,
        filename: mockFilename,
        fileBuffer: mockFileBuffer,
        fileType: mockFileType,
      });

      // Then download it
      const url = await downloadFile(uploaded.id, mockUserId);
      expect(url).toContain("/manus-storage/");
      expect(url).toContain("signed=true");
    });

    it("should reject download for unauthorized user", async () => {
      const uploaded = await uploadFile({
        userId: mockUserId,
        filename: mockFilename,
        fileBuffer: mockFileBuffer,
        fileType: mockFileType,
      });

      await expect(downloadFile(uploaded.id, 999)).rejects.toThrow(
        "Access denied"
      );
    });

    it("should reject download for non-existent document", async () => {
      await expect(downloadFile(99999, mockUserId)).rejects.toThrow(
        "Document not found"
      );
    });
  });

  describe("deleteFile", () => {
    it("should delete file for authorized user", async () => {
      const uploaded = await uploadFile({
        userId: mockUserId,
        filename: mockFilename,
        fileBuffer: mockFileBuffer,
        fileType: mockFileType,
      });

      const result = await deleteFile(uploaded.id, mockUserId);
      expect(result).toBe(true);
    });

    it("should reject deletion for unauthorized user", async () => {
      const uploaded = await uploadFile({
        userId: mockUserId,
        filename: mockFilename,
        fileBuffer: mockFileBuffer,
        fileType: mockFileType,
      });

      await expect(deleteFile(uploaded.id, 999)).rejects.toThrow(
        "Access denied"
      );
    });

    it("should reject deletion of non-existent document", async () => {
      await expect(deleteFile(99999, mockUserId)).rejects.toThrow(
        "Document not found"
      );
    });
  });

  describe("getFileMetadata", () => {
    it("should return file metadata for authorized user", async () => {
      const uploaded = await uploadFile({
        userId: mockUserId,
        filename: mockFilename,
        fileBuffer: mockFileBuffer,
        fileType: mockFileType,
        description: "Test document",
      });

      const metadata = await getFileMetadata(uploaded.id, mockUserId);
      expect(metadata.filename).toBe(mockFilename);
      expect(metadata.fileType).toBe(mockFileType);
      expect(metadata.fileSize).toBe(mockFileBuffer.length);
      expect(metadata.description).toBe("Test document");
    });

    it("should reject metadata retrieval for unauthorized user", async () => {
      const uploaded = await uploadFile({
        userId: mockUserId,
        filename: mockFilename,
        fileBuffer: mockFileBuffer,
        fileType: mockFileType,
      });

      await expect(getFileMetadata(uploaded.id, 999)).rejects.toThrow(
        "Access denied"
      );
    });

    it("should reject metadata retrieval for non-existent document", async () => {
      await expect(getFileMetadata(99999, mockUserId)).rejects.toThrow(
        "Document not found"
      );
    });
  });

  describe("File Type Validation", () => {
    it("should accept common document types", async () => {
      const documentTypes = [
        { type: "application/pdf", ext: "pdf" },
        { type: "application/msword", ext: "doc" },
        { type: "text/plain", ext: "txt" },
        { type: "text/csv", ext: "csv" },
      ];

      for (const { type, ext } of documentTypes) {
        const result = await uploadFile({
          userId: mockUserId,
          filename: `test.${ext}`,
          fileBuffer: mockFileBuffer,
          fileType: type,
        });

        expect(result.fileType).toBe(type);
      }
    });

    it("should accept image types", async () => {
      const imageTypes = [
        { type: "image/jpeg", ext: "jpg" },
        { type: "image/png", ext: "png" },
        { type: "image/gif", ext: "gif" },
        { type: "image/webp", ext: "webp" },
      ];

      for (const { type, ext } of imageTypes) {
        const result = await uploadFile({
          userId: mockUserId,
          filename: `test.${ext}`,
          fileBuffer: mockFileBuffer,
          fileType: type,
        });

        expect(result.fileType).toBe(type);
      }
    });
  });


});
