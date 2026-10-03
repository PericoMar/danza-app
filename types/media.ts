// A picked image, either from the browser file input (web) or expo-image-picker (native).
export type NativeImageAsset = {
  uri: string;
  name: string;
  type: string;
  width?: number;
  height?: number;
};

export type PickedImage = File | NativeImageAsset;
