import { Redirect } from "expo-router";

// The marketing landing page now lives at /home. This route stays as a redirect
// so old links and bookmarks keep working.
export default function LandingScreen() {
  return <Redirect href="/home" />;
}
