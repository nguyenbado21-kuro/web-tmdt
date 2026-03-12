import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Category, Product, getProductImages, formatPrice } from '../types';
import ProductCard from '../components/ProductCard';
import SectionTitle from '../components/SectionTitle';
import Button from '../components/Button';
import LoadingSpinner, { ErrorState } from '../components/LoadingSpinner';

import slider1 from '../assets/img-slider/1.png';
import slider2 from '../assets/img-slider/2.png';
import slider3 from '../assets/img-slider/3.png';

// ───── Hero ──────────────────────────────────────────────────────────────────
function HeroSection() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [slider1, slider2, slider3];

  // Auto slide every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-gray-900 text-white w-full">
      {/* Decorative blobs - Mobile safe */}
      <div className="absolute top-0 right-0 w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-24 lg:h-24 xl:w-32 xl:h-32 bg-brand-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 animate-float" />
      <div className="absolute bottom-0 left-0 w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 xl:w-24 xl:h-24 bg-accent-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 animate-float" style={{ animationDelay: '3s' }} />

      <div className="w-full max-w-screen-xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-12 items-center">
          {/* Left */}
          <div className="relative z-10 text-center lg:text-left order-2 lg:order-1 w-full">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/10 border border-white/20 backdrop-blur rounded-full px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 text-xs sm:text-sm font-medium mb-2 sm:mb-3 md:mb-4 animate-fade-in-down">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse" />
              Công nghệ lọc nước từ Mỹ
            </span>
            <h1 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold leading-tight sm:leading-[1.1] md:leading-[1.05] mb-2 sm:mb-3 md:mb-4 animate-fade-in-left delay-100">
              Nước sạch <br /><em className="text-accent-400 not-italic">An Toàn</em><br /> Cho mọi nhà
            </h1>
            <p className="text-white/60 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed w-full max-w-md mx-auto lg:mx-0 mb-3 sm:mb-4 md:mb-6 animate-fade-in-left delay-200">
              Máy lọc nước Nano Geyser - Công nghệ tiên tiến từ Mỹ, lọc sạch 99.9% tạp chất, giữ lại khoáng chất tự nhiên có lợi cho sức khỏe.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start animate-fade-in-left delay-300 mb-4 sm:mb-6 md:mb-8 w-full">
              <Button size="lg" onClick={() => navigate('/shop')} className="group w-full sm:w-auto text-xs sm:text-sm md:text-base">
                Xem sản phẩm
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform sm:w-4 sm:h-4">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Button>
              <Button size="lg" variant="outline" className="!border-white/30 !text-white hover:!bg-white/10 w-full sm:w-auto text-xs sm:text-sm md:text-base"
                onClick={() => navigate('/shop')}>
                Tư vấn miễn phí
              </Button>
            </div>
            {/* Stats row */}
            <div className="flex justify-center lg:justify-start gap-3 sm:gap-4 md:gap-6 lg:gap-8 pt-3 sm:pt-4 md:pt-6 border-t border-white/10 animate-fade-in-up delay-400 w-full">
              {[['10K+', 'Khách hàng'], ['50+', 'Đại lý'], ['99%', 'Hài lòng']].map(([n, l]) => (
                <div key={l} className="text-center hover:scale-110 transition-transform duration-300">
                  <div className="font-display font-bold text-base sm:text-lg md:text-xl lg:text-2xl text-white">{n}</div>
                  <div className="text-white/40 text-xs sm:text-sm">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Image Slider */}
          <div className="relative z-10 w-full max-w-[280px] sm:max-w-xs md:max-w-sm lg:max-w-lg mx-auto lg:mx-0 animate-fade-in-right delay-200 order-1 lg:order-2">
            <div className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer w-full">
              {/* Slides */}
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img
                    src={slide}
                    alt={`Máy lọc nước Nano Geyser ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 max-w-full"
                  />
                </div>
              ))}
            </div>

            {/* Dots Navigation */}
            <div className="flex justify-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 md:mt-4 w-full">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentSlide
                      ? 'w-5 sm:w-6 md:w-8 h-1.5 sm:h-2 bg-white'
                      : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Chuyển đến slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ───── Categories ─────────────────────────────────────────────────────────────
function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.categories.getAll();
        if (response.success && response.data) {
          setCategories(response.data);
        } else {
          setError(response.error || 'Failed to load categories');
        }
      } catch (err) {
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white w-full">
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 text-center sm:text-left w-full">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">DANH MỤC</h2>
        </div>
        
        {loading && <LoadingSpinner />}
        {error && <ErrorState message={error} />}
        {categories && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 w-full">
            {categories.map((cat: Category, index: number) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/shop?categoryId=${cat.id}`)}
                
                className="group flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 animate-scale-in w-full"
                style={{ animationDelay: `${index * 0.05}s` }}>
                {/* Icon/Image Container */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
                  {cat.image ? (
                    <img 
                      src={cat.image} 
                      alt={cat.name}
                      className="w-full h-full object-cover max-w-full h-auto"
                      onError={(e) => { 
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-lg sm:text-xl lg:text-2xl">🏷️</span>';
                      }}
                    />
                  ) : (
                    <span className="text-lg sm:text-xl lg:text-2xl">🏷️</span>
                  )}
                </div>
                
                {/* Category Name */}
                <span className="text-xs sm:text-xs text-center text-gray-700 font-medium leading-tight line-clamp-2 group-hover:text-brand-500 transition-colors w-full">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ───── Featured Products ──────────────────────────────────────────────────────
function FeaturedProducts() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await api.products.getAllFromCategories();
        if (response.success && response.data) {
          setAllProducts(response.data);
        } else {
          setError(response.error || 'Failed to load products');
        }
      } catch (err) {
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);
  
  // Get first 4 products
  const products = allProducts.slice(0, 4);

  return (
    <section className="py-12 sm:py-16 lg:py-20 w-full">
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 sm:mb-10 gap-4 w-full">
          <SectionTitle tag="Nổi bật" title="Sản phẩm" highlight="Đặc biệt"
            subtitle="Những dòng máy lọc nước được yêu thích nhất" />
          <Link to="/shop" className="text-brand-500 font-semibold text-sm hover:underline flex items-center gap-1 shrink-0 group animate-fade-in">
            Xem tất cả
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        {loading && <LoadingSpinner />}
        {error && <ErrorState message={error} />}
        {products && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
            {products.map((p: Product, index: number) => (
              <div key={p.id} className="animate-fade-in-up w-full" style={{ animationDelay: `${index * 0.1}s` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ───── Promotions ─────────────────────────────────────────────────────────────
function PromotionsSection() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadVouchers = async () => {
      try {
        const response = await api.vouchers.getAll();
        if (response.success && response.data) {
          setVouchers(response.data);
        }
      } catch (error) {
        console.error('Failed to load vouchers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVouchers();
  }, []);

  // Get active vouchers only (limit to 3)
  const activeVouchers = vouchers.filter((v: any) => {
    const isExpired = new Date(v.end_date) < new Date();
    return v.status === '1' && !isExpired;
  }).slice(0, 3);

  if (loading || activeVouchers.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-red-50 to-orange-50 w-full">
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 sm:mb-10 gap-4 w-full">
          <SectionTitle 
            tag="Ưu đãi" 
            title="Khuyến mãi" 
            highlight="Đặc biệt"
            subtitle="Nhận ngay voucher giảm giá hấp dẫn" 
          />
          <Link 
            to="/promotions" 
            className="text-red-500 font-semibold text-sm hover:underline flex items-center gap-1 shrink-0 group animate-fade-in"
          >
            Xem tất cả
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
          {activeVouchers.map((voucher: any, index: number) => {
            const formatDiscount = (discount: string) => {
              const value = parseFloat(discount);
              return `${value.toLocaleString('vi-VN')}đ`;
            };

            const formatDate = (dateString: string) => {
              const date = new Date(dateString);
              return date.toLocaleDateString('vi-VN');
            };

            return (
              <div
                key={voucher.id}
                className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-red-500 transition-all hover:shadow-xl hover:scale-105 animate-fade-in-up cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => navigate('/promotions')}
              >
                <div className="flex">
                  {/* Left side - Discount badge */}
                  <div className="w-28 sm:w-32 flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 text-white p-4">
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold leading-tight">
                        {formatDiscount(voucher.discount)}
                      </div>
                      <div className="text-xs mt-1">GIẢM GIÁ</div>
                    </div>
                  </div>

                  {/* Right side - Voucher details */}
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-base text-gray-800">{voucher.code}</h3>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        Còn hạn
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-gray-600 mb-3">
                      <p>• Đơn tối thiểu: {parseFloat(voucher.min_order_value).toLocaleString('vi-VN')}đ</p>
                      <p>• HSD: {formatDate(voucher.end_date)}</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(voucher.code);
                      }}
                      className="w-full py-2 px-4 rounded bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                      Sao chép mã
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Banner */}
        
      </div>
    </section>
  );
}

// ───── Best Sellers ───────────────────────────────────────────────────────────
function BestSellers() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await api.products.getAllFromCategories();
        if (response.success && response.data) {
          setProducts(response.data);
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const best = products.slice(0, 3);

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-950 text-white w-full">
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="text-center lg:text-left">
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Bán chạy nhất</span>
            <h2 className="font-display text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mt-2 mb-3 sm:mb-4 leading-tight">
              Sản phẩm <em className="text-accent-400 not-italic">Được yêu thích</em>
            </h2>
            <p className="text-gray-400 leading-relaxed text-xs sm:text-sm lg:text-base">
              Hàng ngàn khách hàng tin tưởng và lựa chọn. Đây là những sản phẩm bán chạy nhất của chúng tôi.
            </p>
            <Link to="/shop" className="inline-block mt-4 sm:mt-6 lg:mt-8 btn-primary text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
              Xem sản phẩm bán chạy
            </Link>
          </div>
          <div className="flex flex-col gap-2 sm:gap-3 lg:gap-4 mt-6 lg:mt-0">
            {loading && <LoadingSpinner />}
            {best.map((p: Product, i: number) => (
              <Link key={p.id} to={`/product/${p.id}`}
                className="flex items-center gap-2 sm:gap-3 lg:gap-4 bg-white/5 hover:bg-white/10 rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-4 transition-colors group">
                <span className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-white/20 w-5 sm:w-6 lg:w-8 shrink-0">
                  0{i + 1}
                </span>
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl overflow-hidden bg-gray-800 shrink-0">
                  <img src={getProductImages(p)[0]} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <h4 className="font-semibold text-white line-clamp-2 group-hover:text-brand-400 transition-colors text-xs sm:text-sm lg:text-base leading-tight">
                    {p.name}
                  </h4>
                  <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5 sm:mt-1">
                    ⭐ {p.rating || 0} · {(p.reviewCount || 0).toLocaleString()} đánh giá
                  </p>
                </div>
                <span className="text-white font-bold shrink-0 text-xs sm:text-sm lg:text-base whitespace-nowrap">
                  {formatPrice(p.price)}₫
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ───── Newsletter ─────────────────────────────────────────────────────────────
function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await api.subscribers.subscribe(email);
      setStatus(res.success ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-brand-500 to-brand-700 w-full">
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">Nhận tin khuyến mãi</h2>
        <p className="text-white/70 mb-6 sm:mb-8 text-sm sm:text-base">Đăng ký để nhận thông tin ưu đãi và sản phẩm mới nhất từ Nano Geyser.</p>

        {status === 'success' ? (
          <div className="bg-white/20 rounded-2xl p-4 sm:p-6 text-white font-semibold text-base sm:text-lg w-full max-w-md mx-auto">
            🎉 Đăng ký thành công! Cảm ơn bạn đã quan tâm.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto w-full">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="flex-1 px-4 sm:px-5 py-3 sm:py-3.5 rounded-full bg-white text-gray-900 placeholder-gray-400
                         outline-none focus:ring-2 focus:ring-white/50 text-sm font-medium"
            />
            <Button loading={status === 'loading'} type="submit"
              className="!bg-gray-900 hover:!bg-gray-800 !text-white shrink-0 w-full sm:w-auto">
              Đăng ký
            </Button>
          </form>
        )}
        {status === 'error' && (
          <p className="text-white/70 text-sm mt-3">Email đã được đăng ký hoặc không hợp lệ.</p>
        )}
        <p className="text-white/50 text-xs mt-4">Không spam. Hủy đăng ký bất cứ lúc nào.</p>
      </div>
    </section>
  );
}

// ───── Page ───────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <main>
      <HeroSection />
      <CategoriesSection />
      <FeaturedProducts />
      <PromotionsSection />
      <BestSellers />
      <NewsletterSection />
    </main>
  );
}
