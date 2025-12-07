/**
 * Golden Bond - Payment Integration
 * Handles Stripe and Razorpay payment processing
 */

// ===========================================
// STRIPE PAYMENT
// ===========================================

/**
 * Initialize Stripe checkout
 */
async function initStripeCheckout(planId, planName, amount) {
  try {
    const token = localStorage.getItem('gb_token');
    
    if (!token) {
      alert('Please log in to continue');
      window.location.href = 'login.html';
      return;
    }

    // Create checkout session
    const response = await fetch('/api/payments/stripe/checkout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ planId })
    });

    const data = await response.json();

    if (data.success && data.url) {
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } else {
      throw new Error(data.error || 'Failed to create checkout session');
    }

  } catch (error) {
    console.error('Stripe checkout error:', error);
    alert('Failed to initiate payment. Please try again.');
  }
}

// ===========================================
// RAZORPAY PAYMENT
// ===========================================

let razorpayLoaded = false;

/**
 * Load Razorpay SDK
 */
function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (razorpayLoaded) {
      resolve();
      return;
    }

    if (window.Razorpay) {
      razorpayLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      razorpayLoaded = true;
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load Razorpay SDK'));
    };
    document.body.appendChild(script);
  });
}

/**
 * Initialize Razorpay checkout
 */
async function initRazorpayCheckout(planId, planName, amount) {
  try {
    const token = localStorage.getItem('gb_token');
    
    if (!token) {
      alert('Please log in to continue');
      window.location.href = 'login.html';
      return;
    }

    // Load Razorpay SDK
    await loadRazorpayScript();

    // Create order
    const response = await fetch('/api/payments/razorpay/order', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ planId })
    });

    const orderData = await response.json();

    if (!orderData.success) {
      throw new Error(orderData.error || 'Failed to create order');
    }

    // Configure Razorpay options
    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: orderData.name,
      description: orderData.description,
      order_id: orderData.orderId,
      prefill: orderData.prefill,
      notes: orderData.notes,
      theme: {
        color: '#C41E3A'
      },
      handler: async function(response) {
        // Payment successful - verify on server
        await verifyRazorpayPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        );
      },
      modal: {
        ondismiss: function() {
          console.log('Payment cancelled');
        }
      }
    };

    // Open Razorpay checkout
    const razorpay = new window.Razorpay(options);
    razorpay.open();

  } catch (error) {
    console.error('Razorpay checkout error:', error);
    alert('Failed to initiate payment. Please try again.');
  }
}

/**
 * Verify Razorpay payment
 */
async function verifyRazorpayPayment(orderId, paymentId, signature) {
  try {
    const token = localStorage.getItem('gb_token');

    const response = await fetch('/api/payments/razorpay/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId,
        paymentId,
        signature
      })
    });

    const data = await response.json();

    if (data.success) {
      // Redirect to success page
      window.location.href = `/payment-success.html?provider=razorpay&order_id=${orderId}&payment_id=${paymentId}&signature=${signature}`;
    } else {
      alert('Payment verification failed: ' + (data.error || 'Unknown error'));
      window.location.href = 'membership.html?error=verification_failed';
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    alert('Failed to verify payment. Please contact support.');
  }
}

// ===========================================
// UNIFIED PAYMENT HANDLER
// ===========================================

/**
 * Handle payment - automatically selects provider based on location/currency
 */
async function handlePayment(planId, planName, amount, currency = 'INR', provider = 'auto') {
  // Auto-select provider based on currency
  if (provider === 'auto') {
    if (currency === 'INR') {
      provider = 'razorpay'; // Prefer Razorpay for INR
    } else {
      provider = 'stripe'; // Stripe for other currencies
    }
  }

  if (provider === 'razorpay') {
    await initRazorpayCheckout(planId, planName, amount);
  } else if (provider === 'stripe') {
    await initStripeCheckout(planId, planName, amount);
  } else {
    alert('Invalid payment provider');
  }
}

/**
 * Format price for display
 */
function formatPrice(amount, currency) {
  const symbols = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };

  const symbol = symbols[currency] || currency;
  const formatted = (amount / 100).toLocaleString();
  
  return `${symbol}${formatted}`;
}

// Export functions for global use
window.initStripeCheckout = initStripeCheckout;
window.initRazorpayCheckout = initRazorpayCheckout;
window.handlePayment = handlePayment;
window.formatPrice = formatPrice;

