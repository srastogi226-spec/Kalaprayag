import React from 'react';
import { InvoiceData } from '../types';
import { formatInvoiceDate } from '../utils/invoiceUtils';

interface InvoiceViewProps {
    invoice: InvoiceData;
    id?: string;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice, id = 'kp-invoice' }) => {
    return (
        <div
            id={id}
            className="bg-white text-[#2C2C2C] p-12 max-w-[800px] mx-auto shadow-sm border border-[#F0F0F0] relative overflow-hidden print:shadow-none print:border-none print:p-0"
            style={{ minHeight: '1122px', borderTop: '8px solid #8B735B' }}
        >
            {/* PAID Watermark */}
            {invoice.payment.status === 'paid' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] pointer-events-none opacity-[0.03] select-none">
                    <span className="text-[180px] font-bold border-[20px] border-[#2C2C2C] px-12 py-4">PAID</span>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-start mb-16">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 bg-[#8B735B] flex items-center justify-center text-white font-bold text-xl">KP</div>
                        <h1 className="text-2xl serif tracking-widest font-bold uppercase">Kala Prayag</h1>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-[#999] italic">Artisanal Heritage</p>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl serif uppercase mb-2">Invoice</h2>
                    <p className="text-sm font-medium">#{invoice.invoiceNumber}</p>
                    <p className="text-xs text-[#999] mt-1">{formatInvoiceDate(invoice.invoiceDate)}</p>
                </div>
            </div>

            {/* Business Details */}
            <div className="grid grid-cols-2 gap-12 mb-16">
                <div>
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#8B735B] font-bold mb-4 border-b border-[#F0F0F0] pb-2">From</h3>
                    <p className="text-sm font-bold mb-1">Kala Prayag Artisans Collective</p>
                    <div className="text-xs text-[#666] space-y-1">
                        <p>123 Heritage Lane, Jaipur</p>
                        <p>Rajasthan, India 302001</p>
                        <p>GSTIN: 08AAACK1234F1Z1</p>
                        <p className="pt-2">contact@kalaprayag.com</p>
                    </div>
                </div>
                <div>
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#8B735B] font-bold mb-4 border-b border-[#F0F0F0] pb-2">Bill To</h3>
                    <p className="text-sm font-bold mb-1">{invoice.customer.name}</p>
                    <div className="text-xs text-[#666] space-y-1">
                        <p>{invoice.customer.email}</p>
                        <p>{invoice.customer.phone}</p>
                        {invoice.customer.address && <p className="pt-1">{invoice.customer.address}</p>}
                    </div>
                </div>
            </div>

            {/* Order Info */}
            <div className="bg-[#FAF9F6] p-6 mb-12 grid grid-cols-3 gap-6">
                <div>
                    <p className="text-[9px] uppercase tracking-widest text-[#999] mb-1">Order Type</p>
                    <p className="text-xs font-bold capitalize">{invoice.orderType} Order</p>
                </div>
                <div>
                    <p className="text-[9px] uppercase tracking-widest text-[#999] mb-1">Order Ref</p>
                    <p className="text-xs font-bold">{invoice.orderId}</p>
                </div>
                <div>
                    <p className="text-[9px] uppercase tracking-widest text-[#999] mb-1">Payment Method</p>
                    <p className="text-xs font-bold uppercase">{invoice.payment.method}</p>
                </div>
            </div>

            {/* Item Table */}
            <div className="mb-16">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b-2 border-[#2C2C2C] text-[10px] uppercase tracking-widest text-[#999]">
                            <th className="pb-4 font-bold">Item Description</th>
                            <th className="pb-4 font-bold text-center">Qty</th>
                            <th className="pb-4 font-bold text-right">Unit Price</th>
                            <th className="pb-4 font-bold text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {invoice.items.map((item, idx) => (
                            <tr key={idx} className="border-b border-[#F0F0F0]">
                                <td className="py-6">
                                    <p className="font-bold mb-1">{item.description}</p>
                                    {item.artisan && <p className="text-[10px] text-[#8B735B] uppercase tracking-widest">by {item.artisan}</p>}
                                </td>
                                <td className="py-6 text-center">{item.quantity}</td>
                                <td className="py-6 text-right">₹ {item.unitPrice.toLocaleString()}</td>
                                <td className="py-6 text-right font-bold">₹ {item.total.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-24">
                <div className="w-full max-w-[300px] space-y-3">
                    <div className="flex justify-between text-xs text-[#666]">
                        <span>Subtotal</span>
                        <span>₹ {invoice.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-[#666]">
                        <span>GST (18%)</span>
                        <span>₹ {invoice.gstAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg serif border-t border-[#F0F0F0] pt-3 font-bold">
                        <span>Total Amount</span>
                        <span>₹ {invoice.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="bg-[#8B735B] text-white p-3 flex justify-between text-xs font-bold">
                        <span className="uppercase tracking-widest">Amount Paid</span>
                        <span>₹ {invoice.payment.paidAmount.toLocaleString()}</span>
                    </div>
                    {invoice.totalAmount - invoice.payment.paidAmount > 0 && (
                        <div className="flex justify-between text-xs text-red-500 font-bold pt-1">
                            <span>Balance Due</span>
                            <span>₹ {(invoice.totalAmount - invoice.payment.paidAmount).toLocaleString()}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Banking */}
            <div className="border-t border-[#F0F0F0] pt-12 grid grid-cols-2 gap-12">
                <div>
                    <h4 className="text-[10px] uppercase tracking-widest font-bold mb-4">Payment Information</h4>
                    <div className="text-[11px] text-[#666] space-y-1">
                        <p><span className="w-20 inline-block">UPI ID:</span> <span className="text-[#2C2C2C] font-medium">kalaprayag@upi</span></p>
                        <p><span className="w-20 inline-block">Bank:</span> <span className="text-[#2C2C2C] font-medium">HDFC Bank | A/C: 1234 5678 9012</span></p>
                        <p><span className="w-20 inline-block">IFSC:</span> <span className="text-[#2C2C2C] font-medium">HDFC0001234</span></p>
                    </div>
                </div>
                <div className="text-right flex flex-col justify-end italic text-[#999] text-xs leading-relaxed">
                    <p>Thank you for supporting the traditional arts of India.</p>
                    <p>Each piece is a prayer, each order a blessing.</p>
                </div>
            </div>

            {/* Terms */}
            <div className="mt-16 text-[9px] text-[#BBB] pt-8 border-t border-dashed border-[#F0F0F0] text-center">
                This is a computer-generated invoice and does not require a physical signature.
                All disputes are subject to Jaipur jurisdiction.
            </div>
        </div>
    );
};

export default InvoiceView;
