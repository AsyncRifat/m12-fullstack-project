import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import toast from 'react-hot-toast';

const UpdateUserRoleModal = ({ isOpen, setIsOpen, role, email }) => {
  const [updatedRole, setUpdatedRole] = useState(role);
  // console.log(updatedRole);
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async callForUpdateRole => {
      const { data } = await axiosSecure.patch(`/user/role/update/${email}`, {
        role: callForUpdateRole,
      });
      return data;
    },
    onSuccess: () => {
      // refetch();
      queryClient.invalidateQueries(['user']);
      // console.log(data);
      setIsOpen(false);
      toast.success('User Role Updated');
    },
    onError: error => {
      console.log('error hoice vai', error);
    },
  });

  const handleUserRole = e => {
    e.preventDefault();
    mutation.mutate(updatedRole);
  };

  return (
    <>
      <Dialog
        open={isOpen}
        as="div"
        className="relative z-10 focus:outline-none"
        onClose={() => setIsOpen(false)}
      >
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel
              transition
              className="w-full max-w-md rounded-xl bg-gray-200 p-6 backdrop-blur-2xl duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0 shadow-xl"
            >
              <DialogTitle
                as="h3"
                className="text-base/7 font-medium text-black"
              >
                Update User Role
              </DialogTitle>
              <form className="mt-4" onSubmit={handleUserRole}>
                <div>
                  <select
                    name="role"
                    id=""
                    value={updatedRole}
                    onChange={e => setUpdatedRole(e.target.value)}
                    className="w-full bg-white py-2 px-3 rounded-md outline-none"
                  >
                    <option value="customer">Customer</option>
                    <option value="seller">Seller</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end mt-5 gap-x-3">
                  <button type="submit" className="badge badge-success">
                    Update
                  </button>

                  <button
                    type="button"
                    className="badge badge-error"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default UpdateUserRoleModal;
