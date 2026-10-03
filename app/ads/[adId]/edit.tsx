import AdForm from '@/app/ads/form';
import RequireAdmin from '@/components/common/RequireAdmin';

export default function EditAdScreen() {
  return (
    <RequireAdmin>
      <AdForm />
    </RequireAdmin>
  );
}
