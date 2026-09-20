let sdkPromise;

export const loadPayHere = () => {
  if (window.payhere) return Promise.resolve(window.payhere);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const fail = () => {
      clearTimeout(timer);
      script.remove();
      sdkPromise = undefined;
      reject(new Error('PayHere could not load. Check your connection and try again.'));
    };
    const timer = setTimeout(fail, 15000);
    script.src = 'https://www.payhere.lk/lib/payhere-2.0.js';
    script.async = true;
    script.onload = () => {
      clearTimeout(timer);
      if (window.payhere) resolve(window.payhere);
      else fail();
    };
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return sdkPromise;
};

export const PENDING_PAYMENT_KEY = 'booknest_pending_payhere';

export const readPendingPayment = () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(PENDING_PAYMENT_KEY) || 'null');
    return saved && typeof saved.orderID === 'string' && typeof saved.paymentToken === 'string' ? saved : null;
  } catch {
    return null;
  }
};