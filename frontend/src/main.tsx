import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './store/cartContext';
import AppRoutes from './routes';
import './assets/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <CartProvider>
      <AppRoutes />
    </CartProvider>
  </BrowserRouter>
);
