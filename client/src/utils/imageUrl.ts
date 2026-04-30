import { API_BASE_URL } from "./apiConfig";

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const FALLBACK_IMAGE_URL = "/images/placeholder.jpg";

export function resolveImageUrl(image?: string | null, fallback = FALLBACK_IMAGE_URL) {
  if (!image) return fallback;

  const safeImage = image.replace(/\\/g, "/").trim();

  if (safeImage.startsWith("http://localhost:5000/api")) {
    return encodeURI(safeImage.replace("http://localhost:5000/api", API_BASE_URL));
  }

  if (safeImage.startsWith("http://localhost:5000")) {
    return encodeURI(safeImage.replace("http://localhost:5000", API_ORIGIN));
  }

  if (safeImage.startsWith("http")) {
    return encodeURI(safeImage);
  }

  if (safeImage.startsWith("/")) {
    return encodeURI(`${API_ORIGIN}${safeImage}`);
  }

  return encodeURI(`${API_ORIGIN}/${safeImage}`);
}
