import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { uploadFile, downloadFile, deleteFile, getFileMetadata } from "./fileUploadHandler";

export const fileUploadRouter = router({
  /**
   * Upload a file to S3 storage
   * Accepts base64 encoded file data
   */
  uploadFile: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1, "Filename is required").max(255),
        fileData: z.string().min(1, "File data is required"), // base64 encoded
        fileType: z.string().min(1, "File type is required"),
        taskId: z.number().optional(),
        description: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Decode base64 to buffer
        const buffer = Buffer.from(input.fileData, "base64");

        // Upload file
        const result = await uploadFile({
          userId: ctx.user.id,
          filename: input.filename,
          fileBuffer: buffer,
          fileType: input.fileType,
          taskId: input.taskId,
          description: input.description,
        });

        return {
          success: true,
          document: result,
        };
      } catch (error) {
        console.error("[FileUpload] Error:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to upload file"
        );
      }
    }),

  /**
   * Get download URL for a file
   */
  getDownloadUrl: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const url = await downloadFile(input.documentId, ctx.user.id);
        return { url };
      } catch (error) {
        console.error("[FileDownload] Error:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to get download URL"
        );
      }
    }),

  /**
   * Delete a file
   */
  deleteFile: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const success = await deleteFile(input.documentId, ctx.user.id);
        return { success };
      } catch (error) {
        console.error("[FileDelete] Error:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to delete file"
        );
      }
    }),

  /**
   * Get file metadata
   */
  getMetadata: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const metadata = await getFileMetadata(input.documentId, ctx.user.id);
        return metadata;
      } catch (error) {
        console.error("[FileMetadata] Error:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to get file metadata"
        );
      }
    }),
});
