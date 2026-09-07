import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RbvtaQox8EzFo8CWxU5uMUCrgdi2czKA4Mk1pp5gJw7k571P4yKjkmiDS8U1YjoEUbirSYeME4MYPxA69Lwg3se00NLxEXNIL');

interface Props {
  clientSecret: string;
  onComplete?: () => void;
  onClose?: () => void;
}

export const StripeEmbeddedCheckout = ({ clientSecret, onComplete, onClose }: Props) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10 text-xl font-bold"
        >
          ✕
        </button>
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ clientSecret, onComplete }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  );
};
