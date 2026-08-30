// A picked image, either from the browser file input (web) or expo-image-picker (native).
export type NativeImageAsset = {
  uri: string;
  name: string;
  type: string;
};

export type PickedImage = File | NativeImageAsset;
