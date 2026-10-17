import CompanyForm from '@/components/companies/CompanyForm';
import RequireAdmin from '@/components/common/RequireAdmin';

export default function EditCompanyScreen() {
  return (
    <RequireAdmin>
      <CompanyForm />
    </RequireAdmin>
  );
}
