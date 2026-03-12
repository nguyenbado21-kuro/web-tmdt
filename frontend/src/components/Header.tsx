import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../store/cartContext';
import { useAuth } from '../store/authContext';
import { useFetch } from '../hooks/useFetch';
import { api } from '../services/api';
import { Category, Product, getProductImages, formatPrice } from '../types';
import logo from '../assets/logo.png';
import cartIcon from '../assets/cart.png';

export default function Header() {
  const { totalItems } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: categories } = useFetch(() => api.categories.getAll(), []);

  // Search suggestions effect
  useEffect(() => {
    const searchProducts = async () => {
      if (search.trim().length >= 2) {
        try {
          const response = await api.products.getAll();
          if (response.success && response.data) {
            // Filter products based on search term
            const filteredProducts = response.data.filter((product: Product) =>
              product.name.toLowerCase().includes(search.toLowerCase().trim())
            );
            setSearchSuggestions(filteredProducts.slice(0, 5)); // Limit to 5 suggestions
            setShowSuggestions(true);
          }
        } catch (error) {
          setSearchSuggestions([]);
        }
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    };

    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeoutId);
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
    
    const regex = new RegExp(`(${searchTerm.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
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

  // Helper function to check if a path is active
  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm w-full">
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4 w-full">

          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img 
              src={logo} 
              alt="Nano Geyser Logo" 
              className="h-12 sm:h-16 lg:h-20 w-auto object-contain max-w-full"
            />
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className={`relative text-sm font-medium transition-colors py-2 ${
                isActivePath('/') 
                  ? 'text-green-600' 
                  : 'text-green-600 hover:text-gray-900'
              }`}
            >
              TRANG CHỦ
              {isActivePath('/') && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 animate-slide-underline"></div>
              )}
            </Link>
            
            {/* Products Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setProductsDropdownOpen(true)}
              onMouseLeave={() => setProductsDropdownOpen(false)}
            >
              <button 
                onClick={() => navigate('/shop')}
                className={`relative text-sm font-medium transition-colors py-2 flex items-center gap-1 ${
                  isActivePath('/shop') || isActivePath('/product')
                    ? 'text-green-600' 
                    : 'text-green-600 hover:text-gray-900'
                }`}
              >
                SẢN PHẨM
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
                {(isActivePath('/shop') || isActivePath('/product')) && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 animate-slide-underline"></div>
                )}
              </button>

              {/* Dropdown Menu */}
              {productsDropdownOpen && categories && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-fadeIn z-50 max-w-[calc(100vw-2rem)]">
                  {categories.map((cat: Category) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id.toString())}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{cat.name}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0 ml-2">
                          {(cat as any).productCount || 0}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link 
              to="/orders" 
              className={`relative text-sm font-medium transition-colors py-2 ${
                isActivePath('/orders') 
                  ? 'text-green-600' 
                  : 'text-green-600 hover:text-gray-900'
              }`}
            >
              ĐƠN HÀNG
              {isActivePath('/orders') && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 animate-slide-underline"></div>
              )}
            </Link>

            <Link 
              to="/promotions" 
              className={`relative text-sm font-medium transition-colors py-2 ${
                isActivePath('/promotions') 
                  ? 'text-green-600' 
                  : 'text-green-600 hover:text-gray-900'
              }`}
            >
              KHUYẾN MÃI
              {isActivePath('/promotions') && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 animate-slide-underline"></div>
              )}
            </Link>
          </nav>

          {/* Search */}
          <div ref={searchRef} className="hidden sm:flex flex-1 max-w-xs lg:max-w-sm relative">
            <form onSubmit={handleSearch} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 sm:px-4 py-2 w-full">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => search.trim().length >= 2 && setShowSuggestions(true)}
                className="bg-transparent text-sm flex-1 outline-none text-gray-700 placeholder-gray-400"
              />
            </form>

            {/* Search Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-80 overflow-y-auto max-w-full">
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
                        className="w-full h-full object-cover max-w-full h-auto"
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
                      setSearch('');
                    }}
                    className="text-brand-600 text-sm font-medium hover:underline truncate w-full text-left"
                  >
                    Xem tất cả kết quả cho "{search.trim()}"
                  </button>
                </div>
              </div>
            )}

            {/* No results message */}
            {showSuggestions && search.trim().length >= 2 && searchSuggestions.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-4 z-50 max-w-full">
                <div className="px-4 text-center text-gray-500 text-sm">
                  Không tìm thấy sản phẩm nào cho "{search.trim()}"
                </div>
                <div className="border-t border-gray-100 mt-3 pt-3 px-4">
                  <button
                    onClick={() => {
                      navigate(`/shop?search=${encodeURIComponent(search.trim())}`);
                      setShowSuggestions(false);
                      setSearch('');
                    }}
                    className="text-brand-600 text-sm font-medium hover:underline w-full text-left"
                  >
                    Tìm kiếm tất cả sản phẩm
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <img src={cartIcon} alt="Cart" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
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
            <button 
              className={`md:hidden p-2 transition-all duration-300 hover:bg-gray-100 rounded-lg ${mobileOpen ? 'burger-open' : ''}`} 
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <div className="w-5 h-5 relative flex flex-col justify-center items-center">
                <span className="burger-line burger-line-1 block w-5 h-0.5 bg-gray-600 mb-1"></span>
                <span className="burger-line burger-line-2 block w-5 h-0.5 bg-gray-600 mb-1"></span>
                <span className="burger-line burger-line-3 block w-5 h-0.5 bg-gray-600"></span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3 animate-slide-down-fade w-full max-w-full overflow-hidden">
          <Link 
            to="/" 
            className="text-sm font-medium text-gray-700 py-2 transition-all duration-300 hover:text-brand-500 hover:bg-gray-50 rounded-lg px-3 animate-menu-item opacity-0 menu-item-delay-1 w-full truncate"
            onClick={() => setMobileOpen(false)}
          >
            Trang chủ
          </Link>
          <Link 
            to="/shop" 
            className="text-sm font-medium text-gray-700 py-2 transition-all duration-300 hover:text-brand-500 hover:bg-gray-50 rounded-lg px-3 animate-menu-item opacity-0 menu-item-delay-2 w-full truncate"
            onClick={() => setMobileOpen(false)}
          >
            Sản phẩm
          </Link>
          
          {/* Mobile Categories */}
          {categories && (
            <div className="pl-4 space-y-2 border-l-2 border-gray-200 animate-menu-item opacity-0 menu-item-delay-3 w-full max-w-full overflow-hidden">
              {categories.map((cat: Category, index: number) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    handleCategoryClick(cat.id.toString());
                    setMobileOpen(false);
                  }}
                  className={`block text-sm text-gray-600 py-2 px-3 rounded-lg transition-all duration-300 hover:text-brand-500 hover:bg-gray-50 animate-menu-item opacity-0 w-full text-left truncate`}
                  style={{ animationDelay: `${0.35 + index * 0.05}s` }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
          
          <Link 
            to="/orders" 
            className="text-sm font-medium text-gray-700 py-2 transition-all duration-300 hover:text-brand-500 hover:bg-gray-50 rounded-lg px-3 animate-menu-item opacity-0 menu-item-delay-4 w-full truncate"
            onClick={() => setMobileOpen(false)}
          >
            Đơn hàng
          </Link>
          <Link 
            to="/promotions" 
            className="text-sm font-medium text-gray-700 py-2 transition-all duration-300 hover:text-brand-500 hover:bg-gray-50 rounded-lg px-3 animate-menu-item opacity-0 menu-item-delay-5 w-full truncate"
            onClick={() => setMobileOpen(false)}
          >
            Khuyến mãi
          </Link>
          <Link 
            to="/cart" 
            className="text-sm font-medium text-gray-700 py-2 transition-all duration-300 hover:text-brand-500 hover:bg-gray-50 rounded-lg px-3 animate-menu-item opacity-0 menu-item-delay-6 w-full truncate"
            onClick={() => setMobileOpen(false)}
          >
            Giỏ hàng
          </Link>
          
          {isLoggedIn ? (
            <Link 
              to="/profile" 
              className="text-sm font-medium text-gray-700 py-2 transition-all duration-300 hover:text-brand-500 hover:bg-gray-50 rounded-lg px-3 animate-menu-item opacity-0 menu-item-delay-7 w-full truncate"
              onClick={() => setMobileOpen(false)}
            >
              Tài khoản
            </Link>
          ) : (
            <Link 
              to="/login" 
              className="text-sm font-medium bg-brand-500 text-white py-2 px-4 rounded-lg transition-all duration-300 hover:bg-brand-600 hover:scale-105 animate-menu-item opacity-0 menu-item-delay-7 w-full text-center"
              onClick={() => setMobileOpen(false)}
            >
              Đăng nhập
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
