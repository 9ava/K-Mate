import React from 'react';

interface AddAdminModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  newAdminEmail: string;
  setNewAdminEmail: (email: string) => void;
}

const AddAdminModal: React.FC<AddAdminModalProps> = ({
  show,
  onClose,
  onConfirm,
  newAdminEmail,
  setNewAdminEmail,
}) => {
  if (!show) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Modal Panel */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 z-50 w-full max-w-lg">
        <div className="text-left">
          <h3 className="text-lg font-medium leading-6 text-gray-900">관리자 추가</h3>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              새로운 관리자의 이메일을 입력하세요. 해당 이메일로 가입한 사용자는 관리자 권한을 갖게 됩니다.
            </p>
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="w-full px-3 py-2 mt-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="admin@example.com"
            />
          </div>
        </div>
        <div className="mt-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            추가
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

export default AddAdminModal;