import { createServerFn } from "@tanstack/react-start";
import { put, head } from "@vercel/blob";

export const uploadFile = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { fileName: string; contentType: string; base64Data: string }) =>
      input
  )
  .handler(async ({ data }) => {
    const key = `${Date.now()}-${Math.random().toString(36).slice(2)}-${data.fileName}`;
    const buffer = Buffer.from(data.base64Data, "base64");
    await put(key, buffer, {
      access: "public",
      contentType: data.contentType,
    });
    return { key, fileName: data.fileName, contentType: data.contentType };
  });

export const getFileDownloadUrl = createServerFn({ method: "GET" })
  .inputValidator((input: { key: string }) => input)
  .handler(async ({ data }) => {
    try {
      const meta = await head(data.key);
      if (!meta) return null;
      const response = await fetch(meta.url);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return {
        base64Data: base64,
        contentType: meta.contentType || "application/octet-stream",
        fileName: data.key.split("-").slice(3).join("-"),
      };
    } catch {
      return null;
    }
  });
