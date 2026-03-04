import { Link } from 'react-router-dom';
import { Product, getProductImages, formatPrice } from '../types';
import { useCart } from '../store/cartContext';

interface Props {
  product: Product;
}

function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? '#f59e0b' : 'none'}
          stroke="#f59e0b" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="text-xs text-gray-400 ml-1">({reviewCount.toLocaleString()})</span>
    </div>
  );
}

export default function ProductCard({ product }: Props) {
  const { addToCart } = useCart();
  const images = getProductImages(product);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="card group flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
      {/* Image */}
      <Link to={`/product/${product.id}`} className="relative overflow-hidden bg-gray-50 aspect-square block">
        <img
          src={images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Product';
          }}
        />
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discount}%
          </span>
        )}
        {product.featured && (
          <span className="absolute top-3 right-3 bg-brand-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            ✦ Featured
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-700 font-semibold px-4 py-2 rounded-full text-sm">Out of Stock</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="text-xs text-brand-500 font-medium uppercase tracking-wide">
          {product.categoryId ? product.categoryId.toString().replace('cat-', 'Category ') : 'Sản phẩm'}
        </div>
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-gray-900 leading-snug hover:text-brand-500 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <StarRating rating={product.rating || 0} reviewCount={product.reviewCount || 0} />

        <div className="flex items-center gap-2 mt-auto pt-2">
          <span className="text-lg font-bold text-gray-900">{formatPrice(product.price)}đ</span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through">{formatPrice(product.originalPrice)}đ</span>
          )}
        </div>

        <button
          onClick={() => addToCart(product)}
          disabled={product.stock === 0}
          className="w-full mt-1 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-xl
                     hover:bg-brand-600 active:bg-brand-700 transition-colors disabled:opacity-50
                     disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
        </button>
      </div>
    </div>
  );
}
