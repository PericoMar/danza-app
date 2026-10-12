const DEFAULT_EXTENSION = "png";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extensionFromUrl(url: string): string {
  const path = url.split(/[?#]/)[0];
  const match = path.match(/\.([a-z0-9]{2,5})$/i);
  return match ? match[1].toLowerCase() : DEFAULT_EXTENSION;
}

/** ("Royal Ballet", "logo", ".../123-img.webp") → "royal-ballet-logo.webp". */
export function buildDownloadFilename(name: string, label: string, url: string): string {
  const stem = [slugify(name), slugify(label)].filter(Boolean).join("-") || "file";
  return `${stem}.${extensionFromUrl(url)}`;
}
