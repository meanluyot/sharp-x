import { Hono } from "hono";
import { cache } from "hono/cache";
import sharp from "sharp";

const app = new Hono();

const welcomeStrings = [
  `Hello Hono from Bun ${process.versions.bun}!`,
  "To learn more about Hono + Bun on Vercel, visit https://vercel.com/docs/frameworks/backend/hono",
];

app.get("/", (c) => {
  return c.text(welcomeStrings.join("\n\n"));
});

app.get("/sharp", async (c) => {
  const url = c.req.query("url");
  const width = parseInt(c.req.query("w") || "800");
  const quality = parseInt(c.req.query("q") || "75");

  if (!url) return c.text("Missing URL", 400);

  try {
    // 1. Fetch the original image
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    // 2. Process with Sharp
    const optimized = await sharp(Buffer.from(arrayBuffer))
      .resize({ width })
      .webp({ quality }) // Automatically convert to WebP for better compression
      .toBuffer();

    // 3. Return the image with correct headers
    return c.body(optimized, 200, {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    });
  } catch (error) {
    return c.text("Optimization failed", 500);
  }
});

export default app;
