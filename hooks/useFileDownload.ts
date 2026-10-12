import { useCallback, useState } from "react";
import { downloadFile } from "@/services/download";

/** Wraps `downloadFile` with an in-flight flag so callers can disable their button. */
export function useFileDownload() {
  const [downloading, setDownloading] = useState(false);

  const download = useCallback(async (url: string, filename: string) => {
    setDownloading(true);
    try {
      await downloadFile(url, filename);
    } finally {
      setDownloading(false);
    }
  }, []);

  return { download, downloading };
}
