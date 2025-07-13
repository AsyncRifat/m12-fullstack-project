import { useEffect, useState } from 'react';
import useAxiosSecure from './useAxiosSecure.jsx';
import useAuth from './useAuth.js';

export const useUserRole = () => {
  const [role, setRole] = useState(null);
  const [IsRoleLoading, setIsRoleLoading] = useState(true);
  const axiosSecure = useAxiosSecure();
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data } = await axiosSecure(
        `${import.meta.env.VITE_API_URL}/user/role/${user.email}`
      );
      setRole(data?.role);
      setIsRoleLoading(false);
    };
    fetchUserRole();
  }, [user, axiosSecure]);

  // console.log(role);

  return [role, IsRoleLoading];
  // ami chaile object akareo return korte pari kitu ami array akare korechi akron serial maintain korbe index number eta amr project er jonno valo hobe
};
