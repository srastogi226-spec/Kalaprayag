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

export const openRazorpay = (options: RazorpayOptions) => {
    if (!(window as any).Razorpay) {
        options.onFailure({ message: 'Razorpay SDK not loaded. Please refresh the page and try again.' });
        return;
    }

    const rzp = new (window as any).Razorpay({
        key: RAZORPAY_KEY_ID,
        amount: Math.round(options.amount * 100), // convert ₹ to paise
        currency: options.currency || 'INR',
        name: 'Kala Prayag',
        description: options.description,
        image: '/studio.png',
        handler: (response: RazorpayResponse) => {
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
        },
    });
    rzp.open();
};
