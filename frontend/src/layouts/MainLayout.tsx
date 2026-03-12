import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingButtons from '../components/FloatingButtons';

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
      <Header />
      <div className="flex-1 w-full overflow-x-hidden">
        <Outlet />
      </div>
      <Footer />
      <FloatingButtons phoneNumber="0123456789" />
    </div>
  );
}
