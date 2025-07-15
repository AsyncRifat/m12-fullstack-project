import { Outlet, useNavigate } from 'react-router';
import Sidebar from '../components/Dashboard/Sidebar/Sidebar';
import { useUserRole } from '../hooks/useUserRole';
import { useEffect } from 'react';
import LoadingSpinner from '../components/Shared/LoadingSpinner';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const [role, isRoleLoading] = useUserRole();

  useEffect(() => {
    if (!isRoleLoading) {
      if (role === 'admin') {
        navigate('stats');
      } else if (role === 'seller') {
        navigate('my-inventory');
      } else if (role === 'customer') {
        navigate('my-orders');
      }
    }
  }, [role, isRoleLoading, navigate]);

  if (isRoleLoading) return <LoadingSpinner />;

  return (
    <div className="relative min-h-screen md:flex bg-white">
      {/* Left Side: Sidebar Component */}
      <Sidebar />
      {/* Right Side: Dashboard Dynamic Content */}
      <div className="flex-1  md:ml-64">
        <div className="p-5">
          {/* Outlet for dynamic contents */}
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
