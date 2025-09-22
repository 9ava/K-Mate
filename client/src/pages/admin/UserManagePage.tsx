import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import AddAdminModal from './AddAdminModal';
import EditUserModal from './EditUserModal';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  google_sub: string;
  created_at: string;
}

export default function UserManagePage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await api.get<User[]>('/admin/users');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to fetch users.');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddAdmin = async () => {
    if (!newAdminEmail) {
      alert('Please enter an email.');
      return;
    }
    try {
      await api.post('/admin/users', { email: newAdminEmail });
      setShowAddAdminModal(false);
      setNewAdminEmail('');
      fetchUsers(); // Refresh the user list
    } catch (err) {
      setError('Failed to add admin.');
      console.error(err);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (user: User, newRole: 'user' | 'admin') => {
    try {
      await api.patch(`/admin/users/${user.id}`, { role: newRole });
      setShowEditUserModal(false);
      setEditingUser(null);
      fetchUsers(); // Refresh the user list
    } catch (err) {
      setError('Failed to update user role.');
      console.error(err);
    }
  };

  const handleDeleteUser = async (user: User) => {
    const confirmMessage = `정말로 사용자 "${user.name} (${user.email})"를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${user.id}`);
      setError(null);
      fetchUsers(); // Refresh the user list
    } catch (err) {
      setError('Failed to delete user.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50">
      <div className="px-4 py-8 mx-auto max-w-7xl">
        {/* Header */}
        <div className="relative mb-8">
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">사용자 관리</h1>
            <p className="text-gray-600">사용자 목록을 확인하고 관리합니다.</p>
          </div>
          <div className="absolute top-0 right-0 flex gap-3">
            <button
              onClick={() => setShowAddAdminModal(true)}
              className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 cursor-pointer"
            >
              관리자 추가
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              돌아가기
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-400 rounded-md">
            {error}
          </div>
        )}

        {/* User Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">ID</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Name</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Email</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Role</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Provider</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Created At</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-center">{user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">{user.google_sub.startsWith('admin_') ? 'Local' : 'Google'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="px-3 py-1 text-xs text-purple-600 border border-purple-600 rounded hover:bg-purple-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="px-3 py-1 text-xs text-red-600 border border-red-600 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddAdminModal &&
        ReactDOM.createPortal(
          <AddAdminModal
            show={showAddAdminModal}
            onClose={() => setShowAddAdminModal(false)}
            onConfirm={handleAddAdmin}
            newAdminEmail={newAdminEmail}
            setNewAdminEmail={setNewAdminEmail}
          />,
          document.body
        )}

      {showEditUserModal &&
        ReactDOM.createPortal(
          <EditUserModal
            show={showEditUserModal}
            user={editingUser}
            onClose={() => setShowEditUserModal(false)}
            onConfirm={handleUpdateUser}
          />,
          document.body
        )}
    </div>
  );
}
