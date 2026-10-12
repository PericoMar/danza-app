import AdForm from './form';
import RequireAdmin from '@/components/common/RequireAdmin';

export default function AddAdScreen() {
  return (
    <RequireAdmin>
      <AdForm />
    </RequireAdmin>
  );
}
