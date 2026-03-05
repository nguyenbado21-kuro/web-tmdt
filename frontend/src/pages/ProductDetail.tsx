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
import FloatingHotline from '../components/FloatingHotline';


export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'description' | 'reviews'>('description');

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

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!product) return <ErrorState message="Product not found" onRetry={refetch} />;

  const images = getProductImages(product);
  const currentPrice = Number(product.price);
  const salePrice = product.price_sale && Number(product.price_sale) > 0 ? Number(product.price_sale) : null;
  const discount = salePrice ? Math.round(((currentPrice - salePrice) / currentPrice) * 100) : 0;

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
              src={images[imgIdx] ?? images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img, i) => (
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
                  fill={i <= Math.round(product.rating || 0) ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <span className="text-gray-600 text-sm">{product.rating || 0} ({(product.reviewCount || 0).toLocaleString()} đánh giá)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-4xl font-bold text-gray-900">
              {formatPrice(salePrice || currentPrice)}₫
            </span>
            {salePrice && (
              <span className="text-xl text-gray-400 line-through">{formatPrice(currentPrice)}₫</span>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed mb-8">{product.meta || product.description}</p>


          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-lg font-bold transition-colors">
                −
              </button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty(qty + 1)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-lg font-bold transition-colors">
                +
              </button>
            </div>
            <Button size="lg" onClick={handleAddToCart}
              className="flex-1">
              {added ? '✓ Đã thêm!' : 'Thêm vào giỏ'}
            </Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mt-8 pt-8 border-t border-gray-100">
            {[
              [ deliveryIcon, 'Miễn phí vận chuyển', 'Đơn hàng trên 5 triệu'],
              [changeIcon, 'Đổi trả dễ dàng', 'Bảo hành 30 ngày'],
              [secureIcon, 'Thanh toán an toàn', 'Mã hóa SSL'],
            ].map(([icon, title, sub]) => (
              <div key={title} className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="flex justify-center mb-2">
                  <img src={icon} alt={title} className="w-10 h-8" />
                </div>
                <div className="text-xs font-semibold text-gray-700">{title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-16">
        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('description')}
              className={`pb-4 px-2 font-semibold transition-colors relative ${
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
              className={`pb-4 px-2 font-semibold transition-colors relative ${
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
              className={`pb-4 px-2 font-semibold transition-colors relative ${
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
        <div className="py-8">
          {/* Description Tab */}
          {activeTab === 'description' && (
            <div className="max-w-none">
              {product.content ? (
                <div className="space-y-8">
                  {/* Detailed content */}
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <p className="text-gray-700 leading-relaxed">{product.meta || product.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex py-3 border-b border-gray-100">
                  <span className="text-gray-500 w-40">Mã sản phẩm</span>
                  <span className="text-gray-900 font-medium">{product.product_code || 'N/A'}</span>
                </div>
                <div className="flex py-3 border-b border-gray-100">
                  <span className="text-gray-500 w-40">Model</span>
                  <span className="text-gray-900 font-medium">{product.model || 'N/A'}</span>
                </div>
                <div className="flex py-3 border-b border-gray-100">
                  <span className="text-gray-500 w-40">Số cấp lọc</span>
                  <span className="text-gray-900 font-medium">{product.so_cap_loc || 'N/A'}</span>
                </div>
                <div className="flex py-3 border-b border-gray-100">
                  <span className="text-gray-500 w-40">Kho</span>
                  <span className="text-gray-900 font-medium">{product.stock || 0}</span>
                </div>
                <div className="flex py-3 border-b border-gray-100">
                  <span className="text-gray-500 w-40">Tình trạng</span>
                  <span className="text-gray-900 font-medium">{(product.stock || 0) > 0 ? 'Còn hàng' : 'Hết hàng'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex py-3 border-b border-gray-100">
                  <span className="text-gray-500 w-40">Thương hiệu</span>
                  <span className="text-gray-900 font-medium">Nano Geyser</span>
                </div>
                <div className="flex py-3 border-b border-gray-100">
                  <span className="text-gray-500 w-40">Công nghệ</span>
                  <span className="text-gray-900 font-medium">Nano</span>
                </div>
                <div className="flex py-3 border-b border-gray-100">
                  <span className="text-gray-500 w-40">Bảo hành</span>
                  <span className="text-gray-900 font-medium">12 tháng</span>
                </div>
                <div className="flex py-3 border-b border-gray-100">
                  <span className="text-gray-500 w-40">Gửi từ</span>
                  <span className="text-gray-900 font-medium">TP. Hà Nội</span>
                </div>
                <div className="flex py-3 border-b border-gray-100">
                  <span className="text-gray-500 w-40">Đánh giá</span>
                  <span className="text-gray-900 font-medium">{product.rating || 0} ⭐ ({(product.reviewCount || 0)} đánh giá)</span>
                </div>
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              {/* Rating Summary */}
              <div className="bg-amber-50 rounded-xl p-6 mb-6 flex items-center gap-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900 mb-2">{product.rating || 0}</div>
                  <div className="flex justify-center mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} width="20" height="20" viewBox="0 0 24 24"
                        fill={i <= Math.round(product.rating || 0) ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">{(product.reviewCount || 0).toLocaleString()} đánh giá</div>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-12">{star} ⭐</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-400"
                          style={{ width: `${star === 5 ? 80 : star === 4 ? 15 : 5}%` }}
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
                  <div key={idx} className="card p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">{review.user}</div>
                        <div className="text-sm text-gray-500">{review.date}</div>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <svg key={i} width="16" height="16" viewBox="0 0 24 24"
                            fill={i <= review.rating ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2">
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
        <div className="mt-20">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-brand-500 uppercase tracking-wider">Sản phẩm tương tự</span>
            <h2 className="font-display text-3xl font-bold text-gray-900 mt-2 mb-4">
              Có thể bạn <span className="text-brand-500">quan tâm</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Khám phá thêm các sản phẩm máy lọc nước Nano Geyser khác với công nghệ tiên tiến
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
                    <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
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
                  <div className="p-6">
                    <div className="mb-3">
                      <span className="text-xs font-medium text-brand-500 uppercase tracking-wide">
                        {p.product_code || 'Nano Geyser'}
                      </span>
                    </div>
                    
                    <Link to={`/product/${p.id}`}>
                      <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-brand-500 transition-colors leading-snug">
                        {p.name}
                      </h3>
                    </Link>
                    
                    {/* Features */}
                    <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
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
                        <span className="text-lg font-bold text-brand-500">
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
                        className="inline-flex items-center justify-center w-10 h-10 bg-brand-500 text-white rounded-full hover:bg-brand-600 transition-colors group-hover:scale-110 duration-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="text-center mt-12">
            <button 
              onClick={handleViewAllProducts}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gray-100 hover:bg-brand-500 text-gray-700 hover:text-white rounded-full font-semibold transition-all duration-300 group"
            >
              Xem tất cả sản phẩm
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
      <FloatingHotline phoneNumber="0123456789" />
    </main>
  );
}
