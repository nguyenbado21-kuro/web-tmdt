import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { Category, Product, getProductImages, formatPrice } from '../types';
import ProductCard from '../components/ProductCard';
import SectionTitle from '../components/SectionTitle';
import Button from '../components/Button';
import LoadingSpinner, { ErrorState } from '../components/LoadingSpinner';
import FloatingHotline from '../components/FloatingHotline';

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
    <section className="relative overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-gray-900 text-white">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-float" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 animate-float" style={{ animationDelay: '3s' }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur rounded-full px-4 py-2 text-sm font-medium mb-6 animate-fade-in-down">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Công nghệ lọc nước từ Mỹ
            </span>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6 animate-fade-in-left delay-100">
              Nước sạch <br /><em className="text-accent-400 not-italic">An Toàn</em><br /> Cho mọi nhà
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-md mb-8 animate-fade-in-left delay-200">
              Máy lọc nước Nano Geyser - Công nghệ tiên tiến từ Mỹ, lọc sạch 99.9% tạp chất, giữ lại khoáng chất tự nhiên có lợi cho sức khỏe.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in-left delay-300">
              <Button size="lg" onClick={() => navigate('/shop')} className="group">
                Xem sản phẩm
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Button>
              <Button size="lg" variant="outline" className="!border-white/30 !text-white hover:!bg-white/10"
                onClick={() => navigate('/shop')}>
                Tư vấn miễn phí
              </Button>
            </div>
            {/* Stats row */}
            <div className="flex gap-8 mt-12 pt-10 border-t border-white/10 animate-fade-in-up delay-400">
              {[['10K+', 'Khách hàng'], ['50+', 'Đại lý'], ['99%', 'Hài lòng']].map(([n, l]) => (
                <div key={l} className="hover:scale-110 transition-transform duration-300">
                  <div className="font-display font-bold text-2xl text-white">{n}</div>
                  <div className="text-white/40 text-sm">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Image Slider */}
          <div className="relative z-10 max-w-lg mx-auto lg:mx-0 animate-fade-in-right delay-200">
            <div className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer">
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
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
              ))}
            </div>

            {/* Dots Navigation */}
            <div className="flex justify-center gap-2 mt-6">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentSlide
                      ? 'w-8 h-2 bg-white'
                      : 'w-2 h-2 bg-white/40 hover:bg-white/60'
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
  const { data: categories, loading, error } = useFetch(() => api.categories.getAll(), []);
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">DANH MỤC</h2>
        </div>
        
        {loading && <LoadingSpinner />}
        {error && <ErrorState message={error} />}
        {categories && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {categories.map((cat: Category, index: number) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/shop?categoryId=${cat.id}`)}
                
                className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}>
                {/* Icon/Image Container */}
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
                  {cat.image ? (
                    <img 
                      src={cat.image} 
                      alt={cat.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { 
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-2xl">🏷️</span>';
                      }}
                    />
                  ) : (
                    <span className="text-2xl">🏷️</span>
                  )}
                </div>
                
                {/* Category Name */}
                <span className="text-xs text-center text-gray-700 font-medium leading-tight line-clamp-2 group-hover:text-brand-500 transition-colors">
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
  const { data: allProducts, loading, error } = useFetch(() => api.products.getAllFromCategories(), []);
  
  // Get first 4 products
  const products = allProducts?.slice(0, 4);

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <SectionTitle tag="Nổi bật" title="Sản phẩm" highlight="Đặc biệt"
            subtitle="Những dòng máy lọc nước được yêu thích nhất" />
          <Link to="/shop" className="text-brand-500 font-semibold text-sm hover:underline flex items-center gap-1 shrink-0 mb-4 group animate-fade-in">
            Xem tất cả
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        {loading && <LoadingSpinner />}
        {error && <ErrorState message={error} />}
        {products && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p: Product, index: number) => (
              <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ───── Best Sellers ───────────────────────────────────────────────────────────
function BestSellers() {
  const { data: products, loading } = useFetch(() => api.products.getAllFromCategories(), []);

  const best = products?.slice(0, 3) ?? [];

  return (
    <section className="py-20 bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Bán chạy nhất</span>
            <h2 className="font-display text-4xl font-bold mt-2 mb-4">Sản phẩm <em className="text-accent-400 not-italic">Được yêu thích</em></h2>
            <p className="text-gray-400 leading-relaxed">Hàng ngàn khách hàng tin tưởng và lựa chọn. Đây là những sản phẩm bán chạy nhất của chúng tôi.</p>
            <Link to="/shop" className="inline-block mt-8 btn-primary">Xem sản phẩm bán chạy</Link>
          </div>
          <div className="flex flex-col gap-4">
            {loading && <LoadingSpinner />}
            {best.map((p: Product, i: number) => (
              <Link key={p.id} to={`/product/${p.id}`}
                className="flex items-center gap-4 bg-white/5 hover:bg-white/10 rounded-2xl p-4 transition-colors group">
                <span className="font-display text-3xl font-bold text-white/20 w-8">0{i + 1}</span>
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-800 shrink-0">
                  <img src={getProductImages(p)[0]} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate group-hover:text-brand-400 transition-colors">
                    {p.name}
                  </h4>
                  <p className="text-gray-400 text-sm">⭐ {p.rating || 0} · {(p.reviewCount || 0).toLocaleString()} đánh giá</p>
                </div>
                <span className="text-white font-bold shrink-0">{formatPrice(p.price)}₫</span>
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
    <section className="py-20 bg-gradient-to-r from-brand-500 to-brand-700">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="font-display text-4xl font-bold text-white mb-3">Nhận tin khuyến mãi</h2>
        <p className="text-white/70 mb-8">Đăng ký để nhận thông tin ưu đãi và sản phẩm mới nhất từ Nano Geyser.</p>

        {status === 'success' ? (
          <div className="bg-white/20 rounded-2xl p-6 text-white font-semibold text-lg">
            🎉 Đăng ký thành công! Cảm ơn bạn đã quan tâm.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="flex-1 px-5 py-3.5 rounded-full bg-white text-gray-900 placeholder-gray-400
                         outline-none focus:ring-2 focus:ring-white/50 text-sm font-medium"
            />
            <Button loading={status === 'loading'} type="submit"
              className="!bg-gray-900 hover:!bg-gray-800 !text-white shrink-0">
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
      <FloatingHotline phoneNumber="0123456789" />
      <HeroSection />
      <CategoriesSection />
      <FeaturedProducts />
      <BestSellers />
      <NewsletterSection />
    </main>
  );
}
