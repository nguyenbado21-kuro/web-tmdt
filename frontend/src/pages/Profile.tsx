import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Button from '../components/Button';
import FloatingHotline from '../components/FloatingHotline';


export default function Profile() {
  const navigate = useNavigate();
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
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      navigate('/login?redirect=/profile');
      return;
    }

    // Load user data from API
    loadUserData();
  }, [navigate]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // First try to get from localStorage
      const userData = localStorage.getItem('userData');
      const userPhone = localStorage.getItem('userPhone');
      
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setForm({
            name: parsedUser.name || parsedUser.username || '',
            email: parsedUser.email || '',
            phone: parsedUser.phone || userPhone || '',
          });
        } catch (err) {
          console.error('Error parsing user data:', err);
        }
      } else if (userPhone) {
        // Create minimal user object with phone
        const minimalUser = { phone: userPhone };
        setUser(minimalUser);
        setForm({ 
          name: '',
          email: '',
          phone: userPhone 
        });
      }

      // Try to fetch fresh data from API (optional, don't fail if it doesn't work)
      try {
        const response = await api.user.getCurrent();
        if (response.success && response.data) {
          const freshUserData = response.data;
          setUser(freshUserData);
          setForm({
            name: freshUserData.name || freshUserData.username || '',
            email: freshUserData.email || '',
            phone: freshUserData.phone || userPhone || '',
          });
          // Update localStorage with fresh data
          localStorage.setItem('userData', JSON.stringify(freshUserData));
        }
      } catch (apiError) {
        // API call failed, but we already have data from localStorage, so continue
        console.log('API call failed, using localStorage data');
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userData');
    
    // Trigger storage event for other components to update
    window.dispatchEvent(new Event('storage'));
    
    // Trigger custom event for cart to reload (will load guest cart)
    window.dispatchEvent(new Event('userChanged'));
    
    navigate('/');
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Prepare update data
      const updateData = {
        name: form.name,
        email: form.email,
      };

      // If we have user ID, try to update via API
      if (user?.id) {
        try {
          const response = await api.user.update(user.id.toString(), updateData);
          
          if (response.success) {
            // Update local state
            const updatedUser = { 
              ...user, 
              name: form.name,
              username: form.name, // Keep both for compatibility
              email: form.email,
            };
            
            setUser(updatedUser);
            localStorage.setItem('userData', JSON.stringify(updatedUser));
            setIsEditing(false);
            setSuccess('Cập nhật thông tin thành công!');
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
            return;
          }
        } catch (apiError) {
          console.log('API update failed, updating localStorage only');
        }
      }

      // Fallback: Update localStorage only
      const updatedUser = { 
        ...user, 
        name: form.name,
        username: form.name,
        email: form.email,
      };
      
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      setIsEditing(false);
      setSuccess('Cập nhật thông tin thành công!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user && !form.phone) {
    return (
      <main className="min-h-[calc(100vh-400px)] py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            <span className="ml-3 text-gray-600">Đang tải thông tin...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-400px)] py-12 px-4">
      <div className="max-w-3xl mx-auto">
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
      <FloatingHotline phoneNumber="0123456789" />
    </main>
  );
}
