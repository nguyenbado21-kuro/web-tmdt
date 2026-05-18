import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { useCart } from '../store/cartContext';
import { useAuth } from '../store/authContext';
import { getProductImages, formatPrice } from '../types';
import LoadingSpinner, { ErrorState } from '../components/LoadingSpinner';
import Button from '../components/Button';
import deliveryIcon from '../assets/delivery.png'
import changeIcon from '../assets/change.png'
import secureIcon from '../assets/lock.png'
import FloatingButtons from '../components/FloatingButtons';

const baseUrl = import.meta.env.VITE_URL_BACKEND;

const formatMediaUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  
  // Remove backslashes
  let trimmed = url.trim().replace(/\\/g, '');
  
  if (!trimmed || trimmed.toUpperCase() === 'NULL' || trimmed.toLowerCase() === 'null') return '';
  if (trimmed.startsWith('http')) return trimmed;
  
  // Only replace multiple slashes for relative paths to avoid breaking http://
  trimmed = trimmed.replace(/\/+/g, '/');
  
  const base = baseUrl?.endsWith('/') ? baseUrl.slice(0, -1) : (baseUrl || '');
  const path = trimmed.startsWith('/') ? trimmed : '/' + trimmed;
  return base + path;
};

// Helper function to decode text that might be double-encoded or have encoding issues
const decodeText = (text: string): string => {
  if (!text) return '';
  
  try {
    // First, try to decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    let decoded = textarea.value;
    
    // Check if it's still encoded (contains &#x or similar patterns)
    if (decoded.includes('&#')) {
      // Try decoding again
      textarea.innerHTML = decoded;
      decoded = textarea.value;
    }
    
    // If still looks encoded, try manual UTF-8 decoding
    if (/[^\x00-\x7F]/.test(decoded) === false && decoded.includes('?')) {
      // Might be incorrectly encoded UTF-8
      try {
        const bytes = new Uint8Array(decoded.split('').map(c => c.charCodeAt(0)));
        decoded = new TextDecoder('utf-8').decode(bytes);
      } catch {
        // If that fails, return the textarea decoded version
      }
    }
    
    return decoded;
  } catch (error) {
    console.error('Error decoding text:', error);
    return text;
  }
};

const compressImage = async (file: File, maxSizeMB: number): Promise<File> => {
  if (file.size <= maxSizeMB * 1024 * 1024) return file;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      const maxDim = 1920;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      
      // Luôn xuất ra định dạng image/jpeg để đảm bảo nén dung lượng hiệu quả (PNG trên canvas không hỗ trợ tham số quality và thường làm tăng dung lượng file)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'image';
            const newFile = new File([blob], baseName + '.jpg', { type: 'image/jpeg' });
            resolve(newFile.size < file.size ? newFile : file);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        0.7
      );
    };
    img.onerror = () => resolve(file);
  });
};

const compressVideo = async (file: File, maxSizeMB: number): Promise<File> => {
  if (file.size <= maxSizeMB * 1024 * 1024) return file;

  return new Promise((resolve) => {
    let isResolved = false;
    const safeResolve = (resFile: File) => {
      if (isResolved) return;
      isResolved = true;
      resolve(resFile);
    };

    // Bổ sung cơ chế timeout (15 giây) để tránh tình trạng treo form khi nén file dung lượng quá lớn hoặc trình duyệt chặn auto-play
    const timeoutTimer = setTimeout(() => {
      safeResolve(file);
    }, 15000);

    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      video.play().catch(() => {
        clearTimeout(timeoutTimer);
        safeResolve(file);
      });
    };

    video.onplay = () => {
      try {
        const canvas = document.createElement('canvas');
        let w = video.videoWidth || 1280;
        let h = video.videoHeight || 720;

        const maxDim = 854;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        const stream = (canvas as any).captureStream(30);

        try {
          const originalStream = (video as any).captureStream ? (video as any).captureStream() : null;
          if (originalStream && originalStream.getAudioTracks().length > 0) {
            stream.addTrack(originalStream.getAudioTracks()[0]);
          }
        } catch (e) {
          // ignore
        }

        let recorder: MediaRecorder;
        const options: MediaRecorderOptions = {
          videoBitsPerSecond: 1500000,
        };

        const types = [
          'video/webm;codecs=vp8,opus',
          'video/webm;codecs=vp8',
          'video/webm',
          'video/mp4'
        ];

        for (const t of types) {
          if (MediaRecorder.isTypeSupported(t)) {
            options.mimeType = t;
            break;
          }
        }

        try {
          recorder = new MediaRecorder(stream, options);
        } catch (err) {
          try {
            recorder = new MediaRecorder(stream);
          } catch (e) {
            clearTimeout(timeoutTimer);
            safeResolve(file);
            return;
          }
        }

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          clearTimeout(timeoutTimer);
          URL.revokeObjectURL(video.src);
          const mime = recorder.mimeType || 'video/webm';
          const ext = mime.includes('mp4') ? '.mp4' : '.webm';
          const blob = new Blob(chunks, { type: mime });
          const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
          const newFile = new File([blob], (baseName || 'video') + ext, { type: mime });
          safeResolve(newFile.size < file.size ? newFile : file);
        };

        recorder.start();

        const drawFrame = () => {
          if (isResolved) return;
          if (video.ended || video.paused) {
            if (recorder.state === 'recording') recorder.stop();
            return;
          }
          if (ctx) ctx.drawImage(video, 0, 0, w, h);
          requestAnimationFrame(drawFrame);
        };

        drawFrame();

        video.onended = () => {
          if (recorder.state === 'recording') recorder.stop();
        };
      } catch (err) {
        clearTimeout(timeoutTimer);
        safeResolve(file);
      }
    };

    video.onerror = () => {
      clearTimeout(timeoutTimer);
      safeResolve(file);
    };
  });
};

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'description' | 'reviews'>('description');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const { isLoggedIn } = useAuth();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerPhone, setReviewerPhone] = useState('');
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewVideos, setReviewVideos] = useState<File[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [submittingText, setSubmittingText] = useState('');
  const [reviewPage, setReviewPage] = useState(1);
  const reviewsPerPage = 5;
  const [localReviews, setLocalReviews] = useState<any[]>([]);

  const { data: product, loading, error, refetch } = useFetch(
    () => api.products.getById(slug!),
    [slug]
  );

  useEffect(() => {
    if (product?.reviews) {
      setLocalReviews(product.reviews);
    }
  }, [product]);

  useEffect(() => {
    if (window.location.hash === '#reviews') {
      setTimeout(() => {
        const el = document.getElementById('reviews-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  }, [product]);

  // Fallback: Always fetch some products for related section
  const { data: allProducts } = useFetch(() => api.products.getAll(), []);

  const { data: relatedProducts } = useFetch(
    () => {
      if (!product) return Promise.resolve({ success: true, data: [] });

      // Try to get products from same category first
      const categoryId = product.category_id || product.categoryId;
      if (categoryId) {
        return api.products.getAll({ categoryId: categoryId.toString() });
      }

      // Fallback: get all products if no category
      return api.products.getAll();
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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    let finalName = reviewerName;
    let finalPhone = reviewerPhone;
    if (isLoggedIn) {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          finalName = userData.name || userData.email || userData.phone || 'Người dùng';
          finalPhone = userData.phone || finalPhone;
        } catch (e) {
          // ignore
        }
      }
    }
    
    if (!isLoggedIn) {
      if (!finalName.trim()) {
        alert('Vui lòng nhập tên của bạn để đánh giá.');
        return;
      }
      
      const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
      if (!phoneRegex.test(reviewerPhone)) {
        alert('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại có 10 ký tự và bắt đầu bằng các đầu số: 08, 09, 03, 07, 05...');
        return;
      }
    }

    if (!reviewComment.trim()) {
      alert('Vui lòng nhập nội dung đánh giá.');
      return;
    }

    setIsSubmittingReview(true);
    setSubmittingText('Đang xử lý file...');
    try {
      const processedImages = await Promise.all(reviewImages.map(f => compressImage(f, 2)));
      const processedVideos = await Promise.all(reviewVideos.map(f => compressVideo(f, 2)));

      setSubmittingText('Đang gửi đánh giá...');
      console.log('Submitting review:', {
        product_id: Number(product.id),
        rating: reviewRating,
        comment: reviewComment,
        reviewer_name: finalName,
        reviewer_phone: finalPhone,
        images_count: processedImages.length,
        videos_count: processedVideos.length
      });
      const res = await api.products.review({
        product_id: Number(product.id),
        rating: reviewRating,
        comment: reviewComment,
        reviewer_name: finalName,
        reviewer_phone: finalPhone,
        images: processedImages.length > 0 ? processedImages : undefined,
        videos: processedVideos.length > 0 ? processedVideos : undefined
      } as any);
      
      console.log('Review response:', res);
      
      if (res.success || res.error === undefined) {
        alert('Đánh giá của bạn đã được gửi!');
        setReviewComment('');
        setReviewRating(5);
        setReviewImages([]);
        setReviewVideos([]);
        if (!isLoggedIn) {
          setReviewerName('');
          setReviewerPhone('');
        }
        
        // Fetch product silently to update reviews without triggering page loading spinner
        try {
          // Pass true as second argument to bypass browser cache
          const freshProduct = await api.products.getById(product.id.toString(), true);
          if (freshProduct.success && freshProduct.data?.reviews) {
            setLocalReviews(freshProduct.data.reviews);
            setReviewPage(1); // Go back to first page to see the new review
          }
        } catch (fetchErr) {
          console.error('Failed to fetch updated reviews:', fetchErr);
        }
      } else {
        alert(res.error || 'Có lỗi xảy ra khi gửi đánh giá');
      }
    } catch (e) {
      console.error('Review submission error:', e);
      alert('Lỗi mạng: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setIsSubmittingReview(false);
    }
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

  // Reviews processing using localReviews state for silent updates
  const validReviewsCount = localReviews.filter(r => Number(r.status) === 1).length;
  const currentReviews = localReviews
    .filter(r => Number(r.status) === 1)
    .sort((a, b) => {
      // Sắp xếp ưu tiên: có ảnh -> có video -> chữ dài -> chữ ngắn
      const aHasMedia = (a.images && a.images !== 'NULL') || (a.videos && a.videos !== 'NULL');
      const bHasMedia = (b.images && b.images !== 'NULL') || (b.videos && b.videos !== 'NULL');
      
      if (aHasMedia && !bHasMedia) return -1;
      if (!aHasMedia && bHasMedia) return 1;
      
      const aLen = a.comment ? a.comment.length : 0;
      const bLen = b.comment ? b.comment.length : 0;
      return bLen - aLen;
    })
    .slice((reviewPage - 1) * reviewsPerPage, reviewPage * reviewsPerPage);

  const derivedReviewCount = validReviewsCount > 0 ? validReviewsCount : Number(product.reviewCount || 0);
  const derivedRating = validReviewsCount > 0
    ? parseFloat((localReviews.filter(r => Number(r.status) === 1).reduce((sum: number, rv: any) => sum + Number(rv.rating || 5), 0) / validReviewsCount).toFixed(1))
    : Number(product.rating || 0);

  const getStarPercentage = (star: number) => {
    if (localReviews.length === 0) return 0;
    const count = localReviews.filter((rv: any) => Number(rv.rating || 5) === star).length;
    return Math.round((count / localReviews.length) * 100);
  };


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
                src={formatMediaUrl(img)}
                alt={`${product.name} - Ảnh ${index + 1}`}
                className={`max-w-full max-h-full object-contain transition-all duration-700 ease-in-out ${index === imgIdx
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
                  className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 flex-shrink-0 hover:scale-105 ${imgIdx === i
                    ? 'border-brand-500 ring-2 ring-brand-200 scale-105'
                    : 'border-gray-200 hover:border-brand-300'
                    }`}
                >
                  <img
                    src={formatMediaUrl(img)}
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
                  fill={i <= Math.round(derivedRating) ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2"
                  className="transition-all duration-300 hover:scale-110">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <span className="text-gray-600 text-sm">{derivedRating} ({derivedReviewCount.toLocaleString()} đánh giá)</span>
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
              [deliveryIcon, 'Miễn phí vận chuyển', 'Đơn hàng trên 5 triệu'],
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
              className={`pb-3 sm:pb-4 px-1 sm:px-2 font-semibold transition-colors relative whitespace-nowrap text-xs sm:text-sm lg:text-base ${activeTab === 'description' ? 'text-brand-500' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              MÔ TẢ SẢN PHẨM
              {activeTab === 'description' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 sm:pb-4 px-1 sm:px-2 font-semibold transition-colors relative whitespace-nowrap text-xs sm:text-sm lg:text-base ${activeTab === 'details' ? 'text-brand-500' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              CHI TIẾT SẢN PHẨM
              {activeTab === 'details' && (
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
                    ['Bảo hành', '60 tháng'],
                    ['Gửi từ', 'TP. Hà Nội'],
                    ['Đánh giá', `${derivedRating} ⭐ (${derivedReviewCount} đánh giá)`]
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

        </div>
      </div>

      {/* Reviews Section */}
      <div id="reviews-section" className="mt-12 sm:mt-16 lg:mt-20 scroll-mt-24 border-t border-gray-200 pt-10 sm:pt-12 lg:pt-16">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
            Đánh giá <span className="text-brand-500">sản phẩm</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
            Khám phá những đánh giá chân thực từ người dùng đã trải nghiệm sản phẩm
          </p>
        </div>
        <div className="animate-tab-slide-in">
          {/* Rating Summary */}
          <div className="bg-amber-50 rounded-xl p-4 sm:p-6 mb-6 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 transition-all duration-300 hover:bg-amber-100">
            <div className="text-center animate-bounce-in">
              <div className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">{derivedRating}</div>
              <div className="flex justify-center mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} width="20" height="20" viewBox="0 0 24 24"
                    fill={i <= Math.round(derivedRating) ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2"
                    className="transition-all duration-300 hover:scale-125">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <div className="text-sm text-gray-600">{derivedReviewCount.toLocaleString()} đánh giá</div>
            </div>
            <div className="flex-1 space-y-2 w-full">
              {[5, 4, 3, 2, 1].map((star, index) => {
                const pct = getStarPercentage(star);
                return (
                  <div key={star} className={`flex items-center gap-3 animate-slide-up-fade delay-${index * 75}`}>
                    <span className="text-sm text-gray-600 w-12">{star} ⭐</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all duration-1000 ease-out"
                        style={{
                          width: `${pct}%`,
                          animationDelay: `${index * 0.2}s`
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Reviews List */}
          <div className="mt-8 mb-8 space-y-6">
            {(product.reviews && product.reviews.length > 0) ? (
              product.reviews
                .slice((reviewPage - 1) * reviewsPerPage, reviewPage * reviewsPerPage)
                .map((rv: any, idx: number) => (
                <div key={idx} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm animate-fade-in-up">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {decodeText(rv.reviewer_name || rv.user?.username || rv.name || 'Người dùng ẩn danh')}
                      </div>
                      <div className="flex mt-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <svg key={i} width="16" height="16" viewBox="0 0 24 24"
                            fill={i <= Number(rv.rating || 5) ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2"
                            className="transition-all duration-300">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    {rv.created_at && (
                      <div className="text-xs text-gray-400">
                        {new Date(rv.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700 text-sm mt-3 whitespace-pre-wrap break-words">
                    {decodeText(rv.comment || '')}
                  </p>
                  
                  {/* Debug log to dev console */}
                  {(() => {
                    console.log('Rendered review item:', rv);
                    return null;
                  })()}
                  
                  {/* Review Images */}
                  {(() => {
                    const rawImages = rv.images || rv.image || rv.review_images || rv.review_image || rv.images_url || rv.image_url;
                    let images: any[] = [];
                    if (rawImages) {
                      if (typeof rawImages === 'string') {
                        try {
                          const parsed = JSON.parse(rawImages);
                          images = Array.isArray(parsed) ? parsed : [parsed];
                        } catch {
                          // Fallback: clean up brackets, quotes, and backslashes if JSON.parse fails
                          const cleaned = rawImages.replace(/[\[\]"'\\]/g, '');
                          images = cleaned.split(',').map((s: string) => s.trim()).filter(Boolean);
                        }
                      } else if (Array.isArray(rawImages)) {
                        images = rawImages;
                      }
                    }
                    
                    const normalizedImages: string[] = images.map(img => {
                      if (!img) return '';
                      if (typeof img === 'string') return img;
                      if (typeof img === 'object') {
                        return img.link || img.url || img.path || img.image || img.src || '';
                      }
                      return '';
                    }).filter(Boolean);
                    
                    const validImages = normalizedImages.filter(
                      (img) => img.trim() !== '' && img.trim().toUpperCase() !== 'NULL' && img.trim().toLowerCase() !== 'null'
                    );
                    
                    return validImages.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {validImages.map((img: string, imgIdx: number) => {
                          const fullUrl = formatMediaUrl(img);
                          return (
                            <button
                              key={imgIdx}
                              onClick={() => {
                                const modal = document.createElement('div');
                                modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4';
                                modal.onclick = () => modal.remove();
                                modal.innerHTML = `
                                  <div class="relative max-w-4xl max-h-[90vh]">
                                    <img src="${fullUrl}" class="max-w-full max-h-[90vh] object-contain rounded-lg" />
                                    <button class="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 transition-colors">
                                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                `;
                                document.body.appendChild(modal);
                              }}
                              className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-brand-500 transition-all duration-300 hover:scale-105 cursor-pointer"
                            >
                              <img
                                src={fullUrl}
                                alt={`Review image ${imgIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                  
                  {/* Review Videos */}
                  {(() => {
                    const rawVideos = rv.videos || rv.video || rv.review_videos || rv.review_video || rv.videos_url || rv.video_url;
                    let videos: any[] = [];
                    if (rawVideos) {
                      if (typeof rawVideos === 'string') {
                        try {
                          const parsed = JSON.parse(rawVideos);
                          videos = Array.isArray(parsed) ? parsed : [parsed];
                        } catch {
                          // Fallback: clean up brackets, quotes, and backslashes if JSON.parse fails
                          const cleaned = rawVideos.replace(/[\[\]"'\\]/g, '');
                          videos = cleaned.split(',').map((s: string) => s.trim()).filter(Boolean);
                        }
                      } else if (Array.isArray(rawVideos)) {
                        videos = rawVideos;
                      }
                    }
                    
                    const normalizedVideos: string[] = videos.map(v => {
                      if (!v) return '';
                      if (typeof v === 'string') return v;
                      if (typeof v === 'object') {
                        return v.link || v.url || v.path || v.video || v.src || '';
                      }
                      return '';
                    }).filter(Boolean);
                    
                    const validVideos = normalizedVideos.filter(
                      (video) => video.trim() !== '' && video.trim().toUpperCase() !== 'NULL' && video.trim().toLowerCase() !== 'null'
                    );
                    
                    return validVideos.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {validVideos.map((video: string, videoIdx: number) => {
                          const fullUrl = formatMediaUrl(video);
                          return (
                            <div 
                              key={videoIdx} 
                              onClick={() => {
                                const modal = document.createElement('div');
                                modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm transition-opacity duration-300 opacity-0';
                                
                                // Animate in
                                requestAnimationFrame(() => {
                                  modal.classList.remove('opacity-0');
                                });
                                
                                modal.onclick = (e) => {
                                  if (e.target === modal) {
                                    modal.classList.add('opacity-0');
                                    setTimeout(() => modal.remove(), 300);
                                  }
                                };
                                
                                const videoContainer = document.createElement('div');
                                videoContainer.className = 'relative w-full max-w-5xl max-h-[90vh] flex items-center justify-center';
                                
                                const closeBtn = document.createElement('button');
                                closeBtn.className = 'absolute -top-12 right-0 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors z-50';
                                closeBtn.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
                                closeBtn.onclick = () => {
                                  modal.classList.add('opacity-0');
                                  setTimeout(() => modal.remove(), 300);
                                };
                                
                                const videoEl = document.createElement('video');
                                videoEl.src = fullUrl;
                                videoEl.className = 'max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl scale-95 transition-transform duration-300';
                                videoEl.controls = true;
                                videoEl.autoplay = true;
                                
                                // Animate scale
                                requestAnimationFrame(() => {
                                  videoEl.classList.remove('scale-95');
                                  videoEl.classList.add('scale-100');
                                });
                                
                                videoContainer.appendChild(videoEl);
                                videoContainer.appendChild(closeBtn);
                                modal.appendChild(videoContainer);
                                document.body.appendChild(modal);
                              }}
                              className="relative w-48 h-28 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-brand-500 transition-all duration-300 hover:scale-105 group cursor-pointer"
                            >
                              <video
                                src={fullUrl}
                                className="w-full h-full object-cover pointer-events-none"
                                preload="metadata"
                              >
                                Trình duyệt của bạn không hỗ trợ video.
                              </video>
                              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <div className="bg-white/90 rounded-full p-2 group-hover:scale-110 transition-transform shadow-lg">
                                  <svg className="w-8 h-8 text-brand-500 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <p className="text-gray-500 text-lg font-medium">Chưa có đánh giá nào</p>
                <p className="text-gray-400 text-sm mt-2">Hãy là người đầu tiên đánh giá sản phẩm này</p>
              </div>
            )}

            {/* Pagination Controls */}
            {localReviews.length > reviewsPerPage && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setReviewPage(prev => Math.max(1, prev - 1))}
                  disabled={reviewPage === 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                  Trước
                </button>
                <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-none scrollbar-hide">
                  {Array.from({ length: Math.ceil(localReviews.length / reviewsPerPage) }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setReviewPage(page)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                        reviewPage === page 
                          ? 'bg-brand-500 text-white font-medium shadow-md scale-105' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-brand-500'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setReviewPage(prev => Math.min(Math.ceil(localReviews.length / reviewsPerPage), prev + 1))}
                  disabled={reviewPage === Math.ceil(localReviews.length / reviewsPerPage)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1"
                >
                  Sau
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            )}
          </div>

          {/* Review Form */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Viết đánh giá của bạn</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Chất lượng sản phẩm:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} width="24" height="24" viewBox="0 0 24 24"
                      onClick={() => setReviewRating(i)}
                      fill={i <= reviewRating ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2"
                      className="cursor-pointer transition-all duration-300 hover:scale-125">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
              </div>

              {!isLoggedIn && (
                  <>
                    <div>
                      <input
                        type="text"
                        placeholder="Tên của bạn *"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <input
                        type="tel"
                        placeholder="Số điện thoại của bạn *"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow"
                        value={reviewerPhone}
                        onChange={(e) => setReviewerPhone(e.target.value)}
                        maxLength={10}
                        required
                      />
                    </div>
                  </>
                )}

                <div>
                  <textarea
                    placeholder="Chia sẻ cảm nhận của bạn về sản phẩm *"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow min-h-[100px]"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    required
                  ></textarea>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thêm hình ảnh (tùy chọn)
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {reviewImages.map((file, index) => (
                      <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setReviewImages(reviewImages.filter((_, i) => i !== index))}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg p-1 hover:bg-red-600 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {reviewImages.length < 5 && (
                      <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-colors">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs text-gray-500 mt-1">Ảnh</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const remainingSlots = 5 - reviewImages.length;
                            const filesToAdd = files.slice(0, remainingSlots);
                            setReviewImages([...reviewImages, ...filesToAdd]);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Tối đa 5 ảnh (tự động nén nếu dung lượng vượt quá 10MB)</p>
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thêm video ngắn (tùy chọn)
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {reviewVideos.map((file, index) => (
                      <div key={index} className="relative w-32 h-20 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs text-gray-600 mt-1 truncate px-2 max-w-full">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReviewVideos(reviewVideos.filter((_, i) => i !== index))}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg p-1 hover:bg-red-600 transition-colors z-10"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {reviewVideos.length < 2 && (
                      <label className="w-32 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-colors">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-500 mt-1">Video</span>
                        <input
                          type="file"
                          accept="video/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const remainingSlots = 2 - reviewVideos.length;
                            const filesToAdd = files.slice(0, remainingSlots);
                            setReviewVideos([...reviewVideos, ...filesToAdd]);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Tối đa 2 video (tự động nén nếu dung lượng vượt quá 10MB)</p>
                </div>

                <Button type="submit" disabled={isSubmittingReview} className="w-full sm:w-auto">
                  {isSubmittingReview ? (submittingText || 'Đang gửi...') : 'Gửi đánh giá'}
                </Button>
              </form>
            </div>
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
                      <Link to={`/product/${p.slug || p.id}`} className="block relative overflow-hidden bg-gray-50 aspect-square">
                        {relatedImages[0] ? (
                          <img
                            src={typeof relatedImages[0] === 'string' && relatedImages[0] ? (relatedImages[0].startsWith('http') ? relatedImages[0] : baseUrl + relatedImages[0]) : ''}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                      </Link>

                      {/* Content */}
                      <div className="p-4 sm:p-6">
                        <div className="mb-2 sm:mb-3">
                          <span className="text-xs font-medium text-brand-500 uppercase tracking-wide">
                            {p.product_code || 'Nano Geyser'}
                          </span>
                        </div>

                        <Link to={`/product/${p.slug || p.id}`}>
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
                            to={`/product/${p.slug || p.id}`}
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
      <FloatingButtons phoneNumber="038 690 2668" />
    </main>
  );
}
