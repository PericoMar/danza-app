import CompanyForm from '../form';
import RequireAdmin from '@/components/common/RequireAdmin';

export default function EditCompanyScreen() {
  return (
    <RequireAdmin>
      <CompanyForm />
    </RequireAdmin>
  );
}
