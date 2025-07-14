import LoadingSpinner from '../components/Shared/LoadingSpinner';
import { Navigate } from 'react-router';
import { useUserRole } from '../hooks/useUserRole';

const SellerRoute = ({ children }) => {
  const [role, isRoleLoading] = useUserRole();
  console.log(role);

  if (isRoleLoading) {
    return <LoadingSpinner />;
  }

  if (role === 'seller') {
    return children;
  }

  return <Navigate to="/" />;
};

export default SellerRoute;
