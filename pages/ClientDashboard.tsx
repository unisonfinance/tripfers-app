
import React, { useState, useEffect, useRef } from 'react';
import { User, Job, JobStatus, UserRole, BookingType } from '../types';
import { backend } from '../services/BackendService';
import { Icons } from '../components/Icons';
import { AutocompleteInput } from '../components/AutocompleteInput';
import { useTranslation } from 'react-i18next';
import { AuthModal } from '../components/AuthModal';
import { MembershipModal } from '../components/MembershipModal';
import { ClientFooter } from '../components/ClientFooter';
import { SupportView } from './client/SupportView';
import { SettingsView } from './client/SettingsView';
import { ChatWindow } from '../components/ChatWindow';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface Coords {
  lat: number;
  lng: number;
}

interface Stop {
  address: string;
  lat?: number;
  lng?: number;
}

interface ClientDashboardProps {
  user: User | null;
  onLogin: (user: User) => void;
  initialRole?: UserRole;
}

const HOURS_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 12, 24];

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

// Helper Components
const Counter: React.FC<{ value: number, onChange: (val: number) => void, min?: number, max?: number }> = ({ value, onChange, min = 0, max = 100 }) => (
    <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            <Icons.Minus className="w-4 h-4" />
        </button>
        <span className="w-6 text-center font-bold text-slate-900 dark:text-white">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            <Icons.Plus className="w-4 h-4" />
        </button>
    </div>
);

const CustomCheckbox: React.FC<{ checked: boolean, onChange: (e: any) => void, label: React.ReactNode }> = ({ checked, onChange, label }) => (
    <label className="flex items-center gap-3 cursor-pointer group">
        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-red-600 border-red-600 dark:bg-red-600 dark:border-red-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
            {checked && <Icons.Check className="w-3.5 h-3.5 text-white" />}
        </div>
        <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
        <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors select-none">{label}</span>
    </label>
);

const ChildrenModal = ({ isOpen, onClose, childrenData, onChange }: any) => {
    const { t } = useTranslation();
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl p-6 space-y-6 animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg dark:text-white">{t('children_seats')}</h3>
                    <button onClick={onClose}><Icons.X className="w-6 h-6 text-slate-400" /></button>
                </div>
                {['infant', 'convertible', 'booster'].map((type: string) => (
                    <div key={type} className="flex justify-between items-center">
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white capitalize">{t(type + '_seat')}</p>
                            <p className="text-xs text-slate-500">
                               {type === 'infant' ? '0-9 kg' : type === 'convertible' ? '9-18 kg' : '15-36 kg'}
                            </p>
                        </div>
                        <Counter value={childrenData[type]} onChange={v => onChange(type, v)} />
                    </div>
                ))}
                <button onClick={onClose} className="w-full bg-black text-white py-3 rounded-xl font-bold">{t('done')}</button>
            </div>
        </div>
    );
};

const WaitingDetailsModal = ({ isOpen, onClose }: any) => {
    const { t } = useTranslation();
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl p-6 animate-slide-up relative">
                 <button onClick={onClose} className="absolute top-4 right-4"><Icons.X className="w-5 h-5 text-slate-400" /></button>
                 <h3 className="font-bold text-lg mb-4 dark:text-white">{t('free_waiting_time')}</h3>
                 <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                     <li className="flex gap-3"><Icons.Plane className="w-5 h-5 text-slate-400"/> <span>{t('waiting_airport')}</span></li>
                     <li className="flex gap-3"><Icons.Home className="w-5 h-5 text-slate-400"/> <span>{t('waiting_residential')}</span></li>
                 </ul>
            </div>
        </div>
    );
}

// Payment Simulation Modal
const PaymentModal = ({ isOpen, onClose, amount, driverName, onPay }: any) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    
    if (!isOpen) return null;

    const handlePay = () => {
        setLoading(true);
        // Simulate Stripe processing
        setTimeout(() => {
            setLoading(false);
            onPay();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up relative border border-slate-200 dark:border-slate-700">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white z-10"><Icons.X className="w-5 h-5"/></button>
                
                <div className="bg-[#635bff] p-6 text-white text-center">
                    <h3 className="font-bold text-xl mb-1">{t('secure_payment_title')}</h3>
                    <p className="text-white/80 text-sm">{t('powered_by_stripe')}</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <p className="text-slate-500 text-sm uppercase font-bold tracking-wide">{t('total_amount')}</p>
                        <p className="text-4xl font-black text-slate-900 dark:text-white my-2">${amount}</p>
                        <p className="text-xs text-slate-400">{t('driver')}: {driverName}</p>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">{t('card_number')}</label>
                            <div className="relative">
                                <Icons.Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="text" placeholder="4242 4242 4242 4242" className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg dark:border-slate-700 font-mono text-sm" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">{t('expiry')}</label>
                                <input type="text" placeholder="MM / YY" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg dark:border-slate-700 font-mono text-sm text-center" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">{t('cvc')}</label>
                                <input type="text" placeholder="123" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg dark:border-slate-700 font-mono text-sm text-center" />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handlePay} 
                        disabled={loading}
                        className="w-full bg-black hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? t('processing') : `${t('pay')} $${amount}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const { t } = useTranslation();
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
            status === JobStatus.CANCELLED ? 'bg-red-100 text-red-800' : 
            status === JobStatus.ACCEPTED ? 'bg-green-100 text-green-800' :
            status === JobStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800 animate-pulse' :
            'bg-amber-100 text-amber-800'
        }`}>
            {t('status_' + status.toLowerCase())}
        </span>
    );
};


export const ClientDashboard: React.FC<ClientDashboardProps> = ({ user, onLogin, initialRole }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'REQUEST' | 'RIDES' | 'CHATS' | 'SETTINGS'>('REQUEST');
  const [step, setStep] = useState(1);
  const [mapHeight, setMapHeight] = useState('h-[35vh]'); // Mobile map height

  // --- NAVIGATION STATE ---
  const [currentView, setCurrentView] = useState<'book' | 'rides' | 'support' | 'settings'>('book');
  
  // --- DATA STATE ---
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [driverDetails, setDriverDetails] = useState<Record<string, User>>({});
  
  // --- BOOKING FORM STATE ---
  const [bookingType, setBookingType] = useState<BookingType>('DISTANCE');
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
      pickup: '',
      dropoff: '',
      stops: [] as Stop[],
      date: new Date().toISOString().split('T')[0],
      time: '12:00',
      passengers: 1,
      adults: 1,
      children: { infant: 0, convertible: 0, booster: 0 },
      luggage: 0,
      carryOn: 0,
      vehicleType: 'Economy',
      comment: '',
      flightNumber: '',
      nameSign: '',
      returnWay: false,
      returnDate: '',
      returnTime: '',
      durationHours: 3, // For hourly
      hasPromo: false,
      promoCode: '',
      termsAccepted: false, // Default to false
      
      // Coords
      pickupCoords: null as Coords | null,
      dropoffCoords: null as Coords | null,
  });
  
  // Reset Form helper
  const initialState = {
      pickup: '',
      dropoff: '',
      stops: [] as Stop[],
      date: new Date().toISOString().split('T')[0],
      time: '12:00',
      passengers: 1,
      adults: 1,
      children: { infant: 0, convertible: 0, booster: 0 },
      luggage: 0,
      carryOn: 0,
      vehicleType: 'Economy',
      comment: '',
      flightNumber: '',
      nameSign: '',
      returnWay: false,
      returnDate: '',
      returnTime: '',
      durationHours: 3,
      hasPromo: false,
      promoCode: '',
      termsAccepted: false,
      pickupCoords: null as {lat: number, lng: number} | null,
      dropoffCoords: null as {lat: number, lng: number} | null,
  };

  // --- UI STATE ---
  const [showChildrenModal, setShowChildrenModal] = useState(false);
  const [showWaitingModal, setShowWaitingModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pickupSelected, setPickupSelected] = useState(false);
  const [dropoffSelected, setDropoffSelected] = useState(false);
  
  // Auto-open Auth Modal if initialRole is provided (e.g. Admin Login)
  useEffect(() => {
      if (initialRole && !user) {
          setShowAuthModal(true);
      }
  }, [initialRole, user]);
  
  // --- RIDES VIEW STATE ---
  const [ridesFilter, setRidesFilter] = useState<'REQUESTED' | 'UPCOMING' | 'COMPLETE'>('REQUESTED');
  const [pendingBooking, setPendingBooking] = useState<any>(null);
  const [isRestoredDraft, setIsRestoredDraft] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  
  // Cancel Modal State
  const [jobToCancel, setJobToCancel] = useState<Job | null>(null);
  
  // Payment State
  const [paymentModalData, setPaymentModalData] = useState<{jobId: string, bidId: string, amount: number, driverName: string} | null>(null);

  // --- MAP & PRICING ---
  const mapRef = useRef<HTMLDivElement>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [calculatedDuration, setCalculatedDuration] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [pricingConfig, setPricingConfig] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
            () => console.log("Geolocation permission denied")
        );
    }
    backend.getPricingConfig().then(setPricingConfig);
  }, []);

  // Google Maps API Loader Check
  useEffect(() => {
    if (window.google?.maps) {
        setIsGoogleLoaded(true);
    } else {
        const interval = setInterval(() => {
            if (window.google?.maps) {
                setIsGoogleLoaded(true);
                clearInterval(interval);
            }
        }, 500);
        return () => clearInterval(interval);
    }
  }, []);

  // Auto-Reverse Geocode User Location
  useEffect(() => {
      // Only run if we have location, google api, and NO existing pickup address
      if (userLocation && isGoogleLoaded) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: userLocation }, (results: any, status: any) => {
              if (status === 'OK' && results && results[0]) {
                  setFormData(prev => {
                      if (prev.pickup) return prev; // Avoid overwriting if user started typing
                      return {
                          ...prev,
                          pickup: results[0].formatted_address,
                          pickupCoords: userLocation
                      };
                  });
              } else {
                 console.log("Geocoding failed or no results found");
              }
          });
      }
  }, [userLocation, isGoogleLoaded]);

  useEffect(() => {
    const saved = sessionStorage.getItem('pendingBooking');
    if (saved) {
        try {
            setPendingBooking(JSON.parse(saved));
        } catch(e) {}
    }
  }, []);

  useEffect(() => {
    if (pendingBooking && !isRestoredDraft) {
        // If we have a pending booking from landing page, populate form if user wants to edit
        // But mainly we show it in 'Rides' view as a draft card. 
        // If user clicks "Edit" on draft card, we load it here.
    }
  }, [pendingBooking]);

  useEffect(() => {
    // Consolidated data fetching
    const refreshData = async () => {
        if (user) {
            const data = await backend.getJobs(user.role, user.id);
            setJobs(data);
        }
        // Always refresh pricing to ensure dynamic updates from Admin Panel
        const config = await backend.getPricingConfig();
        setPricingConfig(config);
    };

    // Initial Load
    refreshData();
    
    // REAL-TIME SUBSCRIPTION
    const unsubscribe = backend.subscribe(refreshData);
    
    // Polling backup
    const interval = setInterval(refreshData, 5000);
    
    return () => {
        unsubscribe();
        clearInterval(interval);
    };
  }, [user]);

  // Removed duplicate loadJobs definition to avoid confusion
  const loadJobs = async () => {
      if (user) {
          const data = await backend.getJobs(user.role, user.id);
          setJobs(data);
      }
  };
  
  // Fetch detailed driver info when a job has bids
  useEffect(() => {
      const jobsWithBids = jobs.filter(j => j.bids && j.bids.length > 0);
      if (jobsWithBids.length > 0) {
          jobsWithBids.forEach(job => {
               job.bids.forEach(async bid => {
                  if (!driverDetails[bid.driverId]) {
                      const profile = await backend.getDriverPublicProfile(bid.driverId);
                      if (profile) {
                          setDriverDetails(prev => ({...prev, [bid.driverId]: profile}));
                      }
                  }
              });
          });
      }
  }, [jobs]);

  // --- MAP LOGIC ---
  useEffect(() => {
    // Only initialize map if we have a valid DOM ref and currentView is 'book'
    if (currentView === 'book' && window.google && mapRef.current) {
        const map = new window.google.maps.Map(mapRef.current, {
            center: userLocation || { lat: -33.8688, lng: 151.2093 }, // Default Sydney
            zoom: 13,
            disableDefaultUI: true,
        });
        
        // Use coordinates if available for route calculation to avoid "NOT_FOUND" errors
        const origin = formData.pickupCoords || formData.pickup;
        const destination = bookingType === 'HOURLY' ? origin : (formData.dropoffCoords || formData.dropoff);
        
        // Validate inputs before routing
        const hasValidPickup = formData.pickupCoords || (formData.pickup && formData.pickup.length > 2);
        const hasValidDropoff = bookingType === 'HOURLY' || (formData.dropoffCoords || (formData.dropoff && formData.dropoff.length > 2));

        if (hasValidPickup && hasValidDropoff) {
            const directionsService = new window.google.maps.DirectionsService();
            const directionsRenderer = new window.google.maps.DirectionsRenderer({ map, suppressMarkers: false });
            
            const waypoints = formData.stops
                .filter(s => s.address)
                .map(s => ({ 
                    location: (s.lat && s.lng) ? { lat: s.lat, lng: s.lng } : s.address, 
                    stopover: true 
                }));
            
            const request: any = {
                origin,
                destination,
                waypoints: bookingType === 'HOURLY' ? [] : waypoints,
                travelMode: window.google.maps.TravelMode.DRIVING,
            };

            directionsService.route(request, (result: any, status: any) => {
                if (status === 'OK' && result) {
                    directionsRenderer.setDirections(result);
                    setRouteError(null);
                    
                    let dist = 0;
                    let dur = 0;
                    result.routes[0].legs.forEach((leg: any) => {
                        dist += leg.distance.value;
                        dur += leg.duration.value;
                    });
                    
                    setCalculatedDistance(parseFloat((dist / 1000).toFixed(1)));
                    
                    const hours = Math.floor(dur / 3600);
                    const mins = Math.floor((dur % 3600) / 60);
                    setCalculatedDuration(`${hours}h ${mins}m`);
                } else {
                    console.debug("Route calculation failed:", status);
                    setRouteError(null); // Clear error if recalculation is just invalid
                    setCalculatedDistance(null);
                }
            });
        }
    }
  }, [currentView, formData.pickup, formData.dropoff, formData.stops, bookingType, userLocation, formData.pickupCoords, formData.dropoffCoords]);

  const addStop = () => {
      setFormData(prev => ({...prev, stops: [...prev.stops, { address: '' }]}));
  };

  const updateStopAddress = (index: number, val: string) => {
      const newStops = [...formData.stops];
      // If manually typing, clear coords to avoid mismatch
      newStops[index] = { ...newStops[index], address: val, lat: undefined, lng: undefined };
      setFormData(prev => ({...prev, stops: newStops}));
  };

  const updateStopLocation = (index: number, loc: {lat: number, lng: number}) => {
      const newStops = [...formData.stops];
      newStops[index] = { ...newStops[index], lat: loc.lat, lng: loc.lng };
      setFormData(prev => ({...prev, stops: newStops}));
  };
  
  const removeStop = (index: number) => {
      const newStops = [...formData.stops];
      newStops.splice(index, 1);
      setFormData(prev => ({...prev, stops: newStops}));
  };

  const getPrice = (dist: number, type: string) => {
      if (!pricingConfig) return 0;
      return backend.calculatePrice(dist, type);
  };
  
  const handleEditJob = (job: Job) => {
      setFormData({
          pickup: job.pickup,
          dropoff: job.dropoff || '',
          stops: job.stops ? job.stops.map(s => ({ address: s })) : [],
          date: job.date.split('T')[0],
          time: job.date.split('T')[1]?.substring(0, 5) || '12:00',
          passengers: job.passengers,
          adults: job.passengers - (job.children ? Object.values(job.children).reduce((a,b)=>a+b,0) : 0),
          children: job.children || { infant: 0, convertible: 0, booster: 0 },
          luggage: job.luggage,
          carryOn: job.carryOn || 0,
          vehicleType: job.vehicleType || 'Economy',
          comment: job.comment || '',
          flightNumber: job.flightNumber || '',
          nameSign: job.nameSign || '',
          returnWay: job.isReturnTrip || false,
          returnDate: job.returnDate || '',
          returnTime: job.returnTime || '',
          durationHours: job.durationHours || 3,
          hasPromo: !!job.promoCode,
          promoCode: job.promoCode || '',
          termsAccepted: true,
          pickupCoords: job.pickupCoordinates || null,
          dropoffCoords: job.dropoffCoordinates || null,
      });
      setBookingType(job.bookingType || 'DISTANCE');
      setEditingJobId(job.id);
      setCurrentView('book');
  };

  const handleCreate = async () => {
    if (!formData.pickup) return alert("Pickup location required");
    if (bookingType === 'DISTANCE' && !formData.dropoff) return alert("Dropoff location required");
    if (!formData.termsAccepted) return alert("Please accept terms");

    const totalChildren = Object.values(formData.children).reduce((a: number, b: number) => a + b, 0);
    const totalPax = formData.adults + totalChildren;

    const jobData: Partial<Job> = {
        clientId: user?.id || '',
        clientName: user?.name || 'Guest',
        pickup: formData.pickup,
        pickupCoordinates: formData.pickupCoords || undefined,
        dropoff: formData.dropoff,
        dropoffCoordinates: formData.dropoffCoords || undefined,
        stops: formData.stops.map(s => s.address),
        date: `${formData.date}T${formData.time}:00`,
        bookingType,
        passengers: totalPax,
        luggage: formData.luggage,
        carryOn: formData.carryOn,
        distanceKm: calculatedDistance || 0,
        vehicleType: formData.vehicleType,
        comment: formData.comment,
        needsWifi: false,
        needsEnglish: false,
        durationHours: formData.durationHours,
        isReturnTrip: formData.returnWay,
        returnDate: formData.returnDate,
        returnTime: formData.returnTime,
        children: formData.children,
        flightNumber: formData.flightNumber,
        nameSign: formData.nameSign,
    };

    if (!user) {
        // Save as pending and ask to login
        sessionStorage.setItem('pendingBooking', JSON.stringify(jobData));
        setPendingBooking(jobData);
        setCurrentView('rides'); // Show in rides tab as draft
        return;
    }

    setLoading(true);
    try {
        if (editingJobId) {
            await backend.updateJob(editingJobId, jobData);
            setEditingJobId(null);
        } else {
            await backend.createJob(jobData);
        }
        // Clear form and RESET TERMS
        setFormData(initialState);
        setPendingBooking(null);
        sessionStorage.removeItem('pendingBooking');
        setIsRestoredDraft(false);
        setCurrentView('rides');
    } catch (e) {
        alert("Error saving booking");
    } finally {
        setLoading(false);
    }
  };

  const restoreDraftFromCard = () => {
      if (pendingBooking) {
          setFormData(prev => ({
              ...prev,
              pickup: pendingBooking.pickup,
              pickupCoords: pendingBooking.pickupCoords,
              dropoff: pendingBooking.dropoff || '',
              dropoffCoords: pendingBooking.dropoffCoords,
              vehicleType: pendingBooking.vehicleType || 'Economy',
              // Restore other fields as needed
          }));
          setIsRestoredDraft(true);
          setCurrentView('book');
      }
  };

  const handleRepeatJob = (job: Job) => {
      setFormData(prev => ({
          ...prev,
          pickup: job.dropoff || '', // Reverse trip by default or same? usually repeat means same trip again
          dropoff: job.pickup || '',
          vehicleType: job.vehicleType || 'Economy',
          passengers: job.passengers,
      }));
      setCurrentView('book');
  };

  const confirmCancelJob = async () => {
      if (jobToCancel) {
          await backend.cancelJob(jobToCancel.id);
          loadJobs();
          setJobToCancel(null);
      }
  };
  
  const handlePaymentSuccess = async () => {
      if (paymentModalData) {
          // 1. Get Integration Config to check if Stripe is enabled
          const config = await backend.getIntegrations();
          
          if (config.stripePublishableKey && config.stripeSecretKey) {
             // 2. Initiate Stripe Checkout (Simulated)
             await mockBackend.initiateStripeCheckout(paymentModalData.jobId, paymentModalData.amount);
             
             // Simulate successful payment and redirect back
             alert("Redirecting to Stripe Checkout...\n(Simulated Payment Success)");
             await backend.acceptBid(paymentModalData.jobId, paymentModalData.bidId);
             
             // Add Payment Transaction
             await mockBackend.updateJobStatus(paymentModalData.jobId, JobStatus.ACCEPTED);
             setToast({ message: "Payment Successful! Driver Booked.", type: 'success' });
          } else {
             // Fallback
             await mockBackend.acceptBid(paymentModalData.jobId, paymentModalData.bidId);
             setToast({ message: t('offer_accepted'), type: 'success' });
          }
          
          setPaymentModalData(null);
          loadJobs();
          setRidesFilter('UPCOMING');
      }
  };

  const handleLoginSuccess = (u: User) => {
      onLogin(u);
      setShowAuthModal(false);
  };
  
  const handleLogout = () => {
      backend.logout();
      window.location.reload();
  };

  const filteredJobs = jobs.filter(j => {
      if (ridesFilter === 'REQUESTED') return j.status === JobStatus.PENDING || j.status === JobStatus.BIDDING;
      if (ridesFilter === 'UPCOMING') return [JobStatus.ACCEPTED, JobStatus.DRIVER_EN_ROUTE, JobStatus.DRIVER_ARRIVED, JobStatus.IN_PROGRESS].includes(j.status);
      if (ridesFilter === 'COMPLETE') return [JobStatus.COMPLETED, JobStatus.CANCELLED, JobStatus.REJECTED].includes(j.status);
      return false;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Helper to render child seat info
    const renderChildrenSeats = (children: { infant: number, convertible: number, booster: number } | undefined) => {
        if (!children) return null;
        const seats = [
            children.infant > 0 && `${children.infant} Infant`,
            children.convertible > 0 && `${children.convertible} Convertible`,
            children.booster > 0 && `${children.booster} Booster`,
        ].filter(Boolean);

        if (seats.length === 0) return null;
        
        return (
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Child Seats</p>
                <p className="text-slate-900 dark:text-white font-medium">{seats.join(', ')}</p>
            </div>
        );
    };

  return (
    <div className={`relative min-h-screen pb-20 bg-slate-50 dark:bg-slate-900 ${currentView === 'book' ? '' : 'p-4 md:p-8'}`}>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      {/* --- VIEW: BOOK --- */}
      {currentView === 'book' && (
        <>


            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in overflow-hidden max-w-4xl mx-auto md:mt-0">
          
            {/* 1. TABS */}
            <div className="flex bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <button 
                    onClick={() => setBookingType('DISTANCE')}
                    className={`flex-1 py-3 flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-wide transition-colors ${bookingType === 'DISTANCE' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    <Icons.Route className="w-4 h-4" /> {t('tab_distance')}
                </button>
                <button 
                    onClick={() => setBookingType('HOURLY')}
                    className={`flex-1 py-3 flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-wide transition-colors ${bookingType === 'HOURLY' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    <Icons.Clock className="w-4 h-4" /> {t('tab_hourly')}
                </button>
                <button 
                    onClick={() => setBookingType('DELIVERY')}
                    className={`flex-1 py-3 flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-wide transition-colors ${bookingType === 'DELIVERY' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    <Icons.Truck className="w-4 h-4" /> {t('tab_express')}
                </button>
            </div>

            {/* 2. MAP */}
            <div className="relative w-full h-48 md:h-64 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <div ref={mapRef} className="w-full h-full" />
                {routeError && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 dark:bg-slate-800/95 text-red-600 px-4 py-2 rounded-full shadow-lg text-xs font-bold border border-red-100 dark:border-red-900/50 backdrop-blur-sm z-10 flex items-center gap-2 animate-pulse">
                        <Icons.X className="w-3 h-3" />
                        {routeError}
                    </div>
                )}
            </div>

            {/* 3. INPUTS (Glassmorphism) */}
            <div className="px-2 py-4 md:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 relative overflow-hidden">
                 {/* Decorative background blur element */}
                 <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
                 <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                 
                 <div className="flex flex-col gap-2 relative z-10">
                     
                     {/* PICKUP */}
                     <div className="flex gap-3 relative w-full items-center h-14">
                         <div className="w-10 flex-shrink-0 flex flex-col items-center justify-center h-full relative">
                             {bookingType === 'DISTANCE' && (
                                <div className="absolute top-1/2 -bottom-2 left-0 right-0 mx-auto w-0.5 bg-slate-300 dark:bg-slate-600"></div>
                             )}
                             <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm ring-4 ring-slate-50 dark:ring-slate-900 z-10"></div>
                         </div>
                         <div className="flex-1">
                            <AutocompleteInput 
                                value={formData.pickup} 
                                onChange={v => {
                                    setFormData(prev => ({...prev, pickup: v, pickupCoords: null})); // Clear coords on type
                                    setPickupSelected(false);
                                }} 
                                onPlaceSelected={v => {
                                    setFormData(prev => ({...prev, pickup: v}));
                                    setPickupSelected(true);
                                }}
                                onLocationSelect={(loc) => {
                                    setFormData(prev => ({...prev, pickupCoords: loc}));
                                }}
                                placeholder={t('from_placeholder')} 
                                hideIcon={true}
                                userLocation={userLocation}
                            />
                         </div>
                     </div>
                     
                     {/* STOPS */}
                     {formData.stops.map((stop, index) => (
                        <div key={index} className="flex gap-3 relative w-full items-center animate-fade-in h-14">
                            <div className="w-10 flex-shrink-0 flex flex-col items-center justify-center h-full relative">
                                <div className="absolute -top-2 -bottom-2 left-0 right-0 mx-auto w-0.5 bg-slate-300 dark:bg-slate-600"></div>
                                <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full shadow-sm ring-4 ring-slate-50 dark:ring-slate-900 z-10 border border-slate-300"></div>
                            </div>
                            <div className="flex-1 flex gap-2 h-full">
                                <div className="flex-1">
                                    <AutocompleteInput 
                                        value={stop.address} 
                                        onChange={v => updateStopAddress(index, v)} 
                                        onPlaceSelected={v => updateStopAddress(index, v)} 
                                        onLocationSelect={loc => updateStopLocation(index, loc)}
                                        placeholder={t('add_stop')} 
                                        hideIcon={true}
                                        userLocation={userLocation}
                                    />
                                </div>
                                <button 
                                    onClick={() => removeStop(index)}
                                    className="w-12 h-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <Icons.X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                     ))}

                     {/* ADD STOP BUTTON */}
                     {bookingType === 'DISTANCE' && (
                         <div className="flex gap-3 relative w-full py-1 h-8">
                             <div className="w-10 flex-shrink-0 flex flex-col items-center justify-center relative">
                                 <div className="absolute -top-2 -bottom-2 left-0 right-0 mx-auto w-0.5 bg-slate-300 dark:bg-slate-600"></div>
                             </div>
                             <div className="flex-1 pointer-events-auto flex items-center">
                                 <button 
                                     onClick={addStop}
                                     className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-1.5 shadow-sm text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all transform hover:scale-105"
                                 >
                                     <Icons.Plus className="w-3 h-3" />
                                     {t('add_stop')}
                                 </button>
                             </div>
                         </div>
                     )}
                     
                     {/* DROPOFF */}
                     {bookingType === 'HOURLY' ? (
                         <div className="flex gap-3 relative w-full items-center h-14">
                            <div className="w-10 flex-shrink-0 flex items-center justify-center h-full">
                                <Icons.Clock className="w-5 h-5 text-slate-400"/>
                            </div>
                            <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 relative h-14">
                                <select 
                                    value={formData.durationHours}
                                    onChange={(e) => setFormData(prev => ({...prev, durationHours: parseInt(e.target.value)}))}
                                    className="w-full h-full p-3.5 pl-4 rounded-lg bg-transparent dark:text-white outline-none appearance-none font-medium z-10 relative text-[16px]"
                                >
                                    {HOURS_OPTIONS.map(h => <option key={h} value={h}>{h} Hours</option>)}
                                </select>
                                <Icons.ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            </div>
                         </div>
                     ) : (
                         <div className="flex gap-3 relative w-full items-center h-14">
                             <div className="w-10 flex-shrink-0 flex flex-col items-center justify-center h-full relative">
                                 {bookingType === 'DISTANCE' && (
                                     <div className="absolute -top-2 bottom-1/2 left-0 right-0 mx-auto w-0.5 bg-slate-300 dark:bg-slate-600"></div>
                                 )}
                                 <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm ring-4 ring-slate-50 dark:ring-slate-900 z-10"></div>
                             </div>
                             <div className="flex-1">
                                <AutocompleteInput 
                                    value={formData.dropoff} 
                                    onChange={v => {
                                        setFormData(prev => ({...prev, dropoff: v, dropoffCoords: null})); // Clear coords on type
                                        setDropoffSelected(false);
                                    }} 
                                    onPlaceSelected={v => {
                                        setFormData(prev => ({...prev, dropoff: v}));
                                        setDropoffSelected(true);
                                    }} 
                                    onLocationSelect={(loc) => {
                                        setFormData(prev => ({...prev, dropoffCoords: loc}));
                                    }}
                                    placeholder={t('to_placeholder')} 
                                    hideIcon={true}
                                    userLocation={userLocation}
                                />
                             </div>
                         </div>
                     )}
                 </div>
            </div>

            {/* 3.5 DISTANCE & TIME DISPLAY */}
            {(bookingType === 'DISTANCE' || bookingType === 'DELIVERY') && (
                <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="flex flex-col items-center justify-center p-4 border-r border-slate-200 dark:border-slate-700">
                        <Icons.Route className="w-6 h-6 text-red-600 mb-1.5" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Distance</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                            {calculatedDistance ? `${calculatedDistance} km` : '---'}
                        </span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4">
                        <Icons.Clock className="w-6 h-6 text-red-600 mb-1.5" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Time</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                            {calculatedDuration ? calculatedDuration : '---'}
                        </span>
                    </div>
                </div>
            )}

            {/* 4. CAR SELECTION - PREMIUM CAROUSEL */}
            <div className="py-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-700">
                <div className="px-4 md:px-6 mb-4 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('select_vehicle')}</h3>
                    <div className="hidden md:flex gap-1 text-xs font-bold text-slate-400">
                        <span>SCROLL TO VIEW ALL</span>
                        <Icons.ArrowRight className="w-4 h-4" />
                    </div>
                </div>

                <div className="relative group w-full">
                    {/* Gradient Masks for scroll indication */}
                    <div className="absolute left-0 top-0 bottom-0 w-4 md:w-12 bg-gradient-to-r from-slate-50 dark:from-slate-900 to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-4 md:w-12 bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent z-10 pointer-events-none"></div>

                    <div className="flex overflow-x-auto gap-4 px-4 md:px-6 pb-8 pt-2 snap-x snap-mandatory no-scrollbar w-full">
                        {CAR_CATEGORIES.map((car, index) => {
                            const isSelected = formData.vehicleType === car.name;
                            const price = calculatedDistance ? getPrice(calculatedDistance, car.name) : null;
                            
                            return (
                                <button
                                    key={car.id}
                                    type="button"
                                    onClick={() => setFormData(prev => ({...prev, vehicleType: car.name}))}
                                    className={`
                                        flex-shrink-0 relative w-[260px] md:w-[300px] snap-center
                                        rounded-2xl border-2 transition-all duration-300 ease-out overflow-hidden
                                        flex flex-col text-left group/card
                                        ${isSelected 
                                            ? 'border-green-700 bg-white dark:bg-slate-800 shadow-[0_15px_40px_-10px_rgba(21,128,61,0.2)] scale-100 z-10 ring-1 ring-green-700' 
                                            : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm scale-[0.95] opacity-80 hover:opacity-100 hover:scale-[0.98] hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 grayscale-[0.3] hover:grayscale-0'
                                        }
                                    `}
                                >
                                    {/* Selection Indicator */}
                                    <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-green-700 text-white scale-100 rotate-0' : 'bg-slate-100 dark:bg-slate-700 text-transparent scale-0 rotate-90'}`}>
                                        <Icons.Check className="w-3.5 h-3.5" />
                                    </div>

                                    {/* Car Image Area */}
                                    <div className={`h-32 md:h-40 w-full flex items-center justify-center p-4 relative transition-all duration-500 ${isSelected ? 'bg-gradient-to-b from-green-50/50 to-transparent dark:from-green-900/10' : 'group-hover/card:bg-slate-50 dark:group-hover/card:bg-slate-700/30'}`}>
                                        <car.icon className={`w-full h-full object-contain transition-transform duration-500 ${isSelected ? 'scale-125 drop-shadow-2xl' : 'scale-100 group-hover/card:scale-110'}`} />
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-5 pt-2">
                                        <div className="flex justify-between items-end mb-3">
                                            <div>
                                                <h4 className={`text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white`}>
                                                    {t('vehicle_' + car.name.toLowerCase())}
                                                </h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {car.name === 'Economy' ? 'Best Value' : car.name === 'VIP' ? 'Luxury' : 'Standard'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                {price ? (
                                                    <>
                                                        <span className="block text-[10px] text-slate-400 font-bold mb-0.5">EST.</span>
                                                        <span className={`block text-xl font-black ${isSelected ? 'text-green-700' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            ${price}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-300">---</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Features */}
                                        <div className={`
                                            flex items-center gap-3 py-3 px-4 rounded-xl text-xs font-bold transition-colors
                                            bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200
                                        `}>
                                            <span className="flex items-center gap-2">
                                                <Icons.User className="w-3.5 h-3.5"/> {car.pax}
                                            </span>
                                            <span className="w-px h-3 bg-current opacity-20"></span>
                                            <span className="flex items-center gap-2">
                                                <Icons.Briefcase className="w-3.5 h-3.5"/> {car.bag}
                                            </span>
                                            <span className="w-px h-3 bg-current opacity-20"></span>
                                            <span className="flex-1 text-right uppercase text-[10px] tracking-wider opacity-70">
                                                {car.name} Class
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                        {/* Spacer for right padding */}
                        <div className="w-2 flex-shrink-0"></div>
                    </div>
                </div>
            </div>

            {/* 5. EXTRAS */}
            <div className="p-4 md:p-6 space-y-4">
                {/* Date & Time */}
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                     <div>
                         <label className="text-[10px] text-slate-400 uppercase font-bold pl-1">{t('ride_date')}</label>
                         <div className="relative">
                             <input 
                                type="date" 
                                value={formData.date} 
                                onChange={e => setFormData(prev => ({...prev, date: e.target.value}))} 
                                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white text-sm" 
                             />
                         </div>
                     </div>
                     <div>
                         <label className="text-[10px] text-slate-400 uppercase font-bold pl-1">{t('pickup_time')}</label>
                         <div className="relative">
                             <input 
                                type="time" 
                                value={formData.time} 
                                onChange={e => setFormData(prev => ({...prev, time: e.target.value}))} 
                                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white text-sm" 
                             />
                         </div>
                     </div>
                     <button 
                        type="button"
                        onClick={() => {
                            const now = new Date();
                            const timeStr = now.toTimeString().slice(0,5);
                            const dateStr = now.toISOString().split('T')[0];
                            setFormData(prev => ({...prev, date: dateStr, time: timeStr}));
                        }}
                        className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-2 rounded-lg text-sm font-bold h-10 mb-0.5 whitespace-nowrap min-w-[50px]"
                     >
                        Now
                     </button>
                </div>
                
                {/* Free waiting info */}
                <div className="flex justify-end mt-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                     <button onClick={() => setShowWaitingModal(true)} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity group">
                         <span className="font-bold text-slate-900 dark:text-white">{t('free_waiting_label')}</span>
                         <Icons.Info className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white" />
                     </button>
                </div>

                {/* Return Way */}
                {bookingType === 'DISTANCE' && (
                    <div className="space-y-3">
                        <CustomCheckbox 
                            checked={formData.returnWay} 
                            onChange={e => setFormData(prev => ({...prev, returnWay: e.target.checked}))} 
                            label={t('add_return')} 
                        />
                        {formData.returnWay && (
                            <div className="grid grid-cols-2 gap-3 pl-6 border-l-2 border-slate-100 dark:border-slate-700 animate-fade-in">
                                <input type="date" required value={formData.returnDate} onChange={e => setFormData(prev => ({...prev, returnDate: e.target.value}))} className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white text-sm" />
                                <input type="time" required value={formData.returnTime} onChange={e => setFormData(prev => ({...prev, returnTime: e.target.value}))} className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white text-sm" />
                            </div>
                        )}
                    </div>
                )}
                
                <hr className="border-slate-100 dark:border-slate-700" />

                {/* Passengers */}
                <div className="flex items-center justify-between py-1">
                     <div className="flex items-center gap-3">
                         <Icons.User className="w-5 h-5 text-slate-400" />
                         <span className="text-slate-700 dark:text-slate-300 font-medium">{t('adults')}</span>
                     </div>
                     <Counter value={formData.adults} onChange={v => setFormData(prev => ({...prev, adults: v}))} />
                </div>

                <div 
                    className="flex items-center justify-between py-2 cursor-pointer group"
                    onClick={() => setShowChildrenModal(true)}
                >
                     <div className="flex items-center gap-3">
                         <div className="relative">
                            <Icons.User className="w-4 h-4 text-slate-400" />
                            <Icons.User className="w-3 h-3 text-slate-400 absolute -right-1 bottom-0" />
                         </div>
                         <div className="flex flex-col">
                             <span className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-red-600 transition-colors">{t('children')}</span>
                             <span className="text-xs text-slate-400">
                                 {Object.values(formData.children).reduce((a: number, b: number) => a + b, 0)} selected
                             </span>
                         </div>
                     </div>
                     <Icons.ChevronDown className="w-5 h-5 text-slate-400" />
                </div>

                <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                        <Icons.Briefcase className="w-5 h-5 text-slate-400" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{t('how_many_luggage')}</span>
                    </div>
                    <Counter value={formData.luggage} onChange={v => setFormData(prev => ({...prev, luggage: v}))} />
                </div>
                <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                        <Icons.ShoppingBag className="w-5 h-5 text-slate-400" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{t('how_many_carry_on')}</span>
                    </div>
                    <Counter value={formData.carryOn} onChange={v => setFormData(prev => ({...prev, carryOn: v}))} />
                </div>

                <hr className="border-slate-100 dark:border-slate-700" />

                {/* Flight Number & Name Sign */}
                 <div className="grid md:grid-cols-2 gap-3">
                    <div className="relative">
                        <Icons.Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text"
                            className="w-full pl-10 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white text-sm focus:ring-1 focus:ring-red-500 outline-none" 
                            placeholder={t('flight_number')}
                            value={formData.flightNumber}
                            onChange={e => setFormData(prev => ({...prev, flightNumber: e.target.value}))}
                        />
                    </div>
                     <div className="relative">
                        <Icons.User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text"
                            className="w-full pl-10 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white text-sm focus:ring-1 focus:ring-red-500 outline-none" 
                            placeholder={t('name_sign')}
                            value={formData.nameSign}
                            onChange={e => setFormData(prev => ({...prev, nameSign: e.target.value}))}
                        />
                    </div>
                </div>


                {/* Comment */}
                <div className="relative">
                    <Icons.MessageSquare className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <textarea 
                        className="w-full pl-10 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white text-sm resize-none focus:ring-1 focus:ring-red-500 outline-none" 
                        placeholder={t('comment_placeholder')}
                        rows={2}
                        value={formData.comment}
                        onChange={e => setFormData(prev => ({...prev, comment: e.target.value}))}
                    />
                </div>

                {/* Promo & Terms */}
                <div className="space-y-3 pt-2">
                     <CustomCheckbox 
                         checked={formData.hasPromo} 
                         onChange={e => setFormData(prev => ({...prev, hasPromo: e.target.checked}))} 
                         label={t('have_promo')} 
                     />
                     {formData.hasPromo && (
                         <input type="text" placeholder="Promo Code" value={formData.promoCode} onChange={e => setFormData(prev => ({...prev, promoCode: e.target.value}))} className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm animate-fade-in" />
                     )}
                     <CustomCheckbox 
                         checked={formData.termsAccepted} 
                         onChange={e => setFormData(prev => ({...prev, termsAccepted: e.target.checked}))} 
                         label={<span className="underline decoration-slate-400">{t('accept_terms')}</span>} 
                     />
                </div>

                {/* Submit */}
                {editingJobId && (
                    <div className="bg-amber-100 text-amber-800 p-3 mb-2 rounded-lg flex justify-between items-center mt-4">
                        <span className="font-bold text-sm">{t('edit_request')} #{editingJobId.substring(0,8)}</span>
                        <button onClick={() => { setEditingJobId(null); setFormData(initialState); setCurrentView('rides'); }} className="text-xs font-bold underline hover:text-amber-900">{t('cancel_edit')}</button>
                    </div>
                )}

                <button 
                    onClick={() => handleCreate()} 
                    disabled={loading}
                    className="w-full bg-black hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg uppercase tracking-wide text-lg mt-2 transition-colors"
                >
                    {loading ? t('calculating') : (editingJobId ? 'UPDATE REQUEST' : (isRestoredDraft ? 'PUBLISH REQUEST' : t('get_offers')))}
                </button>
            </div>
          </div>
        </>
      )}

      {/* ... (rest of the component) ... */}
      {/* RIDES VIEW */}
      {currentView === 'rides' && (
        <div className="max-w-4xl mx-auto space-y-4">
           {/* ... (Pending Booking Card) ... */}
           {pendingBooking && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-red-200 dark:border-red-900 overflow-hidden mx-4 md:mx-0">
                    <div className="bg-red-50 dark:bg-red-900/20 px-6 py-2 border-b border-red-100 dark:border-red-900/30 flex justify-between items-center">
                        <span className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                            <Icons.Info className="w-4 h-4" /> {t('draft_request')}
                        </span>
                        <span className="text-xs text-red-600 font-bold">{t('step_2_3')}</span>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-col gap-4">
                             <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                 {pendingBooking.pickup} 
                                 <span className="text-slate-400 mx-2">→</span> 
                                 {pendingBooking.bookingType === 'HOURLY' ? t('hours_session', { hours: pendingBooking.durationHours }) : pendingBooking.dropoff}
                             </h3>
                             <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                  <span className="flex items-center gap-1">
                                      <Icons.Calendar className="w-4 h-4"/> {pendingBooking.date}
                                  </span>
                                  <span className="flex items-center gap-1">
                                      <Icons.Car className="w-4 h-4"/> {t('vehicle_' + pendingBooking.vehicleType.toLowerCase())}
                                  </span>
                             </div>
                        </div>
                        <div className="mt-6">
                             <button 
                                onClick={restoreDraftFromCard}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                             >
                                {user ? t('publish_request_now') : t('login_publish')}
                             </button>
                             {!user && (
                                 <p className="text-center text-xs text-slate-400 mt-2">{t('login_register_hint')}</p>
                             )}
                        </div>
                    </div>
                </div>
           )}

           {!user && !pendingBooking && (
                <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <Icons.Lock className="w-10 h-10 text-slate-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('login_required')}</h2>
                    <p className="text-slate-500 mb-8">{t('login_manage_hint')}</p>
                    <button 
                    onClick={() => setShowAuthModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-colors w-full"
                    >
                    {t('login_register')}
                    </button>
                </div>
           )}

           {user && (
               <>
                <div className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 mx-4 md:mx-0 rounded-t-xl overflow-hidden shadow-sm">
                    <div className="flex">
                        {['REQUESTED', 'UPCOMING', 'COMPLETE'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setRidesFilter(tab as any)}
                                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors uppercase tracking-wide ${
                                    ridesFilter === tab 
                                    ? 'border-red-600 text-red-600' 
                                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                            >
                                {tab === 'REQUESTED' ? t('tab_requested') : tab === 'UPCOMING' ? t('tab_upcoming') : t('tab_complete')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    {/* Make New Booking Button for Requested Tab */}
                    {ridesFilter === 'REQUESTED' && (
                        <div className="px-4 md:px-0 mb-4">
                            <button
                                onClick={() => { setEditingJobId(null); setFormData(initialState); setCurrentView('book'); }}
                                className="w-full bg-black hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
                            >
                                <Icons.Plus className="w-5 h-5" />
                                {t('make_new_booking')}
                            </button>
                        </div>
                    )}

                    {filteredJobs.length === 0 && !pendingBooking && (
                        <div className="text-center py-12 px-6">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icons.Car className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400">{t('no_rides_found')}</p>
                            {ridesFilter === 'REQUESTED' && (
                                <button onClick={() => setCurrentView('book')} className="text-red-600 font-bold mt-2 hover:underline">{t('book_ride_now')}</button>
                            )}
                        </div>
                    )}

                    {filteredJobs.map(job => {
                        const isExpanded = expandedJobId === job.id;
                        return (
                            <div key={job.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mx-4 md:mx-0 animate-fade-in">
                                <button 
                                    onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                                    className="w-full text-left p-6 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 pr-4">
                                            <div className="font-bold text-slate-900 dark:text-white text-lg flex flex-col gap-1">
                                                <span>{job.pickup}</span>
                                                {job.bookingType !== 'HOURLY' && <span className="text-slate-400 text-sm pl-1">↓</span>}
                                                <span>{job.dropoff || t('hours_session', { hours: job.durationHours })}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                {(!job.bids || job.bids.length === 0) && <StatusBadge status={job.status} />}
                                                {ridesFilter === 'REQUESTED' && job.bids && job.bids.length > 0 && (
                                                    <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-blue-100 text-blue-800 animate-pulse">
                                                        {job.bids.length} {job.bids.length > 1 ? t('offers') : t('offer')} {t('received')}
                                                    </span>
                                                )}
                                                <span className="text-sm text-slate-500">{new Date(job.date).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                        <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 shrink-0">
                                            {isExpanded ? <Icons.Minus className="w-5 h-5"/> : <Icons.Plus className="w-5 h-5"/>}
                                        </div>
                                    </div>
                                </button>
                                {isExpanded && (
                                    <div className="px-6 pb-6 border-t border-slate-100 dark:border-slate-700 animate-fade-in">
                                        <div className="pt-6">
                                            {ridesFilter === 'REQUESTED' && job.bids && job.bids.length > 0 && (
                                                <div className="mb-6 space-y-4">
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('driver_offers')}</h4>
                                                    {job.bids.map(bid => {
                                                        const driver = driverDetails[bid.driverId];
                                                        const vehicle = driver?.vehicles?.[0];
                                                        const carPhoto = vehicle?.photos?.[0]?.url;

                                                        return (
                                                            <div key={bid.id} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                                                                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                                                    <div className="flex-1 flex gap-4">
                                                                        <div className="w-20 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200"><img src={carPhoto || 'https://placehold.co/600x400/grey/white?text=Car'} alt="Car" className="w-full h-full object-cover" /></div>
                                                                        <div>
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <h4 className="font-bold text-slate-900 dark:text-white text-base">{bid.driverName}</h4>
                                                                                <div className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5"><Icons.Star className="w-3 h-3 fill-amber-700 stroke-none" /> {driver?.rating || bid.rating}</div>
                                                                            </div>
                                                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{bid.vehicleDescription}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right flex flex-row md:flex-col justify-between items-center md:items-end w-full md:w-auto gap-3">
                                        <p className="text-2xl font-black text-slate-900 dark:text-white">${bid.amount}</p>
                                        <div className="flex gap-2">
                                            <button className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white p-2.5 rounded-xl transition-colors">
                                                <Icons.MessageSquare className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => setPaymentModalData({ jobId: job.id, bidId: bid.id, amount: bid.amount, driverName: bid.driverName })} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md uppercase tracking-wide transform hover:scale-105 transition-all">
                                                {t('accept')}
                                            </button>
                                        </div>
                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            
                                            {job.status !== JobStatus.PENDING && job.status !== JobStatus.BIDDING && job.driverName && (
                                                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl shadow-inner mb-4 border border-slate-200 dark:border-slate-700 h-80">
                                                    <ChatWindow jobId={job.id} currentUser={user} otherUserName={job.driverName} />
                                                </div>
                                            )}

                                            <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-500 uppercase">{t('distance_label')}</p>
                                                    <p className="text-slate-900 dark:text-white font-medium">{job.distanceKm} km</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-500 uppercase">{t('passengers')}</p>
                                                    <p className="text-slate-900 dark:text-white font-medium">{job.passengers} Total</p>
                                                </div>
                                                {renderChildrenSeats(job.children)}

                                                {job.flightNumber && (
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500 uppercase">{t('flight_number')}</p>
                                                        <p className="text-slate-900 dark:text-white font-medium">{job.flightNumber}</p>
                                                    </div>
                                                )}
                                                {job.nameSign && (
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500 uppercase">{t('name_sign')}</p>
                                                        <p className="text-slate-900 dark:text-white font-medium">{job.nameSign}</p>
                                                    </div>
                                                )}
                                                {job.comment && (
                                                    <div className="md:col-span-2">
                                                        <p className="text-xs font-bold text-slate-500 uppercase">Comment</p>
                                                        <p className="text-slate-900 dark:text-white font-medium whitespace-pre-wrap">{job.comment}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col md:flex-row gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-700">
                                            {(ridesFilter === 'REQUESTED' || job.status === JobStatus.ACCEPTED) && (
                                                <button onClick={() => handleEditJob(job)} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 font-bold py-3 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2">
                                                    <Icons.Edit3 className="w-4 h-4" />
                                                    {t('edit_request')}
                                                </button>
                                            )}
                                            {(job.status === JobStatus.PENDING || job.status === JobStatus.BIDDING || job.status === JobStatus.ACCEPTED) && (
                                                <button onClick={() => setJobToCancel(job)} className="flex-1 bg-white dark:bg-slate-800 text-red-600 border border-red-200 dark:border-red-900 py-3 rounded-lg font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2">
                                                    <Icons.X className="w-4 h-4" />
                                                    {t('cancel_trip')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
               </>
           )}
           
           {user && jobs.length === 0 && !pendingBooking && (
                <div className="text-center py-12 px-6">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icons.Car className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">{t('no_transfers')}</p>
                    <button onClick={() => setCurrentView('book')} className="text-red-600 font-bold mt-2 hover:underline">Book a ride now</button>
                </div>
           )}
        </div>
      )}

      {currentView === 'support' && <SupportView />}
      
      {currentView === 'settings' && (
        <SettingsView 
            user={user} 
            onLoginRequest={() => setShowAuthModal(true)} 
            onLogout={handleLogout} 
        />
      )}

      {/* --- MOBILE FOOTER NAV --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-2 flex justify-around items-center z-50 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <button onClick={() => setCurrentView('book')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentView === 'book' ? 'text-red-600' : 'text-slate-400'}`}>
            <Icons.Plus className="w-6 h-6" />
            <span className="text-[10px] font-bold">{t('book')}</span>
        </button>
        <button onClick={() => setCurrentView('rides')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentView === 'rides' ? 'text-red-600' : 'text-slate-400'}`}>
            <Icons.Car className="w-6 h-6" />
            <span className="text-[10px] font-bold">{t('rides')}</span>
        </button>
        <button onClick={() => setCurrentView('support')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentView === 'support' ? 'text-red-600' : 'text-slate-400'}`}>
            <Icons.MessageSquare className="w-6 h-6" />
            <span className="text-[10px] font-bold">{t('support')}</span>
        </button>
        <button onClick={() => setCurrentView('settings')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentView === 'settings' ? 'text-red-600' : 'text-slate-400'}`}>
            <Icons.Settings className="w-6 h-6" />
            <span className="text-[10px] font-bold">{t('settings')}</span>
        </button>
      </div>

      {showMembershipModal && user && (
        <MembershipModal onClose={() => setShowMembershipModal(false)} userId={user.id} onUpgrade={() => loadJobs()} />
      )}
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onLogin={handleLoginSuccess}
        initialRole={initialRole || UserRole.CLIENT}
      />

      <ChildrenModal 
        isOpen={showChildrenModal}
        onClose={() => setShowChildrenModal(false)}
        childrenData={formData.children}
        onChange={(field: string, val: number) => setFormData(prev => ({...prev, children: {...prev.children, [field]: val}}))}
      />

      <WaitingDetailsModal
        isOpen={showWaitingModal}
        onClose={() => setShowWaitingModal(false)}
      />

      {jobToCancel && (
        <ConfirmationModal
            title={t('cancel_trip')}
            message={t('cancel_confirm_message')}
            confirmText={t('yes_cancel')}
            cancelText={t('no_keep')}
            onConfirm={confirmCancelJob}
            onCancel={() => setJobToCancel(null)}
        />
      )}
      
      <PaymentModal 
        isOpen={!!paymentModalData}
        amount={paymentModalData?.amount}
        driverName={paymentModalData?.driverName}
        onClose={() => setPaymentModalData(null)}
        onPay={handlePaymentSuccess}
      />
    </div>
  );
};