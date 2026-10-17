import AdForm from '@/components/ads/AdForm';
import RequireAdmin from '@/components/common/RequireAdmin';

export default function AddAdScreen() {
  return (
    <RequireAdmin>
      <AdForm />
    </RequireAdmin>
  );
}
