import { useState } from 'react';
import UpdateUserRoleModal from '../../Modal/UpdateUserRoleModal';

const UserDataRow = ({ user }) => {
  const { email, role, status } = user;
  let [isOpen, setIsOpen] = useState(false);
  return (
    <>
      {!user || user.length === 0 ? (
        <p>No user here</p>
      ) : (
        <tr>
          <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
            <p className="text-gray-900 whitespace-no-wrap">{email}</p>
          </td>
          <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
            <p className="text-gray-900 whitespace-no-wrap">{role}</p>
          </td>
          <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
            {status ? (
              <p
                className={`${
                  status === 'verified' ? 'text-green-600' : 'text-yellow-500'
                }`}
              >
                {status}
              </p>
            ) : (
              <p className="text-red-500 whitespace-no-wrap">Unavailable</p>
            )}
          </td>

          <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
            <span className="relative cursor-pointer inline-block px-3 py-1 font-semibold text-green-900 leading-tight ">
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-green-200 opacity-50 rounded-full"
              ></span>
              <span
                className="relative"
                onClick={() => {
                  setIsOpen(true);
                }}
              >
                Update Role
              </span>
            </span>
            <UpdateUserRoleModal
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              role={role}
              email={email}
            />

            {/* Modal */}
            {/* <UpdateUserModal /> */}
          </td>
        </tr>
      )}
    </>
  );
};

export default UserDataRow;
