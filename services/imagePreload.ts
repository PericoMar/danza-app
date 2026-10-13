import { Image } from 'react-native';

/**
 * Downloads remote images into the platform's image cache so they paint at
 * once when rendered. Settles when every image has loaded or failed, or after
 * `timeoutMs`, whichever comes first, and never rejects. Images still loading
 * by then fill in when they arrive.
 */
export async function preloadImages(uris: string[], timeoutMs: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeoutMs);
  });

  await Promise.race([Promise.allSettled(uris.map((uri) => Image.prefetch(uri))), timeout]);
  clearTimeout(timer);
}
