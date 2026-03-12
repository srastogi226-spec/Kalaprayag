const DELHIVERY_TOKEN = import.meta.env.VITE_DELHIVERY_TOKEN || '';
const PICKUP_PINCODE = import.meta.env.VITE_PICKUP_PINCODE || '282001';

// Use Vercel proxy in production to avoid CORS
const getBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        return '/api/delhivery?path=';
    }
    return 'https://track.delhivery.com/';
};

const headers = () => ({
    Authorization: `Token ${DELHIVERY_TOKEN}`,
    'Content-Type': 'application/json',
});

// ── Category weights (kg) ────────────────────────────────────────────────

export const CATEGORY_WEIGHTS: Record<string, number> = {
    pottery: 1.5,
    bamboo: 0.8,
    textile: 0.5,
    jewellery: 0.3,
    'home-decor': 1.2,
    woodwork: 1.0,
    metalwork: 1.5,
    default: 1.0,
};

export const calculateWeight = (items: Array<{ category?: string; quantity: number }>) =>
    items.reduce((total, item) => {
        const w = CATEGORY_WEIGHTS[item.category || ''] || CATEGORY_WEIGHTS.default;
        return total + w * item.quantity;
    }, 0);

// ── 1. Check Serviceability ──────────────────────────────────────────────

export interface ServiceabilityResult {
    serviceable: boolean;
    deliveryDays: number;
    cod: boolean;
    expressAvailable: boolean;
}

export const checkServiceability = async (pincode: string): Promise<ServiceabilityResult> => {
    try {
        const base = getBaseUrl();
        const url = base.includes('?path=')
            ? `${base}c/api/pin-codes/json/?filter_codes=${pincode}`
            : `${base}c/api/pin-codes/json/?filter_codes=${pincode}`;

        const res = await fetch(url, { headers: headers() });
        const data = await res.json();
        const pin = data.delivery_codes?.[0]?.postal_code;

        return {
            serviceable: !!pin,
            deliveryDays: pin?.pre_paid === 'Y' ? 5 : 7,
            cod: pin?.cod === 'Y',
            expressAvailable: pin?.pre_paid === 'Y',
        };
    } catch (err) {
        console.error('[Delhivery] Serviceability check failed:', err);
        return { serviceable: false, deliveryDays: 0, cod: false, expressAvailable: false };
    }
};

// ── 2. Get Shipping Rate ─────────────────────────────────────────────────

export const getShippingRate = (weight: number, express: boolean = false): number => {
    const baseRate = 50;
    const extraWeight = Math.max(0, weight - 0.5);
    const extraSlabs = Math.ceil(extraWeight / 0.5);
    const shippingCost = baseRate + extraSlabs * 30;
    return express ? Math.round(shippingCost * 2) : shippingCost;
};

// ── 3. Create Shipment ───────────────────────────────────────────────────

export interface ShipmentRequest {
    orderId: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    amount: number;
    weight: number;
    items: string;
    paymentMode: 'Prepaid' | 'COD';
}

export interface ShipmentResult {
    success: boolean;
    awb: string;
    trackingUrl: string;
}

export const createShipment = async (order: ShipmentRequest): Promise<ShipmentResult> => {
    try {
        const shipmentData = {
            format: 'json',
            data: JSON.stringify({
                shipments: [{
                    name: order.customerName,
                    add: order.address,
                    city: order.city,
                    state: order.state,
                    pin: order.pincode,
                    country: 'India',
                    phone: order.customerPhone,
                    order: order.orderId,
                    payment_mode: order.paymentMode,
                    return_pin: PICKUP_PINCODE,
                    return_city: import.meta.env.VITE_PICKUP_CITY || 'Agra',
                    return_phone: '8979771816',
                    return_add: 'Kala Prayag, Agra',
                    return_state: import.meta.env.VITE_PICKUP_STATE || 'Uttar Pradesh',
                    return_country: 'India',
                    products_desc: order.items,
                    hsn_code: '4421',
                    cod_amount: order.paymentMode === 'COD' ? order.amount : 0,
                    order_date: new Date().toISOString(),
                    total_amount: order.amount,
                    seller_add: 'Kala Prayag, Agra',
                    seller_name: 'Kala Prayag',
                    seller_inv: order.orderId,
                    quantity: 1,
                    weight: order.weight * 1000,
                    shipment_length: 30,
                    shipment_width: 20,
                    shipment_height: 15,
                    shipping_mode: 'Surface',
                    address_type: 'home',
                }],
                pickup_location: { name: 'Kala Prayag' },
            }),
        };

        const base = getBaseUrl();
        const url = base.includes('?path=')
            ? `${base}api/cmu/create.json`
            : `${base}api/cmu/create.json`;

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Token ${DELHIVERY_TOKEN}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(shipmentData),
        });

        const data = await res.json();
        const awb = data.packages?.[0]?.waybill;

        return {
            success: !!awb,
            awb: awb || '',
            trackingUrl: awb ? `https://www.delhivery.com/track/package/${awb}` : '',
        };
    } catch (err) {
        console.error('[Delhivery] Create shipment failed:', err);
        return { success: false, awb: '', trackingUrl: '' };
    }
};

// ── 4. Track Shipment ────────────────────────────────────────────────────

export interface TrackingResult {
    status: string;
    location: string;
    timestamp: string;
    expectedDelivery?: string;
    history: Array<{
        status: string;
        location: string;
        time: string;
    }>;
}

export const trackShipment = async (awb: string): Promise<TrackingResult> => {
    try {
        const base = getBaseUrl();
        const url = base.includes('?path=')
            ? `${base}api/v1/packages/json/?waybill=${awb}`
            : `${base}api/v1/packages/json/?waybill=${awb}`;

        const res = await fetch(url, { headers: headers() });
        const data = await res.json();
        const pkg = data.ShipmentData?.[0]?.Shipment;
        const scans = pkg?.Scans || [];

        return {
            status: pkg?.Status?.Status || 'Processing',
            location: pkg?.Status?.StatusLocation || '',
            timestamp: pkg?.Status?.StatusDateTime || '',
            expectedDelivery: pkg?.ExpectedDeliveryDate || '',
            history: scans.map((s: any) => ({
                status: s.ScanDetail?.Instructions || '',
                location: s.ScanDetail?.ScannedLocation || '',
                time: s.ScanDetail?.ScanDateTime || '',
            })),
        };
    } catch (err) {
        console.error('[Delhivery] Track shipment failed:', err);
        return { status: 'Unknown', location: '', timestamp: '', history: [] };
    }
};

// ── 5. Estimated Delivery Date ───────────────────────────────────────────

export const getEstimatedDelivery = (days: number, express: boolean = false): string => {
    const actualDays = express ? Math.ceil(days / 2) : days;
    const from = new Date();
    from.setDate(from.getDate() + actualDays);
    const to = new Date();
    to.setDate(to.getDate() + actualDays + 2);
    const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return `${fmt(from)} – ${fmt(to)}`;
};
