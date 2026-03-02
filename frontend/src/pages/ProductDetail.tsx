import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { useCart } from '../store/cartContext';
import LoadingSpinner, { ErrorState } from '../components/LoadingSpinner';
import Button from '../components/Button';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  const { data: product, loading, error, refetch } = useFetch(
    () => api.products.getById(id!),
    [id]
  );

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!product) return <ErrorState message="Product not found" onRetry={refetch} />;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex gap-2 text-sm text-gray-400 mb-8">
        <Link to="/" className="hover:text-brand-500">Trang chủ</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-brand-500">Sản phẩm</Link>
        <span>/</span>
        <span className="text-gray-700 truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 mb-4">
            <img
              src={product.images[imgIdx] ?? product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600?text=Product'; }}
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${imgIdx === i ? 'border-brand-500' : 'border-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {discount > 0 && (
            <span className="inline-block bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full mb-3">
              -{discount}% OFF
            </span>
          )}
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} width="16" height="16" viewBox="0 0 24 24"
                  fill={i <= Math.round(product.rating) ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <span className="text-gray-600 text-sm">{product.rating} ({product.reviewCount.toLocaleString()} đánh giá)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-4xl font-bold text-gray-900">{product.price.toLocaleString('vi-VN')}đ</span>
            {product.originalPrice && (
              <span className="text-xl text-gray-400 line-through">{product.originalPrice.toLocaleString('vi-VN')}đ</span>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed mb-8">{product.description}</p>

          {/* Stock */}
          <div className="flex items-center gap-2 mb-6 text-sm">
            <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
              {product.stock > 0 ? `Còn hàng (${product.stock} sản phẩm)` : 'Hết hàng'}
            </span>
          </div>

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-lg font-bold transition-colors">
                −
              </button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-lg font-bold transition-colors">
                +
              </button>
            </div>
            <Button size="lg" onClick={handleAddToCart} disabled={product.stock === 0}
              className="flex-1">
              {added ? '✓ Đã thêm!' : 'Thêm vào giỏ'}
            </Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mt-8 pt-8 border-t border-gray-100">
            {[
              ['🚚', 'Miễn phí vận chuyển', 'Đơn hàng trên 5 triệu'],
              ['🔄', 'Đổi trả dễ dàng', 'Bảo hành 30 ngày'],
              ['🔒', 'Thanh toán an toàn', 'Mã hóa SSL'],
            ].map(([icon, title, sub]) => (
              <div key={title} className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs font-semibold text-gray-700">{title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
