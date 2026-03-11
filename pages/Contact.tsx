
import React, { useState } from 'react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
    }, 1500);
  };

  return (
    <div className="pt-32 pb-24 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto px-6">
        <header className="mb-20 text-center">
          <h1 className="text-6xl serif mb-6">Connect With Us</h1>
          <p className="text-[#666] max-w-xl mx-auto font-light">Whether you're an interior designer looking for a collaboration or a collector seeking a specific piece, our doors are always open.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-24">
          <div className="lg:col-span-2">
            <div className="bg-white p-12 shadow-sm border border-[#F0F0F0]">
              <h3 className="text-2xl serif mb-10">Inquiry Form</h3>

              {isSuccess ? (
                <div className="flex flex-col items-center justify-center text-center py-20 animate-in zoom-in duration-500">
                  <div className="w-16 h-16 bg-[#8B735B]/10 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-[#8B735B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-3xl serif mb-4">Message Sent!</h2>
                  <p className="text-[#666] mb-8">Thank you for reaching out. We'll get back to you within 24–48 hours.</p>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="text-xs uppercase tracking-widest text-[#2C2C2C] border-b border-[#2C2C2C] pb-1 hover:text-[#8B735B] hover:border-[#8B735B] transition-all"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form className="space-y-8" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Name</label>
                      <input
                        type="text" required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none focus:border-[#2C2C2C] transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Email</label>
                      <input
                        type="email" required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none focus:border-[#2C2C2C] transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Subject</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none focus:border-[#2C2C2C] bg-white transition-colors"
                    >
                      <option>General Inquiry</option>
                      <option>Order Status</option>
                      <option>Wholesale/Collaboration</option>
                      <option>Press</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Message</label>
                    <textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-[#F9F9F9] border border-[#E5E5E5] p-4 text-sm focus:outline-none focus:border-[#2C2C2C] min-h-[200px] transition-colors"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#2C2C2C] text-white px-12 py-5 text-xs uppercase tracking-[0.4em] hover:bg-[#4A4A4A] transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="space-y-16">
            <div>
              <h4 className="text-xs uppercase tracking-widest font-semibold mb-6">Our Flagship Studio</h4>
              <p className="text-[#666] font-light leading-relaxed mb-4">
                108, Craft District, MG Road<br/>
                Bangalore, KA 560001<br/>
                India
              </p>
              <a
                href="https://maps.google.com/?q=MG+Road+Bangalore"
                target="_blank"
                rel="noreferrer"
                className="text-[#8B735B] text-xs uppercase tracking-widest underline hover:text-[#6D5A47] transition-colors"
              >
                View on Map
              </a>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-widest font-semibold mb-6">Contact Details</h4>
              <p className="text-[#666] font-light leading-relaxed mb-2">studio@kalaprayag.com</p>
              <p className="text-[#666] font-light leading-relaxed mb-6">+91 (0) 80 4455 6677</p>
              <a
                href="https://wa.me/918044556677"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-3 bg-[#25D366]/10 text-[#075E54] px-6 py-4 rounded-full w-fit hover:bg-[#25D366]/20 transition-all font-medium"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.181-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793 0-.852.449-1.271.608-1.445.159-.175.348-.218.463-.218.116 0 .232.001.334.005.109.004.254-.041.398.305.144.356.492 1.196.535 1.284.043.088.072.19.014.305-.058.115-.087.19-.174.29-.087.1-.183.222-.261.305-.087.088-.178.183-.077.356.101.174.449.741.964 1.201.662.591 1.22.774 1.394.86.174.088.275.073.377-.043.101-.116.435-.506.55-.68.115-.174.232-.145.391-.087.159.058 1.014.478 1.187.565.173.088.29.131.334.203.043.072.043.419-.101.824z"/></svg>
                <span>Chat via WhatsApp</span>
              </a>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-widest font-semibold mb-6">Gallery Hours</h4>
              <p className="text-[#666] font-light leading-relaxed">
                Mon - Sat: 11:00 am – 8:00 pm<br/>
                Sun: By Appointment Only
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
