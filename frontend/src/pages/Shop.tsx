import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { Category, Product } from '../types';
import ProductCard from '../components/ProductCard';
import SectionTitle from '../components/SectionTitle';
import LoadingSpinner, { ErrorState } from '../components/LoadingSpinner';
import FloatingButtons from '../components/FloatingButtons';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCat, setSelectedCat] = useState(searchParams.get('categoryId') ?? '');
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const [sort, setSort] = useState('default');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { data: categories } = useFetch(() => api.categories.getAll(), []);
  const { data: allProducts, loading, error, refetch } = useFetch(
    () => api.products.getAllFromCategories(),
    []
  );

  // Filter products by category and search
  const products = allProducts?.filter(p => {
    if (selectedCat && p.category_id !== Number(selectedCat)) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    setSelectedCat(searchParams.get('categoryId') ?? '');
    setSearch(searchParams.get('search') ?? '');
    setSearchInput(searchParams.get('search') ?? '');
  }, [searchParams]);

  // Handle scroll to show/hide floating button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFilterCat = (catId: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedCat(catId);
    const params: Record<string, string> = {};
    if (catId) params.categoryId = catId;
    if (search) params.search = search;
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    const params: Record<string, string> = {};
    if (selectedCat) params.categoryId = selectedCat;
    if (searchInput) params.search = searchInput;
    setSearchParams(params);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sorted = [...(products ?? [])].sort((a: Product, b: Product) => {
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  return (
    <main className="min-h-screen bg-white">
      {/* Shop header */}
      <div className="bg-gray-50 border-b border-gray-100 py-10 w-full">
        <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle tag="Tất cả sản phẩm" title="Khám phá" highlight="Bộ sưu tập của chúng tôi" />

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm outline-none focus:border-brand-500"
            />
            <button type="submit"
              className="px-5 py-2.5 bg-brand-500 text-white rounded-full text-sm font-semibold hover:bg-brand-600 transition-colors">
              Tìm Kiếm
            </button>
          </form>
        </div>
      </div>

      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar filters */}
          <aside className="lg:w-60 shrink-0">
            <h3 className="font-semibold text-gray-900 mb-4">Danh mục</h3>
            <div className="flex flex-row lg:flex-col gap-2 flex-wrap">
              <button
                onClick={() => handleFilterCat('')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors text-left
                  ${!selectedCat ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Tất cả sản phẩm
              </button>
              {categories?.map((cat: Category) => (
                <button key={cat.id}
                  onClick={() => handleFilterCat(String(cat.id))}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors text-left
                    ${selectedCat === String(cat.id) ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="font-semibold text-gray-900 mb-4">Sắp xếp theo</h3>
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-brand-500">
                <option value="default">Mặc định</option>
                <option value="price-asc">Giá: Thấp tới cao</option>
                <option value="price-desc">Giá: Cao xuống thấp</option>
                <option value="rating">Top Đánh giá</option>
              </select>
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            {loading && <LoadingSpinner />}
            {error && <ErrorState message={error} onRetry={refetch} />}
            {!loading && !error && sorted.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-lg font-medium">Không tìm thấy sản phẩm</p>
                <p className="text-sm mt-1">Hãy thử tìm kiếm hoặc chọn danh mục khác</p>
              </div>
            )}
            {sorted.length > 0 && (
              <>
                <p className="text-sm text-gray-400 mb-6">{sorted.length} product{sorted.length !== 1 ? 's' : ''} found</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sorted.map((p: Product) => <ProductCard key={p.id} product={p} />)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Floating buttons */}
      <FloatingButtons phoneNumber="0123456789" />
    </main>
  );
}
