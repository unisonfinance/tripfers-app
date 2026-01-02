
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Icons } from '../components/Icons';
import { AutocompleteInput } from '../components/AutocompleteInput';
import { AuthModal } from '../components/AuthModal';
import { backend } from '../services/BackendService';
import { useTranslation } from 'react-i18next';

interface LandingProps {
  onLogin: (user: User) => void;
}

const CAR_CATEGORIES = [
  { id: 'Economy', name: 'Economy', pax: 3, bag: 3, icon: Icons.CarEconomy },
  { id: 'Comfort', name: 'Comfort', pax: 3, bag: 3, icon: Icons.CarComfort },
  { id: 'Business', name: 'Business', pax: 3, bag: 3, icon: Icons.CarBusiness },
  { id: 'Premium', name: 'Premium', pax: 3, bag: 3, icon: Icons.CarPremium },
  { id: 'VIP', name: 'VIP', pax: 3, bag: 3, icon: Icons.CarVIP },
  { id: 'SUV', name: 'SUV', pax: 4, bag: 4, icon: Icons.CarSUV },
  { id: 'Van', name: 'Van', pax: 8, bag: 6, icon: Icons.CarVan },
  { id: 'Minibus', name: 'Minibus', pax: 16, bag: 16, icon: Icons.CarMinibus },
  { id: 'Bus', name: 'Bus', pax: 50, bag: 50, icon: Icons.CarBus },
];

export const Landing: React.FC<LandingProps> = ({ onLogin }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<UserRole>(UserRole.CLIENT);
  const { t } = useTranslation();
  
  const [bookingType, setBookingType] = useState<'ride' | 'hourly'>('ride');
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  
  // Coordinate State for Robust Routing
  const [fromCoords, setFromCoords] = useState<{lat: number, lng: number} | null>(null);
  const [toCoords, setToCoords] = useState<{lat: number, lng: number} | null>(null);

  const [selectedCar, setSelectedCar] = useState('Economy');
  
  // Pricing State
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [pricingConfig, setPricingConfig] = useState<any>(null);

  useEffect(() => {
      backend.getPricingConfig().then(setPricingConfig);
  }, []);

  // --- DISTANCE CALCULATION EFFECT ---
  useEffect(() => {
    // Debounce the calculation
    const timer = setTimeout(() => {
        // Use coordinates if available, otherwise fallback to address string
        const origin = fromCoords || fromAddress;
        const destination = toCoords || toAddress;
        
        // Basic validation to prevent sending empty/short strings to API
        const isValidOrigin = fromCoords || fromAddress.length > 3;
        const isValidDest = toCoords || toAddress.length > 3;

        if (isValidOrigin && isValidDest && window.google && window.google.maps) {
            const directionsService = new window.google.maps.DirectionsService();
            directionsService.route({
                origin,
                destination,
                travelMode: window.google.maps.TravelMode.DRIVING
            }, (result: any, status: any) => {
                if (status === 'OK' && result) {
                    let totalDistance = 0;
                    if(result.routes[0]?.legs) {
                        result.routes[0].legs.forEach((leg: any) => {
                            totalDistance += leg.distance.value;
                        });
                    }
                    if (totalDistance > 0) {
                        setCalculatedDistance(parseFloat((totalDistance / 1000).toFixed(1)));
                    }
                } else {
                    // Silently handle NOT_FOUND or ZERO_RESULTS to avoid console noise
                    setCalculatedDistance(null);
                }
            });
        } else {
             setCalculatedDistance(null);
        }
    }, 1000);
    return () => clearTimeout(timer);
  }, [fromAddress, toAddress, fromCoords, toCoords]);


  const initiateLogin = (role: UserRole | null) => {
    setAuthInitialRole(role || UserRole.CLIENT);
    setShowAuthModal(true);
  };

  const handleGetOffers = () => {
    if (!fromAddress || !toAddress) {
        alert(t('enter_locations'));
        return;
    }
    // Store pending booking with coords
    const pendingBooking = {
        pickup: fromAddress,
        pickupCoords: fromCoords,
        dropoff: toAddress,
        dropoffCoords: toCoords,
        vehicleType: selectedCar,
        date: new Date().toISOString().split('T')[0],
        time: '12:00'
    };
    sessionStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));
    
    // Trigger login
    initiateLogin(UserRole.CLIENT);
  };

  const getPrice = (dist: number, type: string) => {
      if (!pricingConfig) return 0;
      return backend.calculatePrice(dist, type);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center py-4 px-4 md:px-8">
        <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Tripfers
        </div>
        <div className="flex items-center gap-4">
             <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600 dark:text-slate-300">
               <a href="#" className="hover:text-red-600 transition-colors">{t('support')}</a>
               <a href="#" className="hover:text-red-600 transition-colors">{t('destinations')}</a>
               <a href="#" className="hover:text-red-600 transition-colors">{t('for_drivers')}</a>
            </nav>
            <button 
              onClick={() => initiateLogin(null)} 
              className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
            >
              {t('login_or_signup')}
            </button>
        </div>
      </header>
      
      <main className="text-center px-4">
        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight mb-8">
          {t('landing_headline')}
        </h1>
        
        <div className="mx-auto w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
          
          {/* STEP 1: Booking Form */}
          <div className="p-6 md:p-8 space-y-4 bg-slate-50 dark:bg-slate-800/50">
             <div className="flex bg-slate-200 dark:bg-slate-900 rounded-lg p-1 mb-6 text-sm font-semibold max-w-sm mx-auto">
                <button 
                  onClick={() => setBookingType('ride')}
                  className={`flex-1 p-2 rounded-md flex items-center justify-center gap-2 transition-colors ${bookingType === 'ride' ? 'bg-white dark:bg-slate-700 text-red-600 shadow' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                  <Icons.Route className="w-5 h-5" /> {t('distance_label')}
                </button>
                <button 
                  onClick={() => setBookingType('hourly')}
                  className={`flex-1 p-2 rounded-md flex items-center justify-center gap-2 transition-colors ${bookingType === 'hourly' ? 'bg-white dark:bg-slate-700 text-red-600 shadow' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                  <Icons.Clock className="w-5 h-5" /> {t('per_hour_label')}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                 <AutocompleteInput
                    value={fromAddress}
                    onChange={(v) => { setFromAddress(v); setFromCoords(null); }} 
                    onPlaceSelected={setFromAddress}
                    onLocationSelect={setFromCoords}
                    placeholder={t('from_placeholder')}
                  />
                  <AutocompleteInput
                    value={toAddress}
                    onChange={(v) => { setToAddress(v); setToCoords(null); }}
                    onPlaceSelected={setToAddress}
                    onLocationSelect={setToCoords}
                    placeholder={t('to_placeholder')}
                  />
              </div>
          </div>

          {/* STEP 2: Car Categories - UPDATED PREMIUM UI WITH DYNAMIC PRICING */}
          <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 md:p-8">
              <h3 className="text-left text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">{t('transport_types')}</h3>
              
              {/* Responsive Grid: 2 col mobile, 3 lg - Compact & Clean */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-2">
                  {CAR_CATEGORIES.map((car, index) => {
                      const CarIcon = car.icon;
                      const isSelected = selectedCar === car.id;
                      const isOtherSelected = selectedCar && !isSelected;
                      
                      // Price Calculation
                      const price = calculatedDistance ? getPrice(calculatedDistance, car.id) : null;

                      return (
                          <button
                            key={car.id}
                            onClick={() => setSelectedCar(car.id)}
                            className={`
                                relative w-full rounded-xl border transition-all duration-300 ease-out cursor-pointer overflow-hidden group text-left
                                animate-slide-up-fade flex flex-col
                                ${isSelected 
                                    ? 'border-red-600 bg-white dark:bg-slate-800 shadow-[0_0_15px_rgba(220,38,38,0.15)] ring-1 ring-red-600 z-10' 
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-red-300 hover:shadow-md hover:-translate-y-0.5'
                                }
                                ${isOtherSelected ? 'opacity-70 hover:opacity-100' : 'opacity-100'}
                                active:scale-[0.98]
                            `}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                             {/* Selected Badge */}
                             {isSelected && (
                                <div className="absolute top-0 right-0 bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded-bl-xl z-20 shadow-sm">
                                    <Icons.Check className="w-3.5 h-3.5" />
                                </div>
                             )}

                             {/* Header Row: Title & Price */}
                             <div className="p-2 md:p-4 pb-1 md:pb-2 flex justify-between items-start w-full">
                                  <h4 className={`text-xs md:text-sm font-extrabold uppercase tracking-tight ${isSelected ? 'text-red-600' : 'text-slate-800 dark:text-slate-200'} truncate mr-1`}>
                                      {t(`vehicle_${car.id.toLowerCase()}`)}
                                  </h4>
                                  <div className="text-right leading-none shrink-0">
                                      {price ? (
                                        <>
                                            <span className="block text-[8px] md:text-[10px] text-slate-400 font-semibold mb-0.5">{t('from')}</span>
                                            <span className={`block text-sm md:text-lg font-bold tabular-nums tracking-tight ${isSelected ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                                                US${price}
                                            </span>
                                        </>
                                      ) : (
                                        <span className="block text-xs font-bold text-slate-400 mt-2">US$ --</span>
                                      )}
                                  </div>
                             </div>

                             {/* Icon - Centered */}
                             <div className="flex-1 flex items-center justify-center py-1 md:py-2">
                                  <CarIcon className={`h-8 md:h-10 w-auto object-contain transition-transform duration-300 ${isSelected ? 'text-red-600 scale-105' : 'text-slate-700 dark:text-slate-300 group-hover:scale-105 group-hover:text-slate-900 dark:group-hover:text-white'}`} />
                             </div>

                             {/* Specs Bar - Bottom */}
                             <div className="mt-1 md:mt-2 w-full px-2 pb-2 md:px-4 md:pb-4">
                                <div className={`
                                    flex items-center justify-center gap-2 md:gap-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-colors
                                    ${isSelected ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-700'}
                                `}>
                                    <span className="flex items-center gap-1.5">
                                        <Icons.User className="w-3 h-3 md:w-3.5 md:h-3.5"/> {car.pax}
                                    </span>
                                    <span className="w-px h-3 bg-current opacity-20"></span>
                                    <span className="flex items-center gap-1.5">
                                        <Icons.ListFilter className="w-3 h-3 md:w-3.5 md:h-3.5"/> {car.bag}
                                    </span>
                                </div>
                             </div>
                          </button>
                      );
                  })}
              </div>
          </div>

          {/* STEP 3: Get Offers Button */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
             <button 
                onClick={handleGetOffers} 
                className="w-full md:w-2/3 bg-black hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 text-lg uppercase tracking-wide"
             >
                {t('get_offers')}
             </button>
             <p className="mt-3 text-xs text-slate-400">
                {t('step_hint')}
             </p>
          </div>

        </div>
      </main>

      {/* For Drivers Section */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 items-center gap-12 bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{t('drivers_cta_title')}</h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                {t('drivers_cta_desc')}
              </p>
              <button 
                onClick={() => initiateLogin(UserRole.DRIVER)} 
                className="mt-8 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-colors"
              >
                {t('start_earning')}
              </button>
            </div>
            <div className="flex justify-center">
               <div className="w-64 h-64 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-300">
                   <Icons.Car className="w-32 h-32" />
               </div>
            </div>
        </div>
      </section>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onLogin={onLogin}
        initialRole={authInitialRole}
      />
    </div>
  );
};
