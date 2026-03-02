import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../store/cartContext';
import { useFetch } from '../hooks/useFetch';
import { api } from '../services/api';
import { Category } from '../types';

export default function Header() {
  const { totalItems } = useCart();
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const { data: categories } = useFetch(() => api.categories.getAll());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/shop?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setProductsDropdownOpen(false);
    navigate(`/shop?categoryId=${categoryId}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2v20M2 12h20M6 6l12 12M6 18L18 6" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl text-gray-900">Nano Geyser</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">
              Trang chủ
            </Link>
            
            {/* Products Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setProductsDropdownOpen(true)}
              onMouseLeave={() => setProductsDropdownOpen(false)}
            >
              <button className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors flex items-center gap-1">
                Sản phẩm
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`transition-transform ${productsDropdownOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {productsDropdownOpen && categories && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-fadeIn">
                  {categories.map((cat: Category) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span>{cat.name}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {cat.productCount}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link to="/shop" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">
              Khuyến mãi
            </Link>
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-xs items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm flex-1 outline-none text-gray-700 placeholder-gray-400"
            />
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>
            <Link to="/login" className="hidden sm:block btn-primary !py-2 !px-4 !text-sm">Đăng nhập</Link>

            {/* Mobile menu */}
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3">
          <Link to="/" className="text-sm font-medium text-gray-700 py-1"
            onClick={() => setMobileOpen(false)}>Trang chủ</Link>
          <Link to="/shop" className="text-sm font-medium text-gray-700 py-1"
            onClick={() => setMobileOpen(false)}>Sản phẩm</Link>
          
          {/* Mobile Categories */}
          {categories && (
            <div className="pl-4 space-y-2 border-l-2 border-gray-200">
              {categories.map((cat: Category) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    handleCategoryClick(cat.id);
                    setMobileOpen(false);
                  }}
                  className="block text-sm text-gray-600 py-1"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
          
          <Link to="/cart" className="text-sm font-medium text-gray-700 py-1"
            onClick={() => setMobileOpen(false)}>Giỏ hàng</Link>
          <Link to="/login" className="text-sm font-medium text-gray-700 py-1"
            onClick={() => setMobileOpen(false)}>Đăng nhập</Link>
        </div>
      )}
    </header>
  );
}
