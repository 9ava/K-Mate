import React from 'react';
import type { User } from '../../pages/admin/UserManagePage';

interface EditUserModalProps {
  show: boolean;
  user: User | null;
  onClose: () => void;
  onConfirm: (user: User, newRole: 'user' | 'admin') => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ show, user, onClose, onConfirm }) => {
  const [role, setRole] = React.useState<'user' | 'admin'>('user');

  React.useEffect(() => {
    if (user) {
      setRole(user.role);
    }
  }, [user]);

  if (!show || !user) {
    return null;
  }

  const handleConfirm = () => {
    onConfirm(user, role);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 z-50 w-full max-w-lg">
        <div className="text-left">
          <h3 className="text-lg font-medium leading-6 text-gray-900">사용자 역할 수정</h3>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              <strong>{user.name}</strong>({user.email}) 님의 역할을 변경합니다.
            </p>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
              className="w-full px-3 py-2 mt-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="mt-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            저장
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
          >
            취소
          </button>
        </div>
      </div>
    </>
  );
};

export default EditUserModal;
