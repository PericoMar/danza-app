import AdForm from '@/components/ads/AdForm';
import RequireAdmin from '@/components/common/RequireAdmin';

export default function EditAdScreen() {
  return (
    <RequireAdmin>
      <AdForm />
    </RequireAdmin>
  );
}
