import { useUserRole } from '../hooks/useUserRole';
import LoadingSpinner from '../components/Shared/LoadingSpinner';
import { Navigate } from 'react-router';

const AdminRoute = ({ children }) => {
  const [role, isRoleLoading] = useUserRole();

  if (isRoleLoading) {
    return <LoadingSpinner />;
  }

  if (role === 'admin') {
    return children;
  }

  return <Navigate to="/" />;
};

export default AdminRoute;
