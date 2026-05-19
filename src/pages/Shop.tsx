import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Fuse from 'fuse.js';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { Category, Product } from '../types';
import ProductCard from '../components/ProductCard';
import SectionTitle from '../components/SectionTitle';
import LoadingSpinner, { ErrorState } from '../components/LoadingSpinner';


const baseUrl = import.meta.env.VITE_URL_BACKEND;

const removeDiacritics = (str: string) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCat, setSelectedCat] = useState(searchParams.get('categoryId') ?? '');
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const [sort, setSort] = useState('default');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  const { data: categories } = useFetch(() => api.categories.getAll(), []);
  const { data: allProducts, loading, error, refetch } = useFetch(
    async () => {
      if (search) {
        return api.products.getAll({ categoryId: selectedCat, search });
      }

      if (selectedCat) {
        const res = await api.products.getByCategory(selectedCat);
        if (res.success && res.data) {
          const categoryProducts = res.data.products || [];
          return {
            success: true,
            data: categoryProducts.map(p => ({ ...p, category_id: Number(res.data!.id) })) as Product[]
          };
        }
        return { success: false, error: res.error };
      }
      return api.products.getAll();
    },
    [selectedCat, search]
  );

  // Filter products by category
  const products = useMemo(() => {
    let result = allProducts || [];

    // Only display products that belong to an active category
    if (categories && categories.length > 0) {
      const validCategoryIds = new Set(categories.map(c => Number(c.id)));
      result = result.filter(p => {
        const pCatId = Number(p.category_id || (p as any).categoryId || (p as any).cate_id || (p as any).category_id);
        if (!pCatId) return true; // Bypass if category_id is missing from backend response
        return validCategoryIds.has(pCatId);
      });
    }

    if (selectedCat && !search) {
      result = result.filter(p => {
        const pCatId = Number(p.category_id || (p as any).categoryId || (p as any).cate_id);
        return pCatId === Number(selectedCat);
      });
    }

    if (search) {
      const normalizedSearch = removeDiacritics(search);

      const fuse = new Fuse(result, {
        keys: ['name', 'product_code', 'model'],
        threshold: 0.3, // 30% tolerance for typos
        ignoreLocation: true,
        includeScore: true,
        // Match ANY part of the name (LIKE '%keyword%')
        getFn: (obj: any, path: string | string[]) => {
          const key = Array.isArray(path) ? path[0] : path;
          const value = obj[key];
          return removeDiacritics(typeof value === 'string' ? value : '');
        }
      });

      // Perform a full-phrase relative/partial match
      result = fuse.search(normalizedSearch)
        .sort((a, b) => (a.score || 0) - (b.score || 0))
        .map(r => r.item);
    }

    return result;
  }, [allProducts, selectedCat, categories, search]);

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
    setCurrentPage(1);
    const params: Record<string, string> = {};
    if (catId) params.categoryId = catId;
    if (search) params.search = search;
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setCurrentPage(1);
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
    const aCat = Number(a.category_id || (a as any).categoryId || (a as any).cate_id);
    const bCat = Number(b.category_id || (b as any).categoryId || (b as any).cate_id);
    return aCat - bCat;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
                className={`flex-1 min-w-[120px] lg:w-full px-4 py-2 rounded-full lg:rounded-xl text-sm font-medium transition-colors text-center lg:text-left
                  ${!selectedCat ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Tất cả sản phẩm
              </button>
              {categories?.map((cat: Category) => (
                <button key={cat.id}
                  onClick={() => handleFilterCat(String(cat.id))}
                  className={`flex-1 min-w-[120px] lg:w-full px-4 py-2 rounded-full lg:rounded-xl text-sm font-medium transition-colors text-center lg:text-left
                    ${selectedCat === String(cat.id) ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="font-semibold text-gray-900 mb-4">Sắp xếp theo</h3>
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-brand-500 bg-white shadow-sm cursor-pointer">
                <option value="default">Theo danh mục</option>
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
                <div className="text-5xl mb-4 opacity-50">🔍</div>
                <p className="text-lg font-medium text-gray-600">Không tìm thấy sản phẩm</p>
                <p className="text-sm mt-1">Hãy thử tìm kiếm hoặc chọn danh mục khác</p>
              </div>
            )}
            {sorted.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-gray-500 font-medium">Hiển thị {sorted.length} sản phẩm</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginated.map((p: Product) => <ProductCard key={p.id} product={p} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-10">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      ‹ Trước
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                        if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                          acc.push('...');
                        }
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === '...'
                          ? <span key={`ellipsis-${idx}`} className="px-2 py-2 text-gray-400 text-sm">...</span>
                          : <button
                            key={item}
                            onClick={() => handlePageChange(item as number)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
                                ${currentPage === item
                                ? 'bg-brand-500 text-white'
                                : 'text-gray-600 hover:bg-gray-100'}`}>
                            {item}
                          </button>
                      )}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      Sau ›
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

    </main>
  );
}
