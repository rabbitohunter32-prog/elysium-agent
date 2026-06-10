import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getGoogleAuthUrl, handleGoogleCallback } from "./googleAuth";

export const googleRouter = router({
  getAuthUrl: publicProcedure.query(async () => {
    const url = await getGoogleAuthUrl();
    return { url };
  }),

  callback: publicProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      const result = await handleGoogleCallback(input.code);
      return result;
    }),
});
