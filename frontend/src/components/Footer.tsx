import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import facebookIcon from '../assets/Facebook_icon.png';
import youtubeIcon from '../assets/YouTube.png';
import zaloIcon from '../assets/Icon_of_Zalopng.png';  

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8 w-full">
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="mb-4">
              <img 
                src={logo} 
                alt="Nano Geyser Logo" 
                className="h-20 w-auto object-contain"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Công nghệ lọc nước tiên tiến từ Mỹ. Mang nước sạch - an toàn - giàu khoáng chất đến mọi gia đình Việt Nam.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="https://www.facebook.com/nano.geyser.official" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors p-1.5">
                <img 
                  src={facebookIcon} 
                  alt="Facebook" 
                  className="w-full h-full object-contain"
                />
              </a>
              <a href="https://www.youtube.com/@maylocnuocnanogeyser_official" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors p-1.5">
                <img 
                  src={youtubeIcon} 
                  alt="YouTube" 
                  className="w-full h-full object-contain"
                />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors p-1.5">
                <img 
                  src={zaloIcon} 
                  alt="Zalo" 
                  className="w-full h-full object-contain"
                />
              </a>
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
