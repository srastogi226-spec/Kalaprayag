import React, { useState } from 'react';
import InvoiceView from './InvoiceView';
import { InvoiceData } from '../types';
import { downloadInvoicePDF, emailInvoice } from '../utils/invoiceUtils';

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: InvoiceData | null;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, invoice }) => {
    const [isEmailing, setIsEmailing] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    if (!isOpen || !invoice) return null;

    const handleDownload = () => {
        downloadInvoicePDF('kp-invoice-modal-content');
    };

    const handleEmail = async () => {
        setIsEmailing(true);
        await emailInvoice(invoice);
        setIsEmailing(false);
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
    };

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 md:p-8 backdrop-blur-md bg-black/40 animate-in fade-in duration-300">
            <div className="bg-[#FAF9F6] w-full max-w-5xl h-[95vh] flex flex-col shadow-2xl relative overflow-hidden">

                {/* Action Bar */}
                <div className="bg-[#2C2C2C] text-white p-4 flex justify-between items-center z-10">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={onClose}
                            className="text-white/60 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="h-4 w-px bg-white/20"></div>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold">Document: {invoice.invoiceNumber}</p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleEmail}
                            disabled={isEmailing}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-all disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {isEmailing ? 'Sending...' : emailSent ? 'Email Sent ✓' : 'Email Invoice'}
                        </button>
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 bg-[#8B735B] hover:bg-[#A68F75] text-white px-6 py-2 text-[10px] uppercase tracking-widest font-bold transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download PDF / Print
                        </button>
                    </div>
                </div>

                {/* Invoice Container - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-[#D1D1D1]">
                    <div className="shadow-2xl overflow-hidden">
                        <InvoiceView invoice={invoice} id="kp-invoice-modal-content" />
                    </div>
                </div>

                {/* Global Print Styles to ensure only InvoiceView prints */}
                <style dangerouslySetInnerHTML={{
                    __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #kp-invoice-modal-content, #kp-invoice-modal-content * {
              visibility: visible;
            }
            #kp-invoice-modal-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
              box-shadow: none;
              border: none !important;
            }
          }
        `}} />
            </div>
        </div>
    );
};

export default InvoiceModal;
