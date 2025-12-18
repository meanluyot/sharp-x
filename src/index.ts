import { Hono } from "hono";
import sharp from "sharp";

const app = new Hono();

app.get("/sharp", async (c) => {
  const url = c.req.query("url");
  const width = parseInt(c.req.query("w") || "0", 10);
  const quality = parseInt(c.req.query("q") || "75", 10);

  if (!url || !width) {
    return c.text("URL and width are required", 400);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return c.text("Failed to fetch image", 400);
    }

    const contentType = response.headers.get("content-type");
    const arrayBuffer = await response.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    let transformer = sharp(inputBuffer).resize(width, null, {
      withoutEnlargement: true,
    });

    // Determine output format based on Accept header or default to webp
    const accept = c.req.header("accept") || "";
    let format: keyof sharp.FormatEnum = "webp";
    let mimeType = "image/webp";

    if (accept.includes("image/avif")) {
      format = "avif";
      mimeType = "image/avif";
    } else if (accept.includes("image/webp")) {
      format = "webp";
      mimeType = "image/webp";
    } else if (contentType === "image/jpeg" || contentType === "image/jpg") {
      format = "jpeg";
      mimeType = "image/jpeg";
    } else if (contentType === "image/png") {
      format = "png";
      mimeType = "image/png";
    }

    const outputBuffer = await transformer.toFormat(format, { quality }).toBuffer();

    c.header("Content-Type", mimeType);
    c.header("Cache-Control", "public, max-age=31536000, immutable");
    return c.body(new Uint8Array(outputBuffer));
  } catch (error) {
    console.error("Optimization error:", error);
    return c.text("Internal Server Error", 500);
  }
});

const welcomeStrings = [
  `Hello Hono from Bun ${process.versions.bun}!`,
  "To learn more about Hono + Bun on Vercel, visit https://vercel.com/docs/frameworks/backend/hono",
  "Image optimizer available at /sharp?url=...&w=...&q=...",
];

app.get("/", (c) => {
  return c.text(welcomeStrings.join("\n\n"));
});

export default app;
