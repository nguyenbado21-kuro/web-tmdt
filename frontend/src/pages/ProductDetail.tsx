import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { useCart } from '../store/cartContext';
import { getProductImages, formatPrice } from '../types';
import LoadingSpinner, { ErrorState } from '../components/LoadingSpinner';
import Button from '../components/Button';
import deliveryIcon from '../assets/delivery.png'
import changeIcon from '../assets/change.png'
import secureIcon from '../assets/lock.png'
import FloatingButtons from '../components/FloatingButtons';


export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'description' | 'reviews'>('description');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const { data: product, loading, error, refetch } = useFetch(
    () => api.products.getById(id!),
    [id]
  );

  // Fallback: Always fetch some products for related section
  const { data: allProducts } = useFetch(() => api.products.getAllFromCategories(), []);

  const { data: relatedProducts } = useFetch(
    () => {
      if (!product) return Promise.resolve({ success: true, data: [] });
      
      // Try to get products from same category first
      const categoryId = product.category_id || product.categoryId;
      if (categoryId) {
        return api.products.getAll({ categoryId: categoryId.toString() });
      }
      
      // Fallback: get all products if no category
      return api.products.getAllFromCategories();
    },
    [product?.id] // Only depend on product ID to avoid infinite loops
  );

  // Use related products if available, otherwise use all products
  const displayProducts = relatedProducts && relatedProducts.length > 0 ? relatedProducts : allProducts;

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleViewAllProducts = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/shop');
  };

  // Swipe handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (images: string[]) => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      // Swipe left - next image
      setImgIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
    if (isRightSwipe) {
      // Swipe right - previous image
      setImgIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!product) return <ErrorState message="Product not found" onRetry={refetch} />;

  const images = getProductImages(product);
  const currentPrice = Number(product.price);
  const salePrice = product.price_sale && Number(product.price_sale) > 0 ? Number(product.price_sale) : null;
  const discount = salePrice ? Math.round(((currentPrice - salePrice) / currentPrice) * 100) : 0;

  return (
    <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex gap-2 text-sm text-gray-400 mb-6 sm:mb-8 overflow-x-auto">
        <Link to="/" className="hover:text-brand-500 whitespace-nowrap">Trang chủ</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-brand-500 whitespace-nowrap">Sản phẩm</Link>
        <span>/</span>
        <span className="text-gray-700 truncate">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-12">
        {/* Images */}
        <div className="group animate-slide-in-left">
          <div 
            className="aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 mb-3 sm:mb-4 relative flex items-center justify-center p-2 sm:p-4 touch-pan-y"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={() => onTouchEnd(images)}
          >
            {images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`${product.name} - Ảnh ${index + 1}`}
                className={`max-w-full max-h-full object-contain transition-all duration-700 ease-in-out ${
                  index === imgIdx 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-105 absolute'
                }`}
              />
            ))}
            
            {/* Navigation arrows for multiple images */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx(imgIdx === 0 ? images.length - 1 : imgIdx - 1)}
                  className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setImgIdx(imgIdx === images.length - 1 ? 0 : imgIdx + 1)}
                  className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 bg-black/50 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full transition-all duration-300">
                {imgIdx + 1} / {images.length}
              </div>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setImgIdx(i)}
                  className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 flex-shrink-0 hover:scale-105 ${
                    imgIdx === i 
                      ? 'border-brand-500 ring-2 ring-brand-200 scale-105' 
                      : 'border-gray-200 hover:border-brand-300'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`Thumbnail ${i + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110" 
                  />
                  {imgIdx === i && (
                    <div className="absolute inset-0 bg-brand-500/10 animate-fade-in-scale"></div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-4 lg:mt-0 animate-slide-in-right">
          {discount > 0 && (
            <span className="inline-block bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full mb-3 animate-bounce-in">
              -{discount}% OFF
            </span>
          )}
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-3 leading-tight animate-slide-up-fade delay-100">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4 animate-slide-up-fade delay-150">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} width="16" height="16" viewBox="0 0 24 24"
                  fill={i <= Math.round(product.rating || 0) ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2"
                  className="transition-all duration-300 hover:scale-110">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <span className="text-gray-600 text-sm">{product.rating || 0} ({(product.reviewCount || 0).toLocaleString()} đánh giá)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4 sm:mb-6 animate-slide-up-fade delay-200">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 transition-all duration-300 hover:text-brand-500">
              {formatPrice(salePrice || currentPrice)}₫
            </span>
            {salePrice && (
              <span className="text-base sm:text-lg lg:text-xl text-gray-400 line-through">{formatPrice(currentPrice)}₫</span>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed mb-4 sm:mb-6 lg:mb-8 text-sm sm:text-base animate-slide-up-fade delay-225">{product.meta || product.description}</p>


          {/* Quantity + Add to Cart */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 animate-slide-up-fade delay-300">
            <div className="flex items-center border border-gray-200 rounded-full overflow-hidden w-fit mx-auto sm:mx-0 transition-all duration-300 hover:border-brand-300 hover:shadow-md">
              <button onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-lg font-bold transition-all duration-300 hover:scale-110">
                −
              </button>
              <span className="w-10 text-center font-semibold transition-all duration-300">{qty}</span>
              <button onClick={() => setQty(qty + 1)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-lg font-bold transition-all duration-300 hover:scale-110">
                +
              </button>
            </div>
            <Button size="lg" onClick={handleAddToCart}
              className={`flex-1 sm:flex-initial sm:min-w-[200px] transition-all duration-300 ${added ? 'animate-bounce-in' : 'hover:scale-105'}`}>
              {added ? '✓ Đã thêm!' : 'Thêm vào giỏ'}
            </Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-4 sm:pt-6 lg:pt-8 border-t border-gray-100 animate-slide-up-fade delay-375">
            {[
              [ deliveryIcon, 'Miễn phí vận chuyển', 'Đơn hàng trên 5 triệu'],
              [changeIcon, 'Đổi trả dễ dàng', 'Bảo hành 30 ngày'],
              [secureIcon, 'Thanh toán an toàn', 'Mã hóa SSL'],
            ].map(([icon, title, sub], index) => (
              <div key={title} className={`text-center p-2 sm:p-3 bg-gray-50 rounded-xl transition-all duration-300 hover:bg-gray-100 hover:scale-105 animate-slide-up-fade delay-${450 + index * 75}`}>
                <div className="flex justify-center mb-1 sm:mb-2">
                  <img src={icon} alt={title} className="w-6 h-5 sm:w-8 sm:h-6 md:w-10 md:h-8 transition-transform duration-300 hover:scale-110" />
                </div>
                <div className="text-xs font-semibold text-gray-700">{title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-10 sm:mt-12 lg:mt-16">
        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <div className="flex gap-2 sm:gap-4 lg:gap-8 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('description')}
              className={`pb-3 sm:pb-4 px-1 sm:px-2 font-semibold transition-colors relative whitespace-nowrap text-xs sm:text-sm lg:text-base ${
                activeTab === 'description' ? 'text-brand-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              MÔ TẢ SẢN PHẨM
              {activeTab === 'description' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 sm:pb-4 px-1 sm:px-2 font-semibold transition-colors relative whitespace-nowrap text-xs sm:text-sm lg:text-base ${
                activeTab === 'details' ? 'text-brand-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              CHI TIẾT SẢN PHẨM
              {activeTab === 'details' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 sm:pb-4 px-1 sm:px-2 font-semibold transition-colors relative whitespace-nowrap text-xs sm:text-sm lg:text-base ${
                activeTab === 'reviews' ? 'text-brand-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ĐÁNH GIÁ SẢN PHẨM
              {activeTab === 'reviews' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="py-4 sm:py-6 lg:py-8">
          {/* Description Tab */}
          {activeTab === 'description' && (
            <div className="max-w-none animate-tab-slide-in">
              {product.content ? (
                <div className="space-y-8">
                  {/* Detailed content */}
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg">
                    <div className="bg-gray-50 px-8 py-4 border-b border-gray-100">
                      <h3 className="text-lg font-bold text-gray-900">Thông tin chi tiết</h3>
                    </div>
                    <div 
                      className="prose prose-lg max-w-none p-8 prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-img:rounded-xl prose-img:shadow-lg"
                      dangerouslySetInnerHTML={{ __html: product.content }}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-6 space-y-4 transition-all duration-300 hover:bg-gray-100">
                  <p className="text-gray-700 leading-relaxed">{product.meta || product.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4 animate-tab-slide-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {[
                    ['Mã sản phẩm', product.product_code || 'N/A'],
                    ['Model', product.model || 'N/A'],
                    ['Số cấp lọc', product.so_cap_loc || 'N/A'],
                    ['Kho', product.stock || 0],
                    ['Tình trạng', (product.stock || 0) > 0 ? 'Còn hàng' : 'Hết hàng']
                  ].map(([label, value], index) => (
                    <div key={label} className={`flex flex-col sm:flex-row sm:items-center py-3 border-b border-gray-100 transition-all duration-300 hover:bg-gray-50 rounded-lg px-2 animate-slide-up-fade delay-${index * 75}`}>
                      <span className="text-gray-500 sm:w-40 text-sm font-medium">{label}</span>
                      <span className="text-gray-900 font-medium text-sm">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {[
                    ['Thương hiệu', 'Nano Geyser'],
                    ['Công nghệ', 'Nano'],
                    ['Bảo hành', '12 tháng'],
                    ['Gửi từ', 'TP. Hà Nội'],
                    ['Đánh giá', `${product.rating || 0} ⭐ (${(product.reviewCount || 0)} đánh giá)`]
                  ].map(([label, value], index) => (
                    <div key={label} className={`flex flex-col sm:flex-row sm:items-center py-3 border-b border-gray-100 transition-all duration-300 hover:bg-gray-50 rounded-lg px-2 animate-slide-up-fade delay-${(index + 5) * 75}`}>
                      <span className="text-gray-500 sm:w-40 text-sm font-medium">{label}</span>
                      <span className="text-gray-900 font-medium text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="animate-tab-slide-in">
              {/* Rating Summary */}
              <div className="bg-amber-50 rounded-xl p-4 sm:p-6 mb-6 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 transition-all duration-300 hover:bg-amber-100">
                <div className="text-center animate-bounce-in">
                  <div className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">{product.rating || 0}</div>
                  <div className="flex justify-center mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} width="20" height="20" viewBox="0 0 24 24"
                        fill={i <= Math.round(product.rating || 0) ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2"
                        className="transition-all duration-300 hover:scale-125">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">{(product.reviewCount || 0).toLocaleString()} đánh giá</div>
                </div>
                <div className="flex-1 space-y-2 w-full">
                  {[5, 4, 3, 2, 1].map((star, index) => (
                    <div key={star} className={`flex items-center gap-3 animate-slide-up-fade delay-${index * 75}`}>
                      <span className="text-sm text-gray-600 w-12">{star} ⭐</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-400 transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${star === 5 ? 80 : star === 4 ? 15 : 5}%`,
                            animationDelay: `${index * 0.2}s`
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-12 text-right">
                        {star === 5 ? '80%' : star === 4 ? '15%' : '5%'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Reviews */}
              <div className="space-y-4">
                {[
                  {
                    user: 'k*****e',
                    date: '2026-02-14 14:46',
                    rating: 5,
                    variant: 'Killbus Spider, Fullbox',
                    comment: 'Đúng với mô tả: Đúng\nChất lượng sản phẩm: Trên cả tuyệt vời\nShop thân thiện hỗ trợ khách nhiệt tình. Sẽ còn ủng hộ shop'
                  },
                  {
                    user: '1ha200737',
                    date: '2026-02-07 18:53',
                    rating: 5,
                    variant: 'Build&RabbitTank&Dây, Nobox',
                    comment: 'Được shop tặng thêm 1 bottle nữa quá đã'
                  },
                  {
                    user: 'jr46ukrp24',
                    date: '2026-02-25 17:12',
                    rating: 5,
                    variant: 'Great Cross Z Dragon, Nobox',
                    comment: 'Đúng với mô tả: tốt\nChất lượng sản phẩm: đẹp'
                  }
                ].map((review, idx) => (
                  <div key={idx} className={`card p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] animate-slide-up-fade delay-${idx * 100}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">{review.user}</div>
                        <div className="text-sm text-gray-500">{review.date}</div>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <svg key={i} width="16" height="16" viewBox="0 0 24 24"
                            fill={i <= review.rating ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2"
                            className="transition-all duration-300 hover:scale-110">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">Phân loại hàng: {review.variant}</div>
                    <p className="text-gray-700 whitespace-pre-line">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {(() => {
        const filteredProducts = displayProducts?.filter((p: any) => p.id !== product?.id) || [];
        return filteredProducts.length > 0;
      })() && (
        <div className="mt-12 sm:mt-16 lg:mt-20">
          <div className="text-center mb-6 sm:mb-8 lg:mb-12">
            <span className="text-sm font-semibold text-brand-500 uppercase tracking-wider">Sản phẩm tương tự</span>
            <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-2 mb-3 sm:mb-4">
              Có thể bạn <span className="text-brand-500">quan tâm</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
              Khám phá thêm các sản phẩm máy lọc nước Nano Geyser khác với công nghệ tiên tiến
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {displayProducts
              ?.filter((p: any) => p.id !== product?.id) // Filter out current product
              .slice(0, 4) // Take first 4 products
              .map((p: any, index: number) => {
              const relatedImages = getProductImages(p);
              const relatedCurrentPrice = Number(p.price);
              const relatedSalePrice = p.price_sale && Number(p.price_sale) > 0 ? Number(p.price_sale) : null;
              const relatedDiscount = relatedSalePrice ? Math.round(((relatedCurrentPrice - relatedSalePrice) / relatedCurrentPrice) * 100) : 0;
              
              return (
                <div key={p.id} className="group relative bg-white rounded-2xl border border-gray-100 hover:border-brand-200 hover:shadow-xl transition-all duration-300 overflow-hidden animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  {/* Discount badge */}
                  {relatedDiscount > 0 && (
                    <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      -{relatedDiscount}%
                    </div>
                  )}
                  
                  {/* Image */}
                  <Link to={`/product/${p.id}`} className="block relative overflow-hidden bg-gray-50 aspect-square">
                    <img 
                      src={relatedImages[0]} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </Link>
                  
                  {/* Content */}
                  <div className="p-4 sm:p-6">
                    <div className="mb-2 sm:mb-3">
                      <span className="text-xs font-medium text-brand-500 uppercase tracking-wide">
                        {p.product_code || 'Nano Geyser'}
                      </span>
                    </div>
                    
                    <Link to={`/product/${p.id}`}>
                      <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 line-clamp-2 group-hover:text-brand-500 transition-colors leading-snug text-sm sm:text-base">
                        {p.name}
                      </h3>
                    </Link>
                    
                    {/* Features */}
                    <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 text-xs text-gray-500">
                      {p.so_cap_loc && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>{p.so_cap_loc} cấp</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                        </svg>
                        <span>Nano</span>
                      </div>
                    </div>
                    
                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base sm:text-lg font-bold text-brand-500">
                          {formatPrice(relatedSalePrice || relatedCurrentPrice)}₫
                        </span>
                        {relatedSalePrice && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(relatedCurrentPrice)}₫
                          </span>
                        )}
                      </div>
                      
                      <Link 
                        to={`/product/${p.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-brand-500 text-white rounded-full hover:bg-brand-600 transition-colors group-hover:scale-110 duration-300"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* View all button */}
          <div className="text-center mt-6 sm:mt-8 lg:mt-12">
            <button 
              onClick={handleViewAllProducts}
              className="inline-flex items-center gap-2 px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gray-100 hover:bg-brand-500 text-gray-700 hover:text-white rounded-full font-semibold transition-all duration-300 group text-sm sm:text-base"
            >
              Xem tất cả sản phẩm
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
      <FloatingButtons phoneNumber="0123456789" />
    </main>
  );
}
