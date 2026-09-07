import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Star,
  CheckCircle,
  Calendar,
  DollarSign,
  Heart,
  ShieldCheck,
  Clock,
  Filter,
  Users,
  MessageSquare,
  Sparkles,
  Phone,
  Mail,
  Send,
} from 'lucide-react';
import { DaycareProvider } from '../types';

interface MarketplaceProps {
  providers: DaycareProvider[];
  onSendMessage: (providerId: string, text: string) => void;
  onLogAudit: (action: string, resource: string, details: string) => void;
}

export const MarketplaceAndDirectoryModule: React.FC<MarketplaceProps> = ({
  providers,
  onSendMessage,
  onLogAudit,
}) => {
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('all');
  const [filterLicensedOnly, setFilterLicensedOnly] = useState(true);
  const [filterSubsidies, setFilterSubsidies] = useState(false);
  const [selectedProviderForTour, setSelectedProviderForTour] = useState<DaycareProvider | null>(null);
  const [tourDate, setTourDate] = useState('2026-09-12');
  const [tourTime, setTourTime] = useState('10:00 AM');
  const [tourSubmitted, setTourSubmitted] = useState(false);

  // Filter logic
  const filtered = providers.filter((p) => {
    if (filterLicensedOnly && !p.isLicensed) return false;
    if (filterSubsidies && !p.subsidiesAccepted) return false;
    if (searchLocation && !p.city.toLowerCase().includes(searchLocation.toLowerCase()) && !p.postalCode.toLowerCase().includes(searchLocation.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleRequestTour = (e: React.FormEvent) => {
    e.preventDefault();
    setTourSubmitted(true);
    if (selectedProviderForTour) {
      onLogAudit(
        'TOUR_REQUESTED',
        `providers/${selectedProviderForTour.id}`,
        `Tour requested for ${tourDate} at ${tourTime} at ${selectedProviderForTour.name}`
      );
    }
    setTimeout(() => {
      setTourSubmitted(false);
      setSelectedProviderForTour(null);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 font-display">
              FIND LICENSED HOME DAYCARE
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#52632B]/15 text-[#52632B] dark:text-[#A4C268] font-bold">
              CWELCC $10/Day Enrolled
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Discover verified home childcare providers, check real-time spot availability by age group, and schedule tours.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Location Search */}
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="City, postal code or neighbourhood..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
            />
          </div>

          {/* Age Group */}
          <select
            value={selectedAgeGroup}
            onChange={(e) => setSelectedAgeGroup(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
          >
            <option value="all">All Ages (Infant, Toddler, Preschool)</option>
            <option value="infant">Infant (0 - 18 months)</option>
            <option value="toddler">Toddler (18 - 30 months)</option>
            <option value="preschool">Preschool (30m - 5 years)</option>
          </select>

          {/* Licensed Filter */}
          <label className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612] cursor-pointer">
            <input
              type="checkbox"
              checked={filterLicensedOnly}
              onChange={(e) => setFilterLicensedOnly(e.target.checked)}
              className="rounded text-[#52632B]"
            />
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              Licensed Providers Only
            </span>
          </label>

          {/* Subsidies Filter */}
          <label className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612] cursor-pointer">
            <input
              type="checkbox"
              checked={filterSubsidies}
              onChange={(e) => setFilterSubsidies(e.target.checked)}
              className="rounded text-[#52632B]"
            />
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              Government Subsidies (CWELCC)
            </span>
          </label>
        </div>
      </div>

      {/* Provider Results List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((provider) => (
          <div
            key={provider.id}
            className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs flex flex-col justify-between"
          >
            <div>
              {/* Photo & Badge Banner */}
              <div className="relative aspect-16/9 bg-neutral-900">
                <img
                  src={provider.imageUrl}
                  alt={provider.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  {provider.isLicensed && (
                    <span className="px-2 py-0.5 rounded-full bg-[#52632B] text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Licensed ({provider.licenseNumber})
                    </span>
                  )}
                  {provider.subsidiesAccepted && (
                    <span className="px-2 py-0.5 rounded-full bg-[#D49A00] text-neutral-950 text-[10px] font-bold shadow-xs">
                      CWELCC $10/Day
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-white text-xs font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{provider.rating}</span>
                  <span className="text-neutral-300 font-normal">({provider.reviewsCount})</span>
                </div>
              </div>

              {/* Provider Info */}
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 font-display">
                      {provider.name}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#52632B]" />
                      <span>{provider.address}, {provider.city} • {provider.distanceMiles} mi away</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-[#52632B] dark:text-[#E5A910] font-display">
                      ${provider.dailyRate}/day
                    </div>
                    <div className="text-[10px] text-neutral-400">or ${provider.monthlyRate}/mo</div>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                  {provider.description}
                </p>

                {/* Available Spots Breakdown */}
                <div className="p-2.5 rounded-lg bg-[#FAF9F6] dark:bg-[#141612] border border-neutral-200/80 dark:border-neutral-800 text-xs">
                  <span className="font-bold text-neutral-400 uppercase tracking-wider text-[10px] block mb-1.5">
                    Available Spots By Age:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="p-1 rounded bg-white dark:bg-neutral-800 border">
                      <span className="text-neutral-500 block text-[10px]">Infants:</span>
                      <strong className="text-[#D49A00] font-bold">{provider.availableSpots.infant} spots</strong>
                    </div>
                    <div className="p-1 rounded bg-white dark:bg-neutral-800 border">
                      <span className="text-neutral-500 block text-[10px]">Toddlers:</span>
                      <strong className="text-[#52632B] font-bold">{provider.availableSpots.toddler} spots</strong>
                    </div>
                    <div className="p-1 rounded bg-white dark:bg-neutral-800 border">
                      <span className="text-neutral-500 block text-[10px]">Preschool:</span>
                      <strong className="text-neutral-800 dark:text-neutral-200 font-bold">{provider.availableSpots.preschool} spots</strong>
                    </div>
                  </div>
                </div>

                {/* Features Badges */}
                <div className="flex flex-wrap gap-1">
                  {provider.features.map((f, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium"
                    >
                      ✓ {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="p-5 pt-0 flex items-center gap-2">
              <button
                onClick={() => setSelectedProviderForTour(provider)}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-[#52632B] text-white hover:bg-[#3E4C1E] transition-colors shadow-xs text-center border border-[#E5A910]/40"
              >
                Request Tour
              </button>
              <button
                onClick={() => onSendMessage(provider.id, `Hello ${provider.leadProviderName}, I would like to inquire about enrolling my toddler.`)}
                className="py-2 px-3 rounded-lg text-xs font-semibold border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Message
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tour Request Modal */}
      {selectedProviderForTour && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200 dark:border-neutral-800 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-display">
                Schedule Daycare Tour & Meet-and-Greet
              </h3>
              <button
                onClick={() => setSelectedProviderForTour(null)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>

            {tourSubmitted ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-[#52632B] mx-auto" />
                <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  Tour Request Confirmed!
                </h4>
                <p className="text-xs text-neutral-500">
                  {selectedProviderForTour.name} will confirm your visit on {tourDate} at {tourTime}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestTour} className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#141612] border border-neutral-200 dark:border-neutral-800">
                  <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {selectedProviderForTour.name}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Lead: {selectedProviderForTour.leadProviderName} • {selectedProviderForTour.address}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Select Preferred Date:
                  </label>
                  <input
                    type="date"
                    value={tourDate}
                    onChange={(e) => setTourDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Select Preferred Time Slot:
                  </label>
                  <select
                    value={tourTime}
                    onChange={(e) => setTourTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                  >
                    <option value="09:30 AM">09:30 AM (During morning circle)</option>
                    <option value="10:30 AM">10:30 AM (Outdoor play time)</option>
                    <option value="03:30 PM">03:30 PM (Afternoon snack & pickup)</option>
                  </select>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProviderForTour(null)}
                    className="px-4 py-2 text-xs font-semibold text-neutral-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-[#52632B] text-white rounded-lg hover:bg-[#3E4C1E] border border-[#E5A910]/40"
                  >
                    Confirm Tour Booking
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
