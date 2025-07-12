// app/index.tsx
import { Redirect } from 'expo-router';

export default function HomeRedirect() {
  return <Redirect href="/companies" />;
}