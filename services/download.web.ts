/**
 * Saves a remote file to the user's machine. A plain `<a download>` is ignored
 * for cross-origin URLs (Supabase Storage, external CDNs), so we fetch the bytes
 * and download them from a same-origin blob URL instead. If the host blocks the
 * fetch (CORS), fall back to opening the file in a new tab.
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  let blob: Blob;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    blob = await res.blob();
  } catch {
    window.open(url, "_blank", "noopener");
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
