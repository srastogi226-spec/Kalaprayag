const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

export interface RazorpayOptions {
    amount: number;        // in ₹ (will be converted to paise)
    currency?: string;
    description: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    onSuccess: (response: RazorpayResponse) => void;
    onFailure: (error: { message: string }) => void;
}

export interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
}

export const openRazorpay = (options: RazorpayOptions): void => {
    // Guard 1 — SDK must be loaded
    if (typeof (window as any).Razorpay !== 'function') {
        console.error('[Razorpay] SDK not found on window. Ensure checkout.js is loaded.');
        options.onFailure({ message: 'Payment gateway not loaded. Please refresh the page and try again.' });
        return;
    }

    // Guard 2 — Key must be configured
    if (!RAZORPAY_KEY_ID) {
        console.error('[Razorpay] VITE_RAZORPAY_KEY_ID is empty. Set it in .env.local and Vercel env vars.');
        options.onFailure({ message: 'Payment gateway is not configured. Please contact support.' });
        return;
    }

    // Guard 3 — Amount must be valid
    const amountPaise = Math.round(options.amount * 100);
    if (!amountPaise || amountPaise < 100) {
        console.error('[Razorpay] Invalid amount:', options.amount);
        options.onFailure({ message: 'Invalid payment amount.' });
        return;
    }

    try {
        const rzp = new (window as any).Razorpay({
            key: RAZORPAY_KEY_ID,
            amount: amountPaise,
            currency: options.currency || 'INR',
            name: 'Kala Prayag',
            description: options.description,
            image: '/studio.png',
            handler: (response: RazorpayResponse) => {
                // Verify we have a payment ID before calling success
                if (!response.razorpay_payment_id) {
                    console.error('[Razorpay] No payment_id in response:', response);
                    options.onFailure({ message: 'Payment verification failed. No payment ID received.' });
                    return;
                }
                options.onSuccess(response);
            },
            prefill: {
                name: options.customerName,
                email: options.customerEmail,
                contact: options.customerPhone,
            },
            notes: {
                address: 'Kala Prayag — Artisanal Heritage',
            },
            theme: {
                color: '#8B735B',
            },
            modal: {
                ondismiss: () => {
                    options.onFailure({ message: 'Payment cancelled by user' });
                },
                confirm_close: true, // Ask user to confirm before closing
            },
        });

        rzp.on('payment.failed', (failResponse: any) => {
            console.error('[Razorpay] Payment failed:', failResponse?.error);
            options.onFailure({
                message: failResponse?.error?.description || 'Payment failed. Please try again.',
            });
        });

        rzp.open();
    } catch (err) {
        console.error('[Razorpay] Error opening checkout:', err);
        options.onFailure({ message: 'Could not open payment window. Please try again.' });
    }
};
