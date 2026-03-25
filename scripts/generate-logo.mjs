import OpenAI from "openai";
import fs from "fs";
import path from "path";
import https from "https";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("Generating logo...");

const response = await openai.images.generate({
  model: "gpt-image-1",
  prompt: 'Can you create a logo for my news tracking website called "Tracker"\n\nI\'m thinking of something modern and minimalistic',
  n: 1,
  size: "1024x1024",
  quality: "auto",
});

const imageUrl = response.data[0].url;
const b64 = response.data[0].b64_json;
const outPath = path.resolve("public/logo.png");

if (b64) {
  fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
  console.log("Logo saved to public/logo.png");
} else if (imageUrl) {
  // Download from URL
  const file = fs.createWriteStream(outPath);
  https.get(imageUrl, (res) => {
    res.pipe(file);
    file.on("finish", () => {
      file.close();
      console.log("Logo saved to public/logo.png");
    });
  });
} else {
  console.error("No image data returned from API.");
  process.exit(1);
}
