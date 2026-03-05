import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../store/cartContext';
import { useFetch } from '../hooks/useFetch';
import { api } from '../services/api';
import { Category, Product, getProductImages, formatPrice } from '../types';
import logo from '../assets/logo.png';
import cartIcon from '../assets/cart.png';

export default function Header() {
  const { totalItems } = useCart();
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: categories } = useFetch(() => api.categories.getAll(), []);

  // Search suggestions effect - TEMPORARILY DISABLED
  useEffect(() => {
    // Disable search suggestions to prevent infinite API calls
    setSearchSuggestions([]);
    setShowSuggestions(false);
  }, [search]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Check initial login state
    setIsLoggedIn(!!localStorage.getItem('isLoggedIn'));

    // Listen for storage changes (login/logout events)
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem('isLoggedIn'));
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/shop?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (product: Product) => {
    navigate(`/product/${product.id}`);
    setSearch('');
    setShowSuggestions(false);
  };

  // Helper function to highlight search term in text
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.trim()})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold">{part}</span>
      ) : (
        part
      )
    );
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
          <Link to="/" className="flex items-center shrink-0">
            <img 
              src={logo} 
              alt="Nano Geyser Logo" 
              className="h-20 w-auto object-contain"
            />
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
              <button 
                onClick={() => navigate('/shop')}
                className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors flex items-center gap-1" 
              >
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
                      onClick={() => handleCategoryClick(cat.id.toString())}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span>{cat.name}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {(cat as any).productCount || 0}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link to="/orders" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">
              Đơn hàng
            </Link>

            <Link to="/shop" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">
              Khuyến mãi
            </Link>
          </nav>

          {/* Search */}
          <div ref={searchRef} className="hidden sm:flex flex-1 max-w-xs relative">
            <form onSubmit={handleSearch} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 w-full">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => search.length >= 2 && setShowSuggestions(true)}
                className="bg-transparent text-sm flex-1 outline-none text-gray-700 placeholder-gray-400"
              />
            </form>

            {/* Search Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-80 overflow-y-auto">
                {searchSuggestions.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSuggestionClick(product)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <img 
                        src={getProductImages(product)[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {highlightSearchTerm(product.name, search)}
                      </h4>
                      <p className="text-brand-600 font-semibold text-sm">
                        {formatPrice(product.price)}₫
                      </p>
                    </div>
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-2 pt-2 px-4">
                  <button
                    onClick={() => {
                      navigate(`/shop?search=${encodeURIComponent(search.trim())}`);
                      setShowSuggestions(false);
                    }}
                    className="text-brand-600 text-sm font-medium hover:underline"
                  >
                    Xem tất cả kết quả cho "{search}"
                  </button>
                </div>
              </div>
            )}

            {/* No results message */}
            {showSuggestions && search.trim().length >= 2 && searchSuggestions.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-4 z-50">
                <div className="px-4 text-center text-gray-500 text-sm">
                  Không tìm thấy sản phẩm nào cho "{search}"
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <img src={cartIcon} alt="Cart" className="w-6 h-6 object-contain" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>
            
            {isLoggedIn ? (
              <Link to="/profile" className="hidden sm:flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            ) : (
              <Link to="/login" className="hidden sm:block btn-primary !py-2 !px-4 !text-sm">Đăng nhập</Link>
            )}

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
                    handleCategoryClick(cat.id.toString());
                    setMobileOpen(false);
                  }}
                  className="block text-sm text-gray-600 py-1"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
          
          <Link to="/orders" className="text-sm font-medium text-gray-700 py-1"
            onClick={() => setMobileOpen(false)}>Đơn hàng</Link>
          <Link to="/cart" className="text-sm font-medium text-gray-700 py-1"
            onClick={() => setMobileOpen(false)}>Giỏ hàng</Link>
          
          {isLoggedIn ? (
            <Link to="/profile" className="text-sm font-medium text-gray-700 py-1"
              onClick={() => setMobileOpen(false)}>Tài khoản</Link>
          ) : (
            <Link to="/login" className="text-sm font-medium text-gray-700 py-1"
              onClick={() => setMobileOpen(false)}>Đăng nhập</Link>
          )}
        </div>
      )}
    </header>
  );
}
