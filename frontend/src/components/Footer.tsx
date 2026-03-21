import { Link } from 'react-router-dom';
import facebookIcon from '../assets/Facebook_icon.png';
import youtubeIcon from '../assets/YouTube.png';
import zaloIcon from '../assets/Icon_of_Zalopng.png';
import bocongthuongLogo from '../assets/bocongthuong.png';  
import darklogo from  '../assets/logo-nano-dark.png';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8 w-full">
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="mb-4">
              <img 
                src={darklogo} 
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

          {/* Sản phẩm */}
          <div>
            <h4 className="font-semibold text-white mb-4">Sản phẩm</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/shop?categoryId=13" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Máy lọc gia đình
                </Link>
              </li>
              <li>
                <Link to="/shop?categoryId=13" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Máy lọc công nghiệp
                </Link>
              </li>
              <li>
                <Link to="/shop?categoryId=42" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Phụ kiện & Lõi lọc
                </Link>
              </li>
              <li>
                <Link to="/promotions" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Khuyến mãi
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Sản phẩm mới
                </Link>
              </li>
            </ul>
          </div>

          {/* Công ty */}
          <div>
            <h4 className="font-semibold text-white mb-4">Công ty</h4>
            <ul className="space-y-2">
              <li>
                <Link to="https://nanogeyser.com/ve-chung-toi" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link to="https://nanogeyser.com/blog" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Tin tức
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Tuyển dụng
                </Link>
              </li>
              <li>
                <Link to="https://nanogeyser.com/he-thong-dai-ly" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Đối tác
                </Link>
              </li>
              <li>
                <Link to="https://nanogeyser.com/lien-he" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Hỗ trợ */}
          <div>
            <h4 className="font-semibold text-white mb-4">Hỗ trợ</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Trung tâm trợ giúp
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Chính sách bảo hành
                </Link>
              </li>
              <li>
                <Link to="https://nanogeyser.com/lien-he" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Vận chuyển & Lắp đặt
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Hướng dẫn sử dụng
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Tra cứu đơn hàng
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="text-gray-500 text-sm">© 2024 Nano Geyser Vietnam. Bảo lưu mọi quyền.</p>
            <a 
              href="http://online.gov.vn/Home/WebDetails/136086" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
              title="Đã thông báo Bộ Công Thương"
            >
              <img 
                src={bocongthuongLogo} 
                alt="Đã thông báo Bộ Công Thương" 
                className="h-12 w-auto object-contain"
              />
            </a>
          </div>
          <div className="flex gap-4 text-gray-500 text-sm">
            <Link to="/" className="hover:text-white transition-colors">Chính sách bảo mật</Link>
            <Link to="/" className="hover:text-white transition-colors">Điều khoản dịch vụ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
