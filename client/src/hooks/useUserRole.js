import { useEffect, useState } from 'react';
import useAxiosSecure from './useAxiosSecure.jsx';
import useAuth from './useAuth.js';

export const useUserRole = () => {
  const [role, setRole] = useState(null);
  const [IsRoleLoading, setIsRoleLoading] = useState(true);
  const axiosSecure = useAxiosSecure();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user?.email) {
      return;
    }

    const fetchUserRole = async () => {
      const { data } = await axiosSecure(`/user/role/${user?.email}`); //${import.meta.env.VITE_API_URL}
      setRole(data?.role);
      setIsRoleLoading(false);
    };
    fetchUserRole();
  }, [user, loading, axiosSecure]);

  // console.log(role);

  return [role, IsRoleLoading];
  // ami chaile object akareo return korte pari kitu ami array akare korechi akron serial maintain korbe index number eta amr project er jonno valo hobe
};
