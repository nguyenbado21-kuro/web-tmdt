// App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import CheckoutPage from './pages/CheckoutPage';
import './styles/checkout.css';

const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <Routes>
        <Route path="/checkout/:token" element={<CheckoutPage />} />
      </Routes>
    </BrowserRouter>
  </Provider>
);

export default App;
