import CompanyForm from './form';
import RequireAdmin from '@/components/common/RequireAdmin';

export default function NewCompanyScreen() {
  return (
    <RequireAdmin>
      <CompanyForm />
    </RequireAdmin>
  );
}
