import React from 'react';
import { useAuth } from '../../src/context/AuthContext';
import { BeneficiaryHome } from '../../src/components/dashboard/BeneficiaryHome';
import GuardianHome from '../../src/components/dashboard/GuardianHome';
import TeleassistanceHome from '../../src/components/dashboard/TeleassistanceHome';
import AdminHome from '../../src/components/dashboard/AdminHome';
import CompanyHome from '../../src/components/dashboard/CompanyHome';
import ProHome from '../../src/components/dashboard/ProHome';

export default function Dashboard() {
  const { user, token } = useAuth();
  if (!user || !token) return null;
  const r = user.active_role || user.role;

  switch (r) {
    case 'beneficiary': return <BeneficiaryHome token={token} user={user} />;
    case 'guardian': return <GuardianHome token={token} user={user} />;
    case 'professional': return <GuardianHome token={token} user={user} />;
    case 'teleassistance': return <TeleassistanceHome token={token} user={user} />;
    case 'admin': return <AdminHome token={token} user={user} />;
    case 'prescriber_company':
    case 'company': return <CompanyHome token={token} user={user} />;
    default: return <BeneficiaryHome token={token} user={user} />;
  }
}
