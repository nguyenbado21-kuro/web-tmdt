import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../store/cartContext';
import Button from '../components/Button';
import { api } from '../services/api';

export default function Cart() {
  const { items, totalPrice, totalItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleCheckout = async () => {
    setCheckoutStatus('loading');
    try {
      await api.orders.create({
        userId: 'guest',
        customerName: 'Guest User',
        customerEmail: 'guest@shop.com',
        items: items.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
          image: i.product.images[0],
        })),
        totalPrice: totalPrice * 1.1,
        status: 'pending',
        address: 'Guest Address',
      });
      clearCart();
      setCheckoutStatus('success');
    } catch {
      setCheckoutStatus('idle');
    }
  };

  if (checkoutStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-3">Order Placed!</h1>
          <p className="text-gray-500 mb-8">Thank you for your purchase. You'll receive a confirmation email shortly.</p>
          <Link to="/" className="btn-primary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-7xl mb-6">🛒</div>
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
          <Link to="/shop"><Button size="lg">Start Shopping</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">
        Your Cart <span className="text-gray-400 text-xl font-normal">({totalItems} items)</span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Items */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex gap-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=P'; }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${product.id}`}
                  className="font-semibold text-gray-900 hover:text-brand-500 transition-colors line-clamp-2">
                  {product.name}
                </Link>
                <p className="text-brand-500 font-bold mt-1">${product.price.toFixed(2)}</p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border border-gray-200 rounded-full text-sm">
                    <button onClick={() => quantity > 1 ? updateQuantity(product.id, quantity - 1) : removeFromCart(product.id)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-full font-bold">−</button>
                    <span className="w-8 text-center font-semibold">{quantity}</span>
                    <button onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-full font-bold">+</button>
                  </div>
                  <button onClick={() => removeFromCart(product.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors">Remove</button>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-gray-900">${(product.price * quantity).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-2xl p-6 sticky top-24">
            <h2 className="font-semibold text-gray-900 text-lg mb-6">Order Summary</h2>
            <div className="flex flex-col gap-3 text-sm mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span><span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (10%)</span><span>${(totalPrice * 0.1).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span><span>${(totalPrice * 1.1).toFixed(2)}</span>
              </div>
            </div>
            <Button size="lg" className="w-full" loading={checkoutStatus === 'loading'} onClick={handleCheckout}>
              Checkout
            </Button>
            <Link to="/shop" className="block text-center mt-4 text-sm text-brand-500 hover:underline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
