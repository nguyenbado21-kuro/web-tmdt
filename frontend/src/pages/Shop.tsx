import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { Category, Product } from '../types';
import ProductCard from '../components/ProductCard';
import SectionTitle from '../components/SectionTitle';
import LoadingSpinner, { ErrorState } from '../components/LoadingSpinner';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCat, setSelectedCat] = useState(searchParams.get('categoryId') ?? '');
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const [sort, setSort] = useState('default');

  const { data: categories } = useFetch(() => api.categories.getAll());
  const { data: products, loading, error, refetch } = useFetch(
    () => api.products.getAll({ categoryId: selectedCat || undefined, search: search || undefined }),
    [selectedCat, search]
  );

  useEffect(() => {
    setSelectedCat(searchParams.get('categoryId') ?? '');
    setSearch(searchParams.get('search') ?? '');
    setSearchInput(searchParams.get('search') ?? '');
  }, [searchParams]);

  const handleFilterCat = (catId: string) => {
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

  const sorted = [...(products ?? [])].sort((a: Product, b: Product) => {
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    if (sort === 'rating') return b.rating - a.rating;
    return 0;
  });

  return (
    <main className="min-h-screen bg-white">
      {/* Shop header */}
      <div className="bg-gray-50 border-b border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle tag="All products" title="Shop Our" highlight="Collection" />

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
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar filters */}
          <aside className="lg:w-60 shrink-0">
            <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="flex flex-row lg:flex-col gap-2 flex-wrap">
              <button
                onClick={() => handleFilterCat('')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors text-left
                  ${!selectedCat ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                All Products
              </button>
              {categories?.map((cat: Category) => (
                <button key={cat.id}
                  onClick={() => handleFilterCat(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors text-left
                    ${selectedCat === cat.id ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="font-semibold text-gray-900 mb-4">Sort By</h3>
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-brand-500">
                <option value="default">Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
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
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm mt-1">Try a different search or category</p>
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
    </main>
  );
}
