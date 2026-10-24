import { loadFont } from "@remotion/google-fonts/Inter";

/** Inter, the app's only typeface (theme/companies.ts), in the weights the video uses. */
export const { fontFamily: INTER } = loadFont("normal", {
  weights: ["500", "800", "900"],
  subsets: ["latin"],
});
