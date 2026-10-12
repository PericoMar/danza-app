import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

/**
 * Downloads a remote file into the cache and opens the system share sheet, from
 * which the user can save it to Photos/Files or send it elsewhere.
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const { uri, status } = await FileSystem.downloadAsync(url, FileSystem.cacheDirectory + filename);
  if (status < 200 || status >= 300) throw new Error(`Download failed (HTTP ${status}).`);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device.");
  }
  await Sharing.shareAsync(uri, { dialogTitle: filename });
}
