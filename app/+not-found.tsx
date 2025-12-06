// app/_not-found.tsx
import { Redirect } from 'expo-router';

export default function NotFound() {
  return <Redirect href="/companies" />;
}
