import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { api } from '../services/api';
import Button from '../components/Button';


export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
  const isLoggedIn = localStorage.getItem('isLoggedIn');

  if (isLoggedIn !== 'true') {
    navigate('/login?redirect=/profile');
    return;
  }

  loadUserData();
}, [navigate]);

const normalizeResponse = (raw: any) => {
  if (raw?.data?.code !== undefined || raw?.data?.message !== undefined) {
    return raw.data;
  }
  return raw;
};

const isApiSuccess = (response: any) => {
  return (
    Number(response?.code) === 1 &&
    String(response?.message || '').trim().toLowerCase() === 'success'
  );
};

const loadUserData = async () => {
  try {
    setLoading(true);
    setError('');

    const userData = localStorage.getItem('userData');
    const userPhone = localStorage.getItem('userPhone');

    // Load from localStorage first
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('Parsed user from localStorage:', parsedUser);
        
        // Handle different user data structures
        const userId = parsedUser.id || parsedUser.user?.id;
        const username = parsedUser.username || parsedUser.user.username || parsedUser.name || '';
        const email = parsedUser.email || parsedUser.user?.email || parsedUser.gmail || parsedUser.user?.gmail || '';
        const phone = parsedUser.phone || parsedUser.user?.phone || userPhone || '';
        
        setUser({
          ...parsedUser,
          id: userId,
          username,
          email,
          phone
        });
        
        setForm({
          name: username,
          email: email,
          phone: phone,
        });
      } catch (e) {
        console.error('Error parsing userData:', e);
      }
    } else if (userPhone) {
      const minimalUser = { phone: userPhone };
      setUser(minimalUser);
      setForm({
        name: '',
        email: '',
        phone: userPhone,
      });
    }

    // Fetch fresh data from API
    try {
      const rawResponse = await api.user.getCurrent();
      const response = normalizeResponse(rawResponse);

      console.log('API response:', response);

      if (isApiSuccess(response) && response?.data) {
        const freshUserData = response.data;

        setUser(freshUserData);
        setForm({
          name: freshUserData.username || freshUserData.name || '',
          email: freshUserData.email || freshUserData.gmail || '',
          phone: freshUserData.phone || userPhone || '',
        });

        localStorage.setItem('userData', JSON.stringify(freshUserData));

        if (freshUserData.phone) {
          localStorage.setItem('userPhone', freshUserData.phone);
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      // lỗi API thì giữ dữ liệu localStorage
    }
  } catch (err) {
    console.error('Error loading user data:', err);
    setError('Không thể tải thông tin người dùng');
  } finally {
    setLoading(false);
  }
};

const handleLogout = () => {
  logout();
  navigate('/');
};

const handleSave = async () => {
  try {
    setLoading(true);
    setError('');
    setSuccess('');

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();

    if (!trimmedName) {
      setError('Vui lòng nhập họ và tên');
      setLoading(false);
      return;
    }

    // Get user ID from multiple possible locations
    let userId = user?.id || user?.user?.id;
    
    console.log('User object:', user);
    console.log('User ID from state:', userId);

    // If no user ID, try to get from API first
    if (!userId) {
      try {
        const rawResponse = await api.user.getCurrent();
        const response = normalizeResponse(rawResponse);
        
        if (isApiSuccess(response) && response?.data) {
          userId = response.data.id;
          console.log('User ID from API:', userId);
          
          // Update user state with fresh data
          setUser(response.data);
        }
      } catch (err) {
        console.error('Error fetching user ID:', err);
      }
    }

    if (!userId) {
      setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      setLoading(false);
      return;
    }

    const updateData = {
      name: trimmedName,  // API expects 'name' field
      email: trimmedEmail,
      gmail: trimmedEmail,
    };

    console.log('Updating user ID:', userId, 'with data:', updateData);

    const rawResponse = await api.user.update(userId.toString(), updateData);
    const response = normalizeResponse(rawResponse);

    console.log('Update response:', response);

    if (isApiSuccess(response)) {
      // Merge updated data with existing user data
      const updatedUser = {
        ...user,
        id: userId,
        username: trimmedName,
        name: trimmedName,
        email: trimmedEmail,
      };

      setUser(updatedUser);
      setForm({
        name: trimmedName,
        email: trimmedEmail,
        phone: user.phone || form.phone,
      });

      localStorage.setItem('userData', JSON.stringify(updatedUser));

      // Dispatch event to notify other components (like Header)
      window.dispatchEvent(new Event('userDataUpdated'));

      setIsEditing(false);
      setSuccess('Cập nhật thông tin thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(response?.message || 'Cập nhật thông tin thất bại');
    }
  } catch (err: any) {
    console.error('Error updating user:', err);
    setError(err?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
  } finally {
    setLoading(false);
  }
};

if (loading && !user && !form.phone) {
  return (
    <main className="min-h-[calc(100vh-400px)] py-12 px-4 w-full">
      <div className="w-full max-w-screen-xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <span className="ml-3 text-gray-600">Đang tải thông tin...</span>
        </div>
      </div>
    </main>
  );
}
  return (
    <main className="min-h-[calc(100vh-400px)] py-12 px-4 w-full">
      <div className="w-full max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
            Thông tin tài khoản
          </h1>
          <p className="text-gray-600">
            Quản lý thông tin cá nhân của bạn
          </p>
        </div>

        {/* Profile Card */}
        <div className="card p-8 mb-6">
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-700 text-sm font-medium">{success}</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700 text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Thông tin cá nhân
              </h2>
              <p className="text-sm text-gray-500">
                Cập nhật thông tin của bạn
              </p>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                disabled={loading}
              >
                Chỉnh sửa
              </Button>
            )}
          </div>

          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                  placeholder="Nhập họ tên"
                />
              ) : (
                <p className="text-gray-900 py-3">{form.name || 'Chưa cập nhật'}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại
              </label>
              <div className="flex items-center gap-2">
                <p className="text-gray-900 py-3">{form.phone}</p>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  Không thể thay đổi
                </span>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                  placeholder="email@example.com"
                />
              ) : (
                <p className="text-gray-900 py-3">{form.email || 'Chưa cập nhật'}</p>
              )}
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSave} 
                  className="flex-1"
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                    setSuccess('');
                    // Reset form
                    if (user) {
                      setForm({
                        name: user.username || user.name || '',
                        email: user.email || '',
                        phone: user.phone || form.phone,
                      });
                    }
                  }}
                  className="flex-1"
                  disabled={loading}
                >
                  Hủy
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Orders Link */}
        <div className="card p-6 mb-6">
          <button
            onClick={() => navigate('/orders')}
            className="w-full flex items-center justify-between text-left hover:bg-gray-50 -m-2 p-4 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Đơn hàng của tôi</h3>
                <p className="text-sm text-gray-500">Xem lịch sử đơn hàng</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full !text-red-600 !border-red-200 hover:!bg-red-50"
        >
          Đăng xuất
        </Button>
      </div>
    </main>
  );
}
