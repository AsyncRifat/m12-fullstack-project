import useAxiosSecure from './useAxiosSecure.jsx';
import useAuth from './useAuth.js';
import { useQuery } from '@tanstack/react-query';

export const useUserRole = () => {
  const axiosSecure = useAxiosSecure();
  const { user, loading } = useAuth();

  const { data: role, isLoading: IsRoleLoading } = useQuery({
    queryKey: ['role', user?.email],
    enabled: !loading && !!user?.email,
    queryFn: async () => {
      const { data } = await axiosSecure(`/user/role/${user?.email}`);
      return data?.role;
    },
  });

  // useEffect(() => {
  //   if (loading || !user?.email) {
  //     return setIsRoleLoading(false);
  //   }

  //   const fetchUserRole = async () => {
  //     try {
  //       const { data } = await axiosSecure(`/user/role/${user?.email}`); //${import.meta.env.VITE_API_URL}
  //       setRole(data?.role);
  //     } catch (error) {
  //       console.log(error);
  //     } finally {
  //       setIsRoleLoading(false);
  //     }
  //   };
  //   fetchUserRole();
  // }, [user, loading, axiosSecure]);

  // console.log(role);

  return [role, IsRoleLoading];
  // ami chaile object akareo return korte pari kitu ami array akare korechi akron serial maintain korbe index number eta amr project er jonno valo hobe
};
