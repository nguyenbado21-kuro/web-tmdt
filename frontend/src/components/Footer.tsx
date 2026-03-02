import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2v20M2 12h20M6 6l12 12M6 18L18 6" />
                </svg>
              </div>
              <span className="font-display font-bold text-xl">Nano Geyser</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Công nghệ lọc nước tiên tiến từ Mỹ. Mang nước sạch - an toàn - giàu khoáng chất đến mọi gia đình Việt Nam.
            </p>
            <div className="flex gap-3 mt-5">
              {['F', 'Y', 'Z', 'T'].map((s, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                  <span className="text-xs font-bold">{s}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            { title: 'Sản phẩm', links: ['Máy lọc gia đình', 'Máy lọc công nghiệp', 'Phụ kiện & Lõi lọc', 'Khuyến mãi', 'Sản phẩm mới'] },
            { title: 'Công ty', links: ['Về chúng tôi', 'Tin tức', 'Tuyển dụng', 'Đối tác', 'Liên hệ'] },
            { title: 'Hỗ trợ', links: ['Trung tâm trợ giúp', 'Chính sách bảo hành', 'Vận chuyển & Lắp đặt', 'Hướng dẫn sử dụng', 'Tra cứu đơn hàng'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-white mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link to="/shop" className="text-gray-400 text-sm hover:text-white transition-colors">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© 2024 Nano Geyser Vietnam. Bảo lưu mọi quyền.</p>
          <div className="flex gap-4 text-gray-500 text-sm">
            <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
