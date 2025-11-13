import { registerFont } from "canvas";
import path from "path";

const fontPath = path.join(process.cwd(), "public", "fonts", "DejaVuSans.ttf");

try {
  registerFont(fontPath, { family: "DejaVu" });
} catch (e) {
  console.log("Font already registered or missing:", e);
}
