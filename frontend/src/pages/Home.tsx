import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { Category, Product } from '../types';
import ProductCard from '../components/ProductCard';
import SectionTitle from '../components/SectionTitle';
import Button from '../components/Button';
import LoadingSpinner, { ErrorState } from '../components/LoadingSpinner';

// ───── Hero ──────────────────────────────────────────────────────────────────
function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-gray-900 text-white">
      {/* Decorative blobs with animation */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-float" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 animate-float" style={{ animationDelay: '1s' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur rounded-full px-4 py-2 text-sm font-medium mb-6 animate-fade-in-down">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Công nghệ lọc nước từ Mỹ
            </span>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6 animate-fade-in-up">
              Nước sạch <em className="text-accent-400 not-italic animate-pulse">An toàn</em><br /> Cho mọi nhà
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-md mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Máy lọc nước Nano Geyser - Công nghệ tiên tiến từ Mỹ, lọc sạch 99.9% tạp chất, giữ lại khoáng chất tự nhiên có lợi cho sức khỏe.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
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
            <div className="flex gap-8 mt-12 pt-10 border-t border-white/10 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              {[['10K+', 'Khách hàng'], ['50+', 'Đại lý'], ['99%', 'Hài lòng']].map(([n, l], i) => (
                <div key={l} className="hover:scale-110 transition-transform duration-300" style={{ animationDelay: `${0.8 + i * 0.1}s` }}>
                  <div className="font-display font-bold text-2xl text-white">{n}</div>
                  <div className="text-white/40 text-sm">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - image grid */}
          <div className="relative z-10 grid grid-cols-2 gap-3 max-w-md mx-auto lg:mx-0">
            {[
              { img: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80', tall: true, label: 'Máy lọc GB-01' },
              { img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&q=80', tall: false, label: 'Máy lọc GB-02' },
              { img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&q=80', tall: false, label: 'Lõi lọc RO' },
              { img: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80', tall: true, label: 'Máy lọc Smart' },
            ].map((item, i) => (
              <div key={i}
                className={`relative overflow-hidden rounded-2xl border border-white/10 hover:scale-105 hover:rotate-1 transition-all duration-500 animate-scale-in ${item.tall ? 'row-span-1' : ''}`}
                style={{ aspectRatio: item.tall ? '4/5' : '4/3', animationDelay: `${i * 0.1}s` }}>
                <img src={item.img} alt={item.label} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-3 left-3 text-white text-xs font-medium bg-white/20 backdrop-blur px-2 py-1 rounded-full">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ───── Categories ─────────────────────────────────────────────────────────────
function CategoriesSection() {
  const { data: categories, loading, error } = useFetch(() => api.categories.getAll());
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle tag="Danh mục" title="Sản phẩm" highlight="Theo loại" />
        {loading && <LoadingSpinner />}
        {error && <ErrorState message={error} />}
        {categories && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat: Category, index: number) => (
              <button key={cat.id}
                onClick={() => navigate(`/shop?categoryId=${cat.id}`)}
                className="group relative overflow-hidden rounded-2xl aspect-square bg-gray-200 border-2 border-transparent hover:border-brand-500 transition-all duration-500 animate-scale-in hover:scale-105"
                style={{ animationDelay: `${index * 0.1}s` }}>
                <img src={cat.image} alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-125 group-hover:rotate-3 transition-all duration-700"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=' + cat.name; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent group-hover:from-brand-900/90 transition-all duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-left transform group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-white font-semibold text-base group-hover:text-brand-300 transition-colors">{cat.name}</h3>
                  <p className="text-white/60 text-xs group-hover:text-white/80 transition-colors">{cat.productCount} sản phẩm</p>
                </div>
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 shimmer" />
                </div>
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
  const { data: products, loading, error } = useFetch(() => api.products.getAll({ featured: true }));

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
        {products && (
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
  const { data: products, loading } = useFetch(() => api.products.getAll());

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
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate group-hover:text-brand-400 transition-colors">
                    {p.name}
                  </h4>
                  <p className="text-gray-400 text-sm">⭐ {p.rating} · {p.reviewCount.toLocaleString()} đánh giá</p>
                </div>
                <span className="text-white font-bold shrink-0">{p.price.toLocaleString()}đ</span>
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
      <HeroSection />
      <CategoriesSection />
      <FeaturedProducts />
      <BestSellers />
      <NewsletterSection />
    </main>
  );
}
