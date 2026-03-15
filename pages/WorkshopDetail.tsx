
import React, { useState, useRef } from 'react';
import { Workshop, Artisan, ClassBooking } from '../types';
import PaymentModal from '../components/PaymentModal';
import { compressImage } from '../utils/imageUtils';

interface WorkshopDetailProps {
  workshop: Workshop;
  artisans: Artisan[];
  onBack: () => void;
  onViewArtisan: (id: string) => void;
  loggedInArtisan?: Artisan | null;
  onUpdateWorkshop?: (w: Workshop) => void;
  onBookingWorkshop?: (booking: any) => void;
  classBookings: ClassBooking[];
  onViewInvoice?: () => void;
}

const WorkshopDetail: React.FC<WorkshopDetailProps> = ({
  workshop, artisans, onBack, onViewArtisan, loggedInArtisan, onUpdateWorkshop, onBookingWorkshop, classBookings, onViewInvoice
}) => {
  const [showPayment, setShowPayment] = useState(false);
  const [bookingId, setBookingId] = useState('');

  // Find the artisan conducting this workshop
  const workshopArtisan = artisans.find(a => a.id === workshop.artisanId);

  // Image upload state
  const [localImage, setLocalImage] = useState(workshop.image || '');
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [imgSaved, setImgSaved] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Is this the artisan who owns the workshop?
  const isOwner = loggedInArtisan?.id === workshop.artisanId;
  const hasValidImage = localImage && localImage.trim() !== '';

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImg(true);
    try {
      const compressed = await compressImage(file, 900, 0.75);
      setLocalImage(compressed);
      // Save immediately to workshop
      if (onUpdateWorkshop) {
        onUpdateWorkshop({ ...workshop, image: compressed });
        setImgSaved(true);
        setTimeout(() => setImgSaved(false), 3000);
      }
    } catch (err) {
      console.error('Image upload failed', err);
    } finally {
      setIsUploadingImg(false);
    }
    e.target.value = '';
  };

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <button
        onClick={onBack}
        className="flex items-center text-xs uppercase tracking-widest text-[#999] hover:text-[#2C2C2C] mb-12"
      >
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Workshops
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

        {/* ── Left Column ── */}
        <div className="space-y-8">

          {/* Cover Image */}
          <div className="aspect-video overflow-hidden shadow-lg relative group bg-[#F5F5F5]">
            {hasValidImage ? (
              <>
                <img
                  src={localImage}
                  className="w-full h-full object-cover"
                  alt={workshop.title}
                  onError={() => setLocalImage('')}
                />
                {/* Owner: change image overlay */}
                {isOwner && onUpdateWorkshop && (
                  <>
                    <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => imgInputRef.current?.click()}
                        disabled={isUploadingImg}
                        className="bg-white text-[#2C2C2C] text-[10px] uppercase tracking-widest px-5 py-2.5 font-bold hover:bg-[#FAF9F6] transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {isUploadingImg ? 'Uploading...' : 'Change Cover'}
                      </button>
                    </div>
                    {imgSaved && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] uppercase tracking-widest px-4 py-1.5 animate-in fade-in duration-200">
                        ✓ Image Saved
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              /* No image — show upload zone */
              <div className="w-full h-full flex flex-col items-center justify-center">
                {isOwner && onUpdateWorkshop ? (
                  // Owner sees upload button
                  <>
                    <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <button
                      onClick={() => imgInputRef.current?.click()}
                      disabled={isUploadingImg}
                      className="flex flex-col items-center gap-3 group/btn"
                    >
                      <div className="w-16 h-16 rounded-full bg-[#8B735B]/10 flex items-center justify-center group-hover/btn:bg-[#8B735B]/20 transition-colors">
                        {isUploadingImg ? (
                          <svg className="animate-spin w-7 h-7 text-[#8B735B]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-7 h-7 text-[#8B735B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-[#2C2C2C] group-hover/btn:text-[#8B735B] transition-colors">
                          {isUploadingImg ? 'Uploading...' : 'Upload Cover Image'}
                        </p>
                        <p className="text-[10px] text-[#999] uppercase tracking-widest mt-0.5">JPG or PNG · Max 5MB</p>
                      </div>
                    </button>
                    <p className="text-[10px] text-[#CCC] uppercase tracking-widest mt-4">
                      Only visible to you until saved
                    </p>
                  </>
                ) : (
                  // Visitor sees placeholder
                  <div className="flex flex-col items-center gap-3 opacity-40">
                    <svg className="w-12 h-12 text-[#999]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-[#999] uppercase tracking-widest">No image available</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Curriculum */}
          <section>
            <h3 className="text-xs uppercase tracking-widest font-semibold text-[#8B735B] mb-4">The Curriculum</h3>
            <div className="bg-white border border-[#F0F0F0] p-8 text-sm leading-relaxed font-light text-[#4A4A4A] min-h-[80px]">
              {workshop.curriculum
                ? <span className="whitespace-pre-wrap">{workshop.curriculum}</span>
                : <span className="text-[#CCC] italic">No curriculum added yet.</span>
              }
            </div>
          </section>

          {/* Prerequisites */}
          <section>
            <h3 className="text-xs uppercase tracking-widest font-semibold text-[#8B735B] mb-4">Prerequisites</h3>
            {workshop.requirements
              ? <p className="text-sm text-[#666] leading-relaxed">{workshop.requirements}</p>
              : <p className="text-sm text-[#CCC] italic">No prerequisites listed.</p>
            }
          </section>
        </div>

        {/* ── Right Column ── */}
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#8B735B] mb-2 block">{workshop.mode} Masterclass</span>
          <h1 className="text-5xl serif mb-6">{workshop.title}</h1>
          <p className="text-xs text-[#999] uppercase tracking-widest mb-4">
            Led by <span className="text-[#2C2C2C] font-semibold">{workshop.artisanName}</span>
          </p>

          <div className="flex items-center gap-2 mb-8 bg-amber-50 w-fit px-4 py-1.5 rounded-full border border-amber-100 shadow-sm animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-amber-900">
              {workshop.maxStudents - classBookings.filter(b => b.workshopId === workshop.id).length} Seats Left
            </span>
          </div>

          {/* ── Artist Profile Card — links to Makers section ── */}
          {workshopArtisan && (
            <button
              onClick={() => onViewArtisan(workshopArtisan.id)}
              className="group w-full flex items-center gap-4 bg-white border border-[#F0F0F0] rounded-xl p-4 mb-10 hover:border-[#8B735B]/40 hover:shadow-md transition-all duration-300 text-left"
            >
              {/* Artisan Avatar */}
              <div className="flex-shrink-0 w-14 h-14 rounded-full overflow-hidden bg-[#F5F0EB]">
                {workshopArtisan.profilePhoto ? (
                  <img src={workshopArtisan.profilePhoto} alt={workshopArtisan.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#8B735B] text-lg font-semibold">
                    {workshopArtisan.name.charAt(0)}
                  </div>
                )}
              </div>
              {/* Artisan Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#8B735B] transition-colors">
                    {workshopArtisan.brandName || workshopArtisan.name}
                  </p>
                  <span className="text-[8px] uppercase tracking-[0.15em] bg-[#8B735B]/10 text-[#8B735B] px-2 py-0.5 rounded font-bold">Maker</span>
                </div>
                <p className="text-[11px] text-[#999] truncate">
                  {workshopArtisan.craftType}{workshopArtisan.location ? ` · ${workshopArtisan.location}` : ''}
                </p>
              </div>
              {/* View Profile link */}
              <div className="flex-shrink-0 flex items-center gap-1.5 text-[#8B735B] opacity-60 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] uppercase tracking-widest font-semibold hidden sm:inline">View Profile</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )}
          <p className="text-lg font-light text-[#4A4A4A] leading-loose mb-10">
            {workshop.description || <span className="text-[#CCC] italic">No description provided.</span>}
          </p>

          <div className="grid grid-cols-2 gap-8 py-8 border-y border-[#F0F0F0] mb-10">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#999] mb-1">Date & Time</p>
              <p className="text-sm font-medium">{new Date(workshop.date).toDateString()} at {workshop.time}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#999] mb-1">Duration</p>
              <p className="text-sm font-medium">{workshop.duration}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#999] mb-1">Availability</p>
              <p className="text-sm font-medium">{workshop.maxStudents - classBookings.filter(b => b.workshopId === workshop.id).length} Seats Left</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#999] mb-1">Materials</p>
              <p className="text-sm font-medium">{workshop.materialsProvided ? 'All Provided' : 'Self-sourced'}</p>
            </div>
            {workshop.mode === 'offline' && workshop.location && (
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-widest text-[#999] mb-1">Location</p>
                <p className="text-sm font-medium">{workshop.location}</p>
              </div>
            )}
          </div>

          <div className="bg-[#FAF9F6] p-8 space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-sm uppercase tracking-widest text-[#999]">Enrollment Fee</span>
              <span className="text-3xl serif">₹ {workshop.price.toLocaleString()}</span>
            </div>

            {bookingId ? (
              <div className="bg-green-50 border border-green-100 p-5 text-center space-y-1.5">
                <p className="text-green-700 font-semibold">🎉 Seat Reserved!</p>
                <p className="text-[10px] uppercase tracking-[0.3em] text-green-600">Booking ID: {bookingId}</p>
                <p className="text-xs text-green-600">Confirmation sent to your email.</p>
              </div>
            ) : (
              <button
                onClick={() => setShowPayment(true)}
                className="w-full bg-[#2C2C2C] text-white py-5 text-xs uppercase tracking-[0.4em] font-medium hover:bg-[#4A4A4A] transition-all"
              >
                Reserve My Seat
              </button>
            )}

            <p className="text-[10px] text-center text-[#999] uppercase tracking-widest">
              Limited seats available for personalized feedback.
            </p>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={(id, details) => {
          setBookingId(id);
          setShowPayment(false);
          if (onBookingWorkshop) {
            onBookingWorkshop({
              id,
              workshopId: workshop.id,
              workshopTitle: workshop.title,
              artisanId: workshop.artisanId,
              artisanName: workshop.artisanName,
              customerName: details.customerName,
              customerEmail: details.customerEmail,
              customerPhone: details.customerPhone,
              paymentStatus: 'completed',
              amount: workshop.price,
              method: details.method,
              createdAt: new Date().toISOString(),
              status: 'confirmed',
              reminderSent: false,
              attendanceMarked: false,
              reviewRequested: false
            });
          }
        }}
        title={workshop.title}
        subtitle={`${workshop.mode} Masterclass · Led by ${workshop.artisanName}`}
        amount={workshop.price}
        includeGst={true}
        ctaLabel="Reserve My Seat"
        onViewInvoice={onViewInvoice}
      />
    </div>
  );
};

export default WorkshopDetail;
