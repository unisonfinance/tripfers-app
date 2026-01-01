
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Job, JobStatus, VehicleSettings, DriverFilter, VehiclePhoto, CompanyProfile, UserStatus, UserRole, DriverDocument, DocumentType, SubDriver, PricingThresholds } from '../types';
import { backend } from '../services/BackendService';
import { Icons } from '../components/Icons';
import { Toast } from '../components/Toast';
import { ChatWindow } from '../components/ChatWindow';
import { AutocompleteInput } from '../components/AutocompleteInput';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { PayoutsView } from '../components/driver/PayoutsView';
import { ReportsView } from '../components/driver/ReportsView';
import { DocumentsView } from '../components/driver/DocumentsView';
import { useTranslation } from 'react-i18next';

interface DriverDashboardProps {
  user: User;
}

const VEHICLE_TYPES = ['Economy', 'Comfort', 'Business', 'Premium', 'VIP', 'SUV', 'Van', 'Minibus', 'Bus'];

// --- CALENDAR COMPONENT ---
const CalendarView = ({ jobs, onSelectDate, selectedDate }: { jobs: Job[], onSelectDate: (d: string | null) => void, selectedDate: string | null }) => {
    const { t, i18n } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const monthName = currentDate.toLocaleString(i18n.language, { month: 'long', year: 'numeric' });

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    // Map jobs to dates
    const jobsByDate = useMemo(() => {
        const map: Record<string, { hasScheduled: boolean, hasPast: boolean, count: number }> = {};
        jobs.forEach(j => {
            const dateStr = j.date.split('T')[0];
            if (!map[dateStr]) map[dateStr] = { hasScheduled: false, hasPast: false, count: 0 };
            
            map[dateStr].count++;
            if ([JobStatus.ACCEPTED, JobStatus.DRIVER_EN_ROUTE, JobStatus.DRIVER_ARRIVED, JobStatus.IN_PROGRESS].includes(j.status)) {
                map[dateStr].hasScheduled = true;
            } else {
                map[dateStr].hasPast = true;
            }
        });
        return map;
    }, [jobs]);

    const renderCalendarDays = () => {
        const days = [];
        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-14 bg-slate-50/50 dark:bg-slate-800/50 border border-transparent"></div>);
        }
        
        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const info = jobsByDate[dateStr];
            const isSelected = selectedDate === dateStr;

            days.push(
                <button 
                    key={d} 
                    onClick={() => onSelectDate(isSelected ? null : dateStr)}
                    className={`h-14 border border-slate-100 dark:border-slate-700 rounded-lg relative flex flex-col items-center justify-start pt-1 transition-all
                        ${isSelected ? 'bg-black text-white ring-2 ring-offset-2 ring-black' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}
                    `}
                >
                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>{d}</span>
                    <div className="flex gap-1 mt-1">
                        {info?.hasScheduled && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
                        {info?.hasPast && <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>}
                    </div>
                </button>
            );
        }
        return days;
    };

    const daysShort = (t('days_short', { returnObjects: true }) as string[]) || ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><Icons.ChevronDown className="w-5 h-5 rotate-90"/></button>
                <h3 className="font-bold text-lg dark:text-white">{monthName}</h3>
                <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><Icons.ChevronDown className="w-5 h-5 -rotate-90"/></button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {daysShort.map(d => (
                    <div key={d} className="text-[10px] font-bold text-slate-400 uppercase">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {renderCalendarDays()}
            </div>
            <div className="flex gap-4 justify-center mt-4 text-xs">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-slate-500">{t('scheduled')}</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400"></div><span className="text-slate-500">{t('past')}</span></div>
            </div>
        </div>
    );
};

// --- SETTINGS SUB-COMPONENTS ---
// ... (Reusing existing settings components for brevity where not changed logic)
const SettingsMenuItem = ({ icon: Icon, label, value, onClick }: any) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
        <div className="flex items-center gap-4">
            <div className="text-slate-400"><Icon className="w-6 h-6" /></div>
            <span className="font-bold text-slate-700 dark:text-slate-200">{label}</span>
        </div>
        <div className="flex items-center gap-2">
            {value && <span className="text-slate-400 text-sm">{value}</span>}
            <Icons.ChevronRight className="w-5 h-5 text-slate-300" />
        </div>
    </button>
);

const ToggleSwitch = ({ checked, onChange, label }: { checked: boolean, onChange: (v: boolean) => void, label: string }) => (
    <div className="flex justify-between items-center py-3">
        <span className="text-slate-700 dark:text-slate-300 font-medium">{label}</span>
        <button onClick={() => onChange(!checked)} className={`w-12 h-7 rounded-full transition-colors relative ${checked ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-1 transition-all ${checked ? 'left-6' : 'left-1'}`} />
        </button>
    </div>
);

const SettingsLayout = ({ title, onBack, children, footer, disableScroll }: any) => (
    <div className={`fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-900 flex flex-col animate-fade-in safe-area-inset-bottom safe-area-inset-top`}>
        <div className={`bg-white dark:bg-slate-800 px-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4 shrink-0 ${disableScroll ? 'py-3' : 'py-4'}`}>
            <button onClick={onBack}><Icons.ArrowLeft className="w-6 h-6 text-slate-700 dark:text-white" /></button>
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">{title}</h2>
        </div>
        <div className={`flex-1 ${disableScroll ? 'overflow-hidden relative' : 'overflow-y-auto'}`}>{children}</div>
        {footer && <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">{footer}</div>}
    </div>
);

const InputField = ({ label, value, onChange, placeholder }: any) => (
    <div className="space-y-1 mb-4">
        <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
        <input 
            type="text" 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            placeholder={placeholder}
            className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-black dark:focus:border-white transition-colors dark:text-white"
        />
    </div>
);

const RequestsFilterPanel = ({ filters, onChange, onApply }: { filters: any, onChange: (f: any) => void, onApply: () => void }) => {
    const [expanded, setExpanded] = useState(false);
    const { t } = useTranslation();
    
    // Quick check if filters are active
    const isActive = filters.minPax !== null || filters.maxPax !== null || filters.startDate !== '' || filters.endDate !== '' || filters.onlyUrgent;

    return (
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
             <div className="px-4 py-2 flex justify-between items-center">
                 <button 
                    onClick={() => setExpanded(!expanded)} 
                    className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300"
                 >
                     <Icons.Filter className="w-4 h-4" />
                     {t('filters')}
                     {isActive && <span className="w-2 h-2 rounded-full bg-red-600"></span>}
                 </button>
                 {isActive && (
                     <button 
                        onClick={() => {
                            onChange({ minPax: null, maxPax: null, startDate: '', endDate: '', onlyUrgent: false });
                            setTimeout(onApply, 100); // Trigger clear
                        }}
                        className="text-xs text-slate-500 hover:text-red-600"
                    >
                        {t('clear_all')}
                    </button>
                 )}
             </div>
             
             {expanded && (
                 <div className="p-4 space-y-4 animate-slide-up bg-slate-50 dark:bg-slate-900/50">
                     <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t('passengers')}</label>
                         <div className="flex gap-2">
                             <button 
                                onClick={() => onChange({...filters, minPax: null, maxPax: null})}
                                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${filters.minPax === null ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'}`}
                             >
                                 {t('any')}
                             </button>
                             <button 
                                onClick={() => onChange({...filters, minPax: 1, maxPax: 3})}
                                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${filters.minPax === 1 && filters.maxPax === 3 ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'}`}
                             >
                                 1-3
                             </button>
                             <button 
                                onClick={() => onChange({...filters, minPax: 4, maxPax: 8})}
                                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${filters.minPax === 4 && filters.maxPax === 8 ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'}`}
                             >
                                 4-8
                             </button>
                         </div>
                     </div>
                     
                     <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t('date_range')}</label>
                         <div className="flex items-center gap-2">
                             <input 
                                type="date" 
                                value={filters.startDate}
                                onChange={e => onChange({...filters, startDate: e.target.value})}
                                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white"
                             />
                             <span className="text-slate-400">-</span>
                             <input 
                                type="date" 
                                value={filters.endDate}
                                onChange={e => onChange({...filters, endDate: e.target.value})}
                                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white"
                             />
                         </div>
                     </div>
                     
                     <div>
                         <label className="flex items-center gap-3 cursor-pointer">
                             <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.onlyUrgent ? 'bg-red-600 border-red-600' : 'bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600'}`}>
                                 {filters.onlyUrgent && <Icons.Check className="w-3.5 h-3.5 text-white" />}
                             </div>
                             <input type="checkbox" className="hidden" checked={filters.onlyUrgent} onChange={e => onChange({...filters, onlyUrgent: e.target.checked})} />
                             <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('only_urgent_jobs')}</span>
                         </label>
                     </div>

                     <button 
                        onClick={() => { onApply(); setExpanded(false); }}
                        className="w-full bg-black text-white py-3 rounded-xl font-bold uppercase tracking-wide text-sm shadow-lg hover:bg-slate-900 transition-colors"
                     >
                         {t('apply_filters')}
                     </button>
                 </div>
             )}
        </div>
    );
};

// --- SETTINGS VIEW COMPONENT LOGIC (Simplified wrapper reuse) ---
// (We keep the detailed view components from original file but compact here to fit changes focused on Footer/Tabs)
const DriverCard = ({ driver, isMain, onSave, onDelete, onExpand, isExpanded }: any) => {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        name: driver.name || '',
        surname: driver.surname || '',
        email: driver.email || '',
        phone: driver.phone || '',
        photo: driver.photo || '',
        country: driver.country || ''
    });

    // Only update form if driver ID changes or if it's a new driver being added
    // This prevents form reset when parent re-renders or background polling occurs
    useEffect(() => {
        setForm(prev => {
            // If the ID matches, we assume it's the same driver and don't overwrite local edits
            // unless the prop values are significantly different (e.g. external update) 
            // BUT for this specific bug, simple ID check is usually sufficient to prevent
            // re-render resets while typing.
            // However, to be safe against parent re-renders passing new objects with same data:
            if (driver.id === prevDriverIdRef.current) return prev;
            
            prevDriverIdRef.current = driver.id;
            return {
                name: driver.name || '',
                surname: driver.surname || '',
                email: driver.email || '',
                phone: driver.phone || '',
                photo: driver.photo || ''
            };
        });
    }, [driver.id, driver.name, driver.surname, driver.email, driver.phone, driver.photo, driver.country]);
    
    const prevDriverIdRef = useRef(driver.id);

    const handleImageUpload = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm(prev => ({ ...prev, photo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-4 transition-all">
            {/* Header / Collapsed View */}
            <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={onExpand}>
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-600">
                    {form.photo ? (
                        <img src={form.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">
                            {form.name?.[0] || <Icons.User className="w-6 h-6" />}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{form.name} {form.surname}</h4>
                        {isMain && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black text-white uppercase">Main</span>}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{form.email || t('no_email')}</p>
                </div>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center gap-3">
                    {!isMain && (
                        <div onClick={(e) => { e.stopPropagation(); onDelete(driver.id); }} className="hover:text-red-500 transition-colors">
                            <Icons.Trash className="w-5 h-5" />
                        </div>
                    )}
                    {isExpanded ? <Icons.Minus className="w-5 h-5" /> : <Icons.Plus className="w-5 h-5" />}
                </button>
            </div>

            {/* Expanded Edit View */}
            {isExpanded && (
                <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-700 animate-slide-up">
                    <div className="py-4 flex justify-center">
                        <label className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden border-2 border-slate-200 dark:border-slate-600">
                                {form.photo ? (
                                    <img src={form.photo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <Icons.Camera className="w-8 h-8" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                <Icons.Edit3 className="w-6 h-6 text-white" />
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <InputField label={t('name')} value={form.name} onChange={(v: string) => setForm({...form, name: v})} placeholder={t('enter_first_name')} />
                        <InputField label={t('surname')} value={form.surname} onChange={(v: string) => setForm({...form, surname: v})} placeholder={t('enter_last_name')} />
                    </div>
                    <InputField label={t('email')} value={form.email} onChange={(v: string) => setForm({...form, email: v})} placeholder={t('enter_email_placeholder')} />
                    <InputField label={t('phone_number')} value={form.phone} onChange={(v: string) => setForm({...form, phone: v})} placeholder={t('enter_phone_placeholder')} />
                    <InputField label={t('placeholder_country')} value={form.country} onChange={(v: string) => setForm({...form, country: v})} placeholder={t('placeholder_country')} />
                    
                    <div className="flex gap-3 mt-6">
                        <button onClick={() => onSave(form)} className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">
                            {t('save_changes')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ProfileSettingsView = ({ currentUser, onSave, onBack }: any) => {
    const { t } = useTranslation();
    
    // Main Driver (User) Adapter
    const mainDriver = {
        id: currentUser.id,
        name: currentUser.name?.split(' ')[0] || '',
        surname: currentUser.name?.split(' ').slice(1).join(' ') || '',
        email: currentUser.email,
        phone: currentUser.phone,
        photo: currentUser.avatar,
        country: currentUser.country || ''
    };

    const handleSaveMain = (data: any) => {
        onSave({
            name: `${data.name} ${data.surname}`.trim(),
            email: data.email,
            phone: data.phone,
            avatar: data.photo,
            country: data.country
        });
    };

    return (
        <SettingsLayout title={t('driver_profile')} onBack={onBack}>
            <div className="p-4 pb-24 relative">
                <p className="text-xs font-bold text-slate-500 uppercase mb-4 ml-1">{t('account_owner')}</p>
                <DriverCard 
                    driver={mainDriver} 
                    isMain={true} 
                    isExpanded={true}
                    onExpand={() => {}}
                    onSave={handleSaveMain}
                />
            </div>
        </SettingsLayout>
    );
};
const ServiceZonesView = ({ onClose, onSave, initialZones }: any) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>(null);
    const [drawingManager, setDrawingManager] = useState<any>(null);
    const [activeTool, setActiveTool] = useState<'move' | 'poly' | 'circle'>('move');
    const currentShapeRef = useRef<any>(null); // Ref to hold the current overlay
    const [hasShape, setHasShape] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { t } = useTranslation();

    // Initialize Map and DrawingManager
    useEffect(() => {
        if (!mapRef.current || !window.google) return;

        // Default Center (Brisbane/Gold Coast roughly based on screenshot or default)
        // If initialZones exist, center there.
        let center = { lat: -28.0167, lng: 153.4000 };
        let zoom = 10;
        
        // 1. Init Map
        const mapInstance = new window.google.maps.Map(mapRef.current, {
            center: center,
            zoom: 8, // Zoomed out as requested
            disableDefaultUI: false, // We want zoom controls
            zoomControl: true,
            zoomControlOptions: {
                position: window.google.maps.ControlPosition.RIGHT_CENTER
            },
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: "greedy",
            styles: [
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }],
                },
            ],
        });

        // 2. Add Center Location Dot (Mock Driver Location)
        new window.google.maps.Marker({
            position: center,
            map: mapInstance,
            icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#F97316", // Orange
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
            },
            title: "Your Location"
        });

        setMap(mapInstance);

        // 3. Init Drawing Manager
        const dm = new window.google.maps.drawing.DrawingManager({
            drawingMode: null, // Start in Move mode
            drawingControl: false, // Hide default toolbar
            polygonOptions: {
                fillColor: '#F97316',
                fillOpacity: 0.35,
                strokeWeight: 2,
                strokeColor: '#EA580C',
                clickable: true,
                editable: true,
                draggable: true,
                zIndex: 1
            },
            circleOptions: {
                fillColor: '#F97316',
                fillOpacity: 0.35,
                strokeWeight: 2,
                strokeColor: '#EA580C',
                clickable: true,
                editable: true,
                draggable: true,
                zIndex: 1
            }
        });

        dm.setMap(mapInstance);
        setDrawingManager(dm);

        // 4. Load Initial Zone
        if (initialZones && initialZones.length > 0) {
            const zone = initialZones[0];
            if (zone.type === 'polygon' && zone.path) {
                const polygon = new window.google.maps.Polygon({
                    paths: zone.path,
                    fillColor: '#F97316',
                    fillOpacity: 0.35,
                    strokeWeight: 2,
                    strokeColor: '#EA580C',
                    editable: true,
                    draggable: true,
                    map: mapInstance
                });
                currentShapeRef.current = polygon;
                setHasShape(true);
                
                // Fit bounds
                const bounds = new window.google.maps.LatLngBounds();
                zone.path.forEach((p: any) => bounds.extend(p));
                mapInstance.fitBounds(bounds);
            } else if (zone.type === 'circle' && zone.center) {
                const circle = new window.google.maps.Circle({
                    center: zone.center,
                    radius: zone.radius,
                    fillColor: '#F97316',
                    fillOpacity: 0.35,
                    strokeWeight: 2,
                    strokeColor: '#EA580C',
                    editable: true,
                    draggable: true,
                    map: mapInstance
                });
                currentShapeRef.current = circle;
                setHasShape(true);
                mapInstance.setCenter(zone.center);
                mapInstance.setZoom(12); // Approximate
            }
        }

        // 5. Event Listener for New Shapes
        window.google.maps.event.addListener(dm, 'overlaycomplete', function(e: any) {
            // Delete previous shape if exists (Only one allowed)
            if (currentShapeRef.current) {
                currentShapeRef.current.setMap(null);
            }

            const newShape = e.overlay;
            newShape.type = e.type; // 'polygon' or 'circle'
            
            // Switch to move mode immediately after drawing to allow editing
            dm.setDrawingMode(null);
            setActiveTool('move');

            currentShapeRef.current = newShape;
            setHasShape(true);

            // Add listeners to shape (optional, for debug or auto-save)
        });

    }, []);

    // Tool Switcher Logic
    useEffect(() => {
        if (!drawingManager) return;
        
        if (activeTool === 'move') {
            drawingManager.setDrawingMode(null);
        } else if (activeTool === 'poly') {
            // If shape exists, warn or clear? 
            // The prompt implies we can just switch tools. 
            // We'll let the overlaycomplete handle the replacement logic.
            drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
        } else if (activeTool === 'circle') {
            drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.CIRCLE);
        }
    }, [activeTool, drawingManager]);

    const handleDelete = () => {
        if (currentShapeRef.current) {
            setShowDeleteConfirm(true);
        }
    };

    const confirmDelete = () => {
        if (currentShapeRef.current) {
            currentShapeRef.current.setMap(null);
            currentShapeRef.current = null;
            setHasShape(false);
        }
        setShowDeleteConfirm(false);
    };

    const handleSave = () => {
        if (!currentShapeRef.current) {
            alert("Please define an operating area before saving.");
            return;
        }

        const shape = currentShapeRef.current;
        let zoneData = null;

        if (shape.type === 'polygon' || shape instanceof window.google.maps.Polygon) {
            const path = shape.getPath();
            const coords = [];
            for (let i = 0; i < path.getLength(); i++) {
                coords.push({ lat: path.getAt(i).lat(), lng: path.getAt(i).lng() });
            }
            zoneData = { type: 'polygon', path: coords };
        } else if (shape.type === 'circle' || shape instanceof window.google.maps.Circle) {
            zoneData = {
                type: 'circle',
                center: { lat: shape.getCenter().lat(), lng: shape.getCenter().lng() },
                radius: shape.getRadius()
            };
        }

        if (zoneData) {
            onSave([zoneData]); // Save as single item array
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 3000); // Hide after 3 seconds
        }
    };

    return (
        <SettingsLayout title={t('operating_area')} onBack={onClose} disableScroll={true}>
            <div className="relative h-full w-full flex flex-col">
                {/* TOOLBAR (Floating Top Center) */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 pointer-events-auto">
                    <button 
                        onClick={() => setActiveTool('move')} 
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${activeTool === 'move' ? 'bg-[#F97316] text-white scale-110' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        title={t('move_map')}
                    >
                        <Icons.Move className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={() => setActiveTool('poly')} 
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${activeTool === 'poly' ? 'bg-[#F97316] text-white scale-110' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        title={t('draw_polygon')}
                    >
                        <Icons.PenTool className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={() => setActiveTool('circle')} 
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${activeTool === 'circle' ? 'bg-[#F97316] text-white scale-110' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        title={t('draw_circle')}
                    >
                        <Icons.CircleDot className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={handleDelete} 
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md bg-white text-red-500 hover:bg-red-50 border border-slate-200`}
                        title={t('delete_area')}
                    >
                        <Icons.Trash className="w-6 h-6" />
                    </button>
                </div>

                {/* MAP CONTAINER */}
                <div className="flex-1 relative w-full h-full">
                    <div ref={mapRef} className="w-full h-full bg-slate-100" />
                </div>

                {/* SAVE BUTTON */}
                <div className="bg-white dark:bg-slate-800 z-20 shrink-0 p-4 pb-6">
                    <button 
                        onClick={handleSave} 
                        className={`w-full py-4 rounded-full font-bold uppercase tracking-wide text-sm shadow-lg transition-all mx-auto block ${hasShape ? 'bg-[#22C55E] hover:bg-[#16A34A] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        disabled={!hasShape}
                    >
                        {t('save')}
                    </button>
                </div>

                {/* SUCCESS POPUP */}
                {showSaveSuccess && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in" onClick={() => setShowSaveSuccess(false)}>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center animate-slide-up transform scale-100" onClick={e => e.stopPropagation()}>
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                                <Icons.Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{t('saved_title')}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('saved_area_msg')}</p>
                        </div>
                    </div>
                )}

                {/* DELETE CONFIRMATION POPUP */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowDeleteConfirm(false)}>
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                            <div className="p-8 text-center">
                                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ring-4 ring-red-50 dark:ring-red-900/10">
                                    <Icons.Trash className="w-10 h-10 text-red-500" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{t('delete_area_title')}</h3>
                                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed text-sm">
                                    {t('delete_area_msg')}
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={confirmDelete}
                                        className="w-full py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-lg shadow-lg shadow-red-500/30 transition-all active:scale-[0.98]"
                                    >
                                        {t('confirm_delete')}
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="w-full py-4 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        {t('cancel')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SettingsLayout>
    );
};

const VehiclePhotosModal = ({ vehicle, onSave, onClose }: any) => {
    const [photos, setPhotos] = useState<VehiclePhoto[]>(vehicle.photos || []);
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    const { t } = useTranslation();

    const handleImageUpload = (e: any) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        Promise.all(files.map((file: any) => {
            return new Promise<VehiclePhoto>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({
                        id: Math.random().toString(36).substr(2, 9),
                        url: reader.result as string,
                        status: 'PENDING',
                        isDefault: false
                    });
                };
                reader.readAsDataURL(file);
            });
        })).then(newPhotos => {
            setPhotos(prev => [...prev, ...newPhotos].slice(0, 6));
        });
        
        e.target.value = '';
    };

    const removeImage = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const onDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const onDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const onDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === index) return;
        const newPhotos = [...photos];
        const [movedItem] = newPhotos.splice(draggedIdx, 1);
        newPhotos.splice(index, 0, movedItem);
        setPhotos(newPhotos);
        setDraggedIdx(null);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg dark:text-white">Manage Photos</h3>
                    <button onClick={onClose}><Icons.X className="w-6 h-6 text-slate-400" /></button>
                </div>
                <div className="p-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Vehicle Photos (Max 6) - Drag to reorder</label>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {photos.map((photo, idx) => (
                            <div 
                                key={photo.id || idx} 
                                draggable
                                onDragStart={(e) => onDragStart(e, idx)}
                                onDragOver={(e) => onDragOver(e, idx)}
                                onDrop={(e) => onDrop(e, idx)}
                                className={`aspect-square rounded-xl overflow-hidden relative border bg-slate-100 group cursor-grab active:cursor-grabbing transition-all ${draggedIdx === idx ? 'opacity-50 scale-95 border-dashed border-slate-400' : 'border-slate-200 hover:shadow-md'}`}
                            >
                                <img src={photo.url} alt="Vehicle" className="w-full h-full object-cover pointer-events-none" />
                                <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors z-10">
                                    <Icons.X className="w-3 h-3" />
                                </button>
                                
                                {/* Status Overlays */}
                                {photo.status === 'PENDING' && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                                        <div className="bg-amber-500/90 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wide shadow-sm flex items-center gap-1">
                                            <Icons.Clock className="w-3 h-3" /> Verifying
                                        </div>
                                    </div>
                                )}
                                {photo.status === 'APPROVED' && (
                                    <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-1 shadow-sm">
                                        <Icons.Check className="w-3 h-3" />
                                    </div>
                                )}
                                {photo.status === 'REJECTED' && (
                                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                                         <div className="bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded uppercase">Rejected</div>
                                    </div>
                                )}

                                {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-1 font-bold backdrop-blur-sm">MAIN PHOTO</div>}
                            </div>
                        ))}
                        {photos.length < 6 && (
                            <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                                <Icons.Plus className="w-6 h-6 mb-1" />
                                <span className="text-[10px] font-bold uppercase">Add Photo</span>
                                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                            </label>
                        )}
                    </div>
                    <button 
                        onClick={() => onSave(photos)} 
                        className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

const VehiclesView = ({ vehicles, onEdit, onAdd, onDelete, drivers, onUpdate }: any) => {
    const { t } = useTranslation();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [photosModalVehicle, setPhotosModalVehicle] = useState<VehicleSettings | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleFeatureToggle = (vehicle: VehicleSettings, feature: keyof VehicleSettings['features']) => {
        const updatedFeatures = { ...vehicle.features, [feature]: !vehicle.features?.[feature] };
        onUpdate({ ...vehicle, features: updatedFeatures });
    };

    const handleDefaultDriverChange = (vehicle: VehicleSettings, driverId: string) => {
        onUpdate({ ...vehicle, defaultDriverId: driverId });
    };

    const handlePhotosSave = (newPhotos: VehiclePhoto[]) => {
        if (photosModalVehicle) {
            onUpdate({ ...photosModalVehicle, photos: newPhotos });
            setPhotosModalVehicle(null);
        }
    };

    return (
        <div className="p-4 space-y-4">
             {photosModalVehicle && (
                <VehiclePhotosModal 
                    vehicle={photosModalVehicle} 
                    onSave={handlePhotosSave} 
                    onClose={() => setPhotosModalVehicle(null)} 
                />
            )}

            {vehicles.map((v: VehicleSettings) => (
                <div 
                    key={v.id} 
                    onClick={() => toggleExpand(v.id)}
                    className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative animate-fade-in cursor-pointer group transition-all hover:shadow-md"
                >
                    <div className="flex gap-4">
                        {/* Vehicle Image */}
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden shrink-0 relative">
                            {v.photos && v.photos.length > 0 ? (
                                <>
                                    <img src={v.photos[0].url} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />
                                    {v.photos[0].status === 'PENDING' && (
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                            <Icons.Clock className="w-6 h-6 text-white" />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <Icons.Car className="w-8 h-8" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-lg dark:text-white leading-tight mb-1">{v.make} {v.model}</h4>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">{v.year}</span>
                                        <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: v.color?.toLowerCase() }}></div>
                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono border border-slate-200 dark:border-slate-600">{v.plate}</span>
                                    </div>
                                </div>
                                {/* Header Actions: Plus/Minus and Edit Pen */}
                                <div className="flex gap-3">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onEdit(v.id); }} 
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                                    >
                                        <Icons.Edit3 className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleExpand(v.id); }} 
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                                    >
                                        {expandedId === v.id ? <Icons.Minus className="w-5 h-5" /> : <Icons.Plus className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mb-2">
                                 <span className="font-bold text-sm text-slate-900 dark:text-white">{t('vehicle_' + v.type.toLowerCase())}</span>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-1">
                                    <Icons.User className="w-4 h-4" />
                                    <span className="font-bold">x{v.maxPassengers}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Icons.Briefcase className="w-4 h-4" />
                                    <span className="font-bold">x{v.maxLuggage}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedId === v.id && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 animate-slide-up" onClick={e => e.stopPropagation()}>
                            <div className="mb-4">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-3">{t('default_options')}</p>
                                <div className="flex gap-4 overflow-x-auto pb-2">
                                    {/* Features Icons - Toggleable */}
                                    {[
                                        { key: 'wifi', icon: Icons.Wifi, label: t('vehicle_features_wifi') },
                                        { key: 'water', icon: Icons.Droplet, label: t('vehicle_features_water') },
                                        { key: 'charger', icon: Icons.Zap, label: t('vehicle_features_charger') },
                                        { key: 'accessible', icon: Icons.Accessibility, label: t('vehicle_features_accessible') },
                                        { key: 'childSeat', icon: Icons.Baby, label: t('vehicle_features_child_seat') }
                                    ].map(feature => (
                                        <button 
                                            key={feature.key}
                                            onClick={() => handleFeatureToggle(v, feature.key as any)}
                                            className={`flex flex-col items-center gap-1 shrink-0 ${v.features?.[feature.key as keyof typeof v.features] ? 'text-orange-500' : 'text-slate-300'}`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${v.features?.[feature.key as keyof typeof v.features] ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                                <feature.icon className="w-6 h-6" />
                                            </div>
                                            <span className="text-[10px] font-medium">{feature.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Photos Link */}
                            <div 
                                onClick={() => setPhotosModalVehicle(v)}
                                className="flex items-center justify-between py-3 border-t border-b border-slate-100 dark:border-slate-700 mb-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Icons.Camera className="w-5 h-5 text-slate-800 dark:text-white" />
                                    <span className="font-bold text-slate-900 dark:text-white">{t('manage_photos')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                    <Icons.Check className="w-4 h-4" />
                                    <span>{t('approved')}: {v.photos?.filter(p => p.status === 'APPROVED').length || 0}</span>
                                    <Icons.ChevronRight className="w-4 h-4 text-slate-400 ml-2" />
                                </div>
                            </div>

                            {/* Default Driver Dropdown */}
                            <div className="mb-4">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">{t('default_driver')}</p>
                                <div className="relative">
                                    <select 
                                        value={v.defaultDriverId || ''}
                                        onChange={(e) => handleDefaultDriverChange(v, e.target.value)}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none appearance-none font-bold text-slate-900 dark:text-white"
                                    >
                                        <option value="">{t('select_driver')}</option>
                                        {drivers?.map((d: any) => (
                                            <option key={d?.id || Math.random()} value={d?.id}>{d?.name} {d?.surname} {d?.id && drivers?.[0]?.id && d.id === drivers[0].id ? t('main_driver_suffix') : ''}</option>
                                        ))}
                                    </select>
                                    <Icons.ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            
                            <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                                <h5 className="font-bold text-slate-900 dark:text-white mb-2">{t('autocancel_offers')}</h5>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {t('autocancel_desc')}
                                </p>
                            </div>

                            <button onClick={() => onDelete(v.id)} className="w-full mt-4 py-3 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center gap-2">
                                <Icons.Trash className="w-4 h-4" /> {t('delete_vehicle')}
                            </button>
                        </div>
                    )}
                </div>
            ))}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-20">
                 <button onClick={onAdd} className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold py-4 rounded-full uppercase tracking-wide text-sm shadow-lg">{t('add_vehicle')}</button>
            </div>
            {/* Spacer for fixed footer */}
            <div className="h-20"></div>
        </div>
    );
};

const CreateVehicleView = ({ onBack, onSaveAndContinue }: any) => {
    const [form, setForm] = useState({ 
        make: '', model: '', year: '', plate: '', color: '', type: 'Economy',
        maxPassengers: 4, maxLuggage: 2, maxCarryOn: 2,
        photos: [] as VehiclePhoto[]
    });
    const { t } = useTranslation();
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    
    // Image upload handler (multi-select + max 6)
    const handleImageUpload = (e: any) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        Promise.all(files.map((file: any) => {
            return new Promise<VehiclePhoto>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({
                        id: Math.random().toString(36).substr(2, 9),
                        url: reader.result as string,
                        status: 'PENDING',
                        isDefault: false
                    });
                };
                reader.readAsDataURL(file);
            });
        })).then(newPhotos => {
            setForm(prev => {
                const currentPhotos = prev.photos || [];
                const combined = [...currentPhotos, ...newPhotos].slice(0, 6);
                return { ...prev, photos: combined };
            });
        });
        
        e.target.value = ''; // Reset input
    };

    const removeImage = (index: number) => {
        setForm(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
    };

    const onDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = "move";
        // Optional: set custom drag image
    };

    const onDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const onDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === index) return;

        const newPhotos = [...form.photos];
        const [movedItem] = newPhotos.splice(draggedIdx, 1);
        newPhotos.splice(index, 0, movedItem);

        setForm(prev => ({ ...prev, photos: newPhotos }));
        setDraggedIdx(null);
    };

    return (
        <SettingsLayout title={t('add_vehicle')} onBack={onBack} footer={<button onClick={() => onSaveAndContinue(form)} className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold py-4 rounded-full uppercase tracking-wide text-sm shadow-lg">{t('continue')}</button>}>
            <div className="p-6 space-y-6">
                {/* Image Upload Section */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">{t('manage_photos')} (Max 6) - {t('drag_to_reorder')}</label>
                    <div className="grid grid-cols-3 gap-3">
                        {form.photos.map((photo, idx) => (
                            <div 
                                key={photo.id || idx} 
                                draggable
                                onDragStart={(e) => onDragStart(e, idx)}
                                onDragOver={(e) => onDragOver(e, idx)}
                                onDrop={(e) => onDrop(e, idx)}
                                className={`aspect-square rounded-xl overflow-hidden relative border bg-slate-100 group cursor-grab active:cursor-grabbing transition-all ${draggedIdx === idx ? 'opacity-50 scale-95 border-dashed border-slate-400' : 'border-slate-200 hover:shadow-md'}`}
                            >
                                <img src={photo.url} alt="Vehicle" className="w-full h-full object-cover pointer-events-none" />
                                <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors">
                                    <Icons.X className="w-3 h-3" />
                                </button>
                                {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white text-[10px] text-center py-1 font-bold backdrop-blur-sm">{t('main_photo')}</div>}
                            </div>
                        ))}
                        {form.photos.length < 6 && (
                            <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                                <Icons.Plus className="w-6 h-6 mb-1" />
                                <span className="text-[10px] font-bold uppercase">{t('add_photo')}</span>
                                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                            </label>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Default Options (Features) */}
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-3">{t('default_options')}</p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setForm(prev => ({ ...prev, features: { ...prev.features, wifi: !prev.features?.wifi } }))}
                                className={`flex flex-col items-center gap-1 ${form.features?.wifi ? 'text-orange-500' : 'text-slate-300'}`}
                            >
                                <div className={`w-14 h-14 rounded-xl border flex items-center justify-center transition-all ${form.features?.wifi ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                    <Icons.Wifi className="w-6 h-6" />
                                    {form.features?.wifi && <div className="absolute top-1 right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center"><Icons.Check className="w-2 h-2 text-white" /></div>}
                                </div>
                                <span className="text-[10px] font-medium">{t('vehicle_features_wifi')}</span>
                            </button>

                            <button 
                                onClick={() => setForm(prev => ({ ...prev, features: { ...prev.features, water: !prev.features?.water } }))}
                                className={`flex flex-col items-center gap-1 ${form.features?.water ? 'text-orange-500' : 'text-slate-300'}`}
                            >
                                <div className={`w-14 h-14 rounded-xl border flex items-center justify-center transition-all ${form.features?.water ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                    <Icons.Droplet className="w-6 h-6" />
                                    {form.features?.water && <div className="absolute top-1 right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center"><Icons.Check className="w-2 h-2 text-white" /></div>}
                                </div>
                                <span className="text-[10px] font-medium">{t('vehicle_features_water')}</span>
                            </button>

                            <button 
                                onClick={() => setForm(prev => ({ ...prev, features: { ...prev.features, charger: !prev.features?.charger } }))}
                                className={`flex flex-col items-center gap-1 ${form.features?.charger ? 'text-orange-500' : 'text-slate-300'}`}
                            >
                                <div className={`w-14 h-14 rounded-xl border flex items-center justify-center transition-all ${form.features?.charger ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                    <Icons.Zap className="w-6 h-6" />
                                    {form.features?.charger && <div className="absolute top-1 right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center"><Icons.Check className="w-2 h-2 text-white" /></div>}
                                </div>
                                <span className="text-[10px] font-medium">{t('vehicle_features_charger')}</span>
                            </button>

                            <button 
                                onClick={() => setForm(prev => ({ ...prev, features: { ...prev.features, accessible: !prev.features?.accessible } }))}
                                className={`flex flex-col items-center gap-1 ${form.features?.accessible ? 'text-orange-500' : 'text-slate-300'}`}
                            >
                                <div className={`w-14 h-14 rounded-xl border flex items-center justify-center transition-all ${form.features?.accessible ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                    <Icons.Accessibility className="w-6 h-6" /> 
                                    {form.features?.accessible && <div className="absolute top-1 right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center"><Icons.Check className="w-2 h-2 text-white" /></div>}
                                </div>
                                <span className="text-[10px] font-medium">{t('vehicle_features_accessible')}</span>
                            </button>

                            <button 
                                onClick={() => setForm(prev => ({ ...prev, features: { ...prev.features, childSeat: !prev.features?.childSeat } }))}
                                className={`flex flex-col items-center gap-1 ${form.features?.childSeat ? 'text-orange-500' : 'text-slate-300'}`}
                            >
                                <div className={`w-14 h-14 rounded-xl border flex items-center justify-center transition-all ${form.features?.childSeat ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                    <Icons.Baby className="w-6 h-6" /> 
                                    {form.features?.childSeat && <div className="absolute top-1 right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center"><Icons.Check className="w-2 h-2 text-white" /></div>}
                                </div>
                                <span className="text-[10px] font-medium">{t('vehicle_features_child_seat')}</span>
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('vehicle_type_label')}</label>
                        <div className="relative">
                            <select 
                                value={form.type} 
                                onChange={e => setForm({...form, type: e.target.value})}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-green-500 appearance-none dark:text-white font-semibold"
                            >
                                {VEHICLE_TYPES.map(type => (
                                    <option key={type} value={type}>{t('vehicle_' + type.toLowerCase())}</option>
                                ))}
                            </select>
                            <Icons.ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField label={t('make')} value={form.make} onChange={(v: string) => setForm({...form, make: v})} placeholder="e.g. Mercedes" />
                        <InputField label={t('model')} value={form.model} onChange={(v: string) => setForm({...form, model: v})} placeholder="e.g. V-Class" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField label={t('year')} value={form.year} onChange={(v: string) => setForm({...form, year: v})} placeholder="2024" />
                        <InputField label={t('color')} value={form.color} onChange={(v: string) => setForm({...form, color: v})} placeholder="Black" />
                    </div>

                    <InputField label={t('license_plate')} value={form.plate} onChange={(v: string) => setForm({...form, plate: v})} placeholder="ABC-123" />
                    
                    <div className="grid grid-cols-3 gap-3 pt-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('passengers')}</label>
                            <div className="relative">
                                <input type="number" value={form.maxPassengers} onChange={e => setForm({...form, maxPassengers: parseInt(e.target.value) || 0})} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-center" />
                                <Icons.User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('luggage')}</label>
                            <div className="relative">
                                <input type="number" value={form.maxLuggage} onChange={e => setForm({...form, maxLuggage: parseInt(e.target.value) || 0})} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-center" />
                                <Icons.Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('carry_on')}</label>
                            <div className="relative">
                                <input type="number" value={form.maxCarryOn} onChange={e => setForm({...form, maxCarryOn: parseInt(e.target.value) || 0})} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-center" />
                                <Icons.Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 opacity-60" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SettingsLayout>
    );
};
const EditVehicleView = ({ vehicleId, vehicles, onSave, onClose, onDelete }: any) => {
    const v = vehicles.find((x: any) => x.id === vehicleId);
    const [form, setForm] = useState(v || { type: 'Economy', photos: [] });
    const { t } = useTranslation();
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    
    // Initialize default values if missing
    useEffect(() => {
        if (v) {
            setForm({
                ...v,
                maxPassengers: v.maxPassengers || 4,
                maxLuggage: v.maxLuggage || 2,
                maxCarryOn: v.maxCarryOn || 2,
                photos: v.photos || []
            });
        }
    }, [v]);

    // Image upload handler (multi-select + max 6)
    const handleImageUpload = (e: any) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        Promise.all(files.map((file: any) => {
            return new Promise<VehiclePhoto>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({
                        id: Math.random().toString(36).substr(2, 9),
                        url: reader.result as string,
                        status: 'PENDING',
                        isDefault: false
                    });
                };
                reader.readAsDataURL(file);
            });
        })).then(newPhotos => {
            setForm((prev: any) => {
                const currentPhotos = prev.photos || [];
                const combined = [...currentPhotos, ...newPhotos].slice(0, 6);
                return { ...prev, photos: combined };
            });
        });
        e.target.value = ''; // Reset
    };

    const removeImage = (index: number) => {
        setForm((prev: any) => ({ ...prev, photos: (prev.photos || []).filter((_: any, i: number) => i !== index) }));
    };

    const onDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const onDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const onDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === index) return;

        const newPhotos = [...(form.photos || [])];
        const [movedItem] = newPhotos.splice(draggedIdx, 1);
        newPhotos.splice(index, 0, movedItem);

        setForm((prev: any) => ({ ...prev, photos: newPhotos }));
        setDraggedIdx(null);
    };

    if (!v) return null;
    return (
        <SettingsLayout title={t('edit_vehicle')} onBack={onClose} footer={<button onClick={() => onSave(form)} className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold py-4 rounded-full uppercase tracking-wide text-sm shadow-lg">{t('save_changes')}</button>}>
            <div className="p-6 space-y-6">
                {/* Image Upload Section */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">{t('manage_photos')} (Max 6) - {t('drag_to_reorder')}</label>
                    <div className="grid grid-cols-3 gap-3">
                        {(form.photos || []).map((photo: VehiclePhoto, idx: number) => (
                            <div 
                                key={photo.id || idx} 
                                draggable
                                onDragStart={(e) => onDragStart(e, idx)}
                                onDragOver={(e) => onDragOver(e, idx)}
                                onDrop={(e) => onDrop(e, idx)}
                                className={`aspect-square rounded-xl overflow-hidden relative border bg-slate-100 group cursor-grab active:cursor-grabbing transition-all ${draggedIdx === idx ? 'opacity-50 scale-95 border-dashed border-slate-400' : 'border-slate-200 hover:shadow-md'}`}
                            >
                                <img src={photo.url} alt="Vehicle" className="w-full h-full object-cover pointer-events-none" />
                                <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors">
                                    <Icons.X className="w-3 h-3" />
                                </button>
                                {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white text-[10px] text-center py-1 font-bold backdrop-blur-sm">{t('main_photo')}</div>}
                            </div>
                        ))}
                        {(form.photos || []).length < 6 && (
                            <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                                <Icons.Plus className="w-6 h-6 mb-1" />
                                <span className="text-[10px] font-bold uppercase">{t('add_photo')}</span>
                                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                            </label>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('vehicle_type_label')}</label>
                        <div className="relative">
                            <select 
                                value={form.type || 'Economy'} 
                                onChange={e => setForm({...form, type: e.target.value})}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-green-500 appearance-none dark:text-white font-semibold"
                            >
                                {VEHICLE_TYPES.map(type => (
                                    <option key={type} value={type}>{t('vehicle_' + type.toLowerCase())}</option>
                                ))}
                            </select>
                            <Icons.ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label={t('make')} value={form.make} onChange={(val: string) => setForm({...form, make: val})} />
                        <InputField label={t('model')} value={form.model} onChange={(val: string) => setForm({...form, model: val})} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label={t('year')} value={form.year} onChange={(val: string) => setForm({...form, year: val})} />
                        <InputField label={t('color')} value={form.color} onChange={(val: string) => setForm({...form, color: val})} />
                    </div>
                    
                    <InputField label={t('license_plate')} value={form.plate} onChange={(val: string) => setForm({...form, plate: val})} />

                    <div className="grid grid-cols-3 gap-3 pt-2">
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('passengers')}</label>
                             <div className="relative">
                                 <input type="number" value={form.maxPassengers} onChange={e => setForm({...form, maxPassengers: parseInt(e.target.value) || 0})} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-center" />
                                 <Icons.User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             </div>
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('luggage')}</label>
                             <div className="relative">
                                 <input type="number" value={form.maxLuggage} onChange={e => setForm({...form, maxLuggage: parseInt(e.target.value) || 0})} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-center" />
                                 <Icons.Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             </div>
                         </div>
                          <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('carry_on')}</label>
                             <div className="relative">
                                 <input type="number" value={form.maxCarryOn} onChange={e => setForm({...form, maxCarryOn: parseInt(e.target.value) || 0})} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-center" />
                                 <Icons.Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 opacity-60" />
                             </div>
                         </div>
                     </div>

                    <div className="flex items-center justify-between py-3 border-t border-b border-slate-100 dark:border-slate-700 mb-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <Icons.Camera className="w-5 h-5 text-slate-800 dark:text-white" />
                            <span className="font-bold text-slate-900 dark:text-white">{t('manage_photos')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                            <Icons.Check className="w-4 h-4" />
                            <span>{t('approved')}: {(form.photos || []).length}</span>
                            <Icons.ChevronRight className="w-4 h-4 text-slate-400 ml-2" />
                        </div>
                    </div>
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <h5 className="font-bold text-slate-900 dark:text-white">{t('autocancel_offers')}</h5>
                            <ToggleSwitch checked={form.autoCancelOffers ?? true} onChange={v => setForm({...form, autoCancelOffers: v})} />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            {t('autocancel_desc')}
                        </p>
                    </div>

                    <div className="py-2 border-t border-slate-100 dark:border-slate-700 mb-4">
                        <div className="flex items-center gap-3 py-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">JL</div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Default driver</p>
                                <p className="font-bold text-slate-900 dark:text-white">J. Lott</p>
                            </div>
                            <div className="ml-auto flex gap-2">
                                <button className="text-slate-400"><Icons.X className="w-5 h-5" /></button>
                                <button className="text-slate-400"><Icons.ChevronDown className="w-5 h-5" /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SettingsLayout>
    );
};

const OfferDetailsModal = ({ job, onClose, onOffer, onSkip, thresholds }: { job: Job, onClose: () => void, onOffer: (jobId: string, amount: number) => void, onSkip: (jobId: string) => void, thresholds: PricingThresholds | null }) => {
    const [amount, setAmount] = useState<string>('');
    const [feedback, setFeedback] = useState<{ message: string; color: string; icon: React.ReactNode } | null>(null);
    const { t } = useTranslation();

    const platformEstimate = useMemo(() => {
        if (job.distanceKm && job.vehicleType) {
            return backend.calculatePrice(job.distanceKm, job.vehicleType);
        }
        return 0;
    }, [job.distanceKm, job.vehicleType]);

    useEffect(() => {
        const numericAmount = Number(amount);
        if (numericAmount <= 0 || !platformEstimate) {
            setFeedback(null);
            return;
        }

        const diffPercent = ((numericAmount - platformEstimate) / platformEstimate) * 100;
        
        // Defaults if not loaded yet
        const highAlert = thresholds?.highAlertPercent ?? 50;
        const lowAlert = thresholds?.lowAlertPercent ?? 50;
        const fair = thresholds?.fairOfferPercent ?? 35;
        const good = thresholds?.goodOfferPercent ?? 10;

        if (diffPercent > highAlert) {
            setFeedback({
                message: t('offer_feedback_high'), 
                color: "text-red-600 dark:text-red-400",
                icon: <Icons.AlertTriangle className="w-4 h-4" />
            });
        } else if (diffPercent < -lowAlert) {
            setFeedback({
                message: t('offer_feedback_low'),
                color: "text-red-600 dark:text-red-400",
                icon: <Icons.AlertTriangle className="w-4 h-4" />
            });
        } else if (Math.abs(diffPercent) <= good) {
             setFeedback({
                message: t('offer_feedback_good'),
                color: "text-green-600 dark:text-green-400",
                icon: <Icons.Check className="w-4 h-4" />
            });
        } else if (Math.abs(diffPercent) <= fair) {
             setFeedback({
                message: t('offer_feedback_fair'),
                color: "text-blue-600 dark:text-blue-400",
                icon: <Icons.Info className="w-4 h-4" />
            });
        } else {
            // Gap between Fair and Alert (e.g. 36% to 49%)
            setFeedback({
                message: t('offer_feedback_normal'),
                color: "text-blue-600 dark:text-blue-400",
                icon: <Icons.Info className="w-4 h-4" />
            });
        }
    }, [amount, platformEstimate, t, thresholds]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl p-6 relative animate-slide-up shadow-2xl">
                 <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                     <Icons.X className="w-5 h-5 text-slate-500"/>
                 </button>
                 <h3 className="font-bold text-xl mb-1 dark:text-white">{t('make_offer')}</h3>
                 <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{t('trip_to')} {job.dropoff}</p>
                 
                 {platformEstimate > 0 && (
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-800/50 p-4 rounded-xl text-center mb-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-center gap-2">
                            <Icons.Tag className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {t('platform_estimate')}
                            </h4>
                        </div>
                        <p className="text-4xl font-black text-slate-900 dark:text-white mt-2">
                            ${platformEstimate}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {t('based_on')} {job.distanceKm}km {t('for_vehicle', { vehicle: t('vehicle_' + job.vehicleType.toLowerCase()) })}.
                        </p>
                    </div>
                 )}

                 <div className="mb-4">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('your_price')} ($)</label>
                     <input 
                        type="number"
                        placeholder="0"
                        value={amount} 
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        onChange={e => setAmount(e.target.value)} 
                        className="w-full p-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-2xl font-bold bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none text-center focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all" 
                     />
                 </div>
                 
                 {feedback && (
                    <div className="flex items-center justify-center text-center gap-2 text-xs font-bold p-3 rounded-lg mb-4 animate-fade-in bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                        <div className={`shrink-0 ${feedback.color}`}>{feedback.icon}</div>
                        <p className={feedback.color}>{feedback.message}</p>
                    </div>
                 )}

                 <button 
                    onClick={() => onOffer(job.id, Number(amount))} 
                    className="w-full bg-black text-white py-4 rounded-xl font-bold mb-3 uppercase tracking-wide shadow-lg hover:bg-slate-800 transition-colors"
                 >
                    {t('send_offer')}
                 </button>
                 <button 
                    onClick={() => { onSkip(job.id); onClose(); }} 
                    className="w-full bg-transparent border-2 border-slate-200 dark:border-slate-700 text-slate-500 py-3 rounded-xl font-bold uppercase text-xs tracking-wide hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                 >
                    {t('skip_request')}
                 </button>
            </div>
        </div>
    );
};


// --- MAIN DASHBOARD ---

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ user }) => {
  const { t } = useTranslation();
  // Navigation State
  const [activeMainTab, setActiveMainTab] = useState<'requests' | 'rides' | 'chats' | 'settings'>('requests');
  
  // Sidebar state (added for mobile consistency, though driver dashboard uses bottom nav mainly)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Requests Tab State
  const [requestsSubTab, setRequestsSubTab] = useState<'NEW' | 'OFFERS' | 'SKIPPED'>('NEW');
  const [requestFilters, setRequestFilters] = useState({ minPax: null as number | null, maxPax: null as number | null, startDate: '', endDate: '', onlyUrgent: false });
  const [appliedRequestFilters, setAppliedRequestFilters] = useState(requestFilters);
  
  // Rides Tab State
  const [ridesSubTab, setRidesSubTab] = useState<'SCHEDULED' | 'PAST' | 'CALENDAR'>('SCHEDULED');
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | null>(null);

  const [settingsView, setSettingsView] = useState<'MAIN' | 'PROFILE' | 'OFFERS' | 'NOTIFICATIONS' | 'VEHICLES' | 'CREATE_VEHICLE' | 'EDIT_VEHICLE' | 'COMPANY' | 'ZONES' | 'PAYOUTS' | 'REPORTS' | 'INVITE' | 'DOCUMENTS' | 'INSTRUCTIONS' | 'SUPPORT' | 'CURRENCY' | 'DISTANCE' | 'LANGUAGE'>('MAIN');
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [selectedJobForOffer, setSelectedJobForOffer] = useState<Job | null>(null);
  const [notificationSettings, setNotificationSettings] = useState({ pushNewRequests: true, emailNewRequests: true, pushUrgent: true, autoOffers: true, reminders24h: true });
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [thresholds, setThresholds] = useState<PricingThresholds | null>(null); // Add state for thresholds
  
  // Unsaved Changes Protection
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const handleNavigation = (action: () => void) => {
      if (hasUnsavedChanges) {
          setPendingNavigation(() => action);
          setShowUnsavedModal(true);
      } else {
          action();
      }
  };

  const confirmNavigation = () => {
      setShowUnsavedModal(false);
      setHasUnsavedChanges(false);
      if (pendingNavigation) pendingNavigation();
      setPendingNavigation(null);
  };

  useEffect(() => { setCurrentUser(user); }, [user]);

  const activeJob = jobs.find(j => j.driverId === currentUser.id && [JobStatus.DRIVER_EN_ROUTE, JobStatus.DRIVER_ARRIVED, JobStatus.IN_PROGRESS].includes(j.status));

  useEffect(() => {
      const fetchData = async () => {
          try {
              const data = await backend.getJobs(UserRole.DRIVER, currentUser.id);
              setJobs(data);
              const t_data = await backend.getPricingThresholds();
              setThresholds(t_data);
              const latestUser = await backend.getUser(currentUser.id);
              if (latestUser) {
                  setCurrentUser(prev => {
                      if (JSON.stringify(prev) !== JSON.stringify(latestUser)) {
                          return latestUser;
                      }
                      return prev;
                  });
              }
          } catch (err) {
              console.error("DriverDashboard fetch error:", err);
          }
      };
      
      fetchData();
      const unsubscribe = backend.subscribe(fetchData);
      const interval = setInterval(fetchData, 5000);
      return () => {
          unsubscribe();
          clearInterval(interval);
      };
  }, [currentUser.id]);

  const updateStatus = async (jobId: string, status: JobStatus) => { await backend.updateJobStatus(jobId, status); };
  const isSkipped = (jobId: string) => currentUser.skippedJobIds?.includes(jobId);
  const handleSkip = async (jobId: string) => { const u = await backend.skipJob(currentUser.id, jobId); setCurrentUser(u); };
  const handleRestore = async (jobId: string) => { const u = await backend.unskipJob(currentUser.id, jobId); setCurrentUser(u); };
  const hasBid = (job: Job) => job.bids?.some(b => b.driverId === currentUser.id);
  const submitBid = async (jobId: string, amount: number) => { await backend.placeBid(jobId, { driverId: currentUser.id, driverName: currentUser.name, amount, vehicleDescription: currentUser.vehicles?.[0] ? `${currentUser.vehicles[0].make} ${currentUser.vehicles[0].model}` : 'Standard Vehicle', rating: currentUser.rating || 5.0 }); setSelectedJobForOffer(null); setToast({msg: 'Offer sent!', type: 'success'}); };

  // --- FILTERING LOGIC ---
  const filteredJobs = useMemo(() => {
      return jobs.filter(j => {
          // 1. CHATS TAB
          if (activeMainTab === 'chats') {
              return (j.driverId === currentUser.id || hasBid(j)) && j.status !== JobStatus.CANCELLED;
          }

          // 2. REQUESTS TAB
          if (activeMainTab === 'requests') {
              // Requests can ONLY show Pending or Bidding jobs
              if (j.status !== JobStatus.PENDING && j.status !== JobStatus.BIDDING) return false;
              if (j.driverId && j.driverId !== currentUser.id) return false; // Not assigned to others
              
              const skipped = isSkipped(j.id);
              
              if (requestsSubTab === 'SKIPPED') {
                  return skipped;
              }

              if (skipped) return false;

              // Sub-Tab Separation
              const bidExists = hasBid(j);
              if (requestsSubTab === 'NEW' && bidExists) return false; // New must have NO offers
              if (requestsSubTab === 'OFFERS' && !bidExists) return false; // With Offers must HAVE offers

              // Apply Filters
              const { minPax, maxPax, startDate, endDate, onlyUrgent } = appliedRequestFilters;
              if (minPax !== null && j.passengers < minPax) return false;
              if (maxPax !== null && j.passengers > maxPax) return false;
              if (startDate && new Date(j.date) < new Date(startDate)) return false;
              if (endDate) {
                  const end = new Date(endDate);
                  end.setDate(end.getDate() + 1);
                  if (new Date(j.date) >= end) return false;
              }
              if (onlyUrgent && !j.isUrgent) return false;

              return true;
          }

          // 3. RIDES TAB
          if (activeMainTab === 'rides') {
              // Rides Sub-Tabs
              if (ridesSubTab === 'SCHEDULED') {
                  // Must be accepted or active AND assigned to this driver
                  if (![JobStatus.ACCEPTED, JobStatus.DRIVER_EN_ROUTE, JobStatus.DRIVER_ARRIVED, JobStatus.IN_PROGRESS].includes(j.status)) return false;
                  return j.driverId === currentUser.id;
              }
              if (ridesSubTab === 'PAST') {
                  // Must be completed/cancelled etc AND assigned to this driver
                  if (![JobStatus.COMPLETED, JobStatus.CANCELLED, JobStatus.REJECTED, JobStatus.DISPUTED].includes(j.status)) return false;
                  return j.driverId === currentUser.id;
              }
              if (ridesSubTab === 'CALENDAR') {
                  // Show all rides associated with driver (Scheduled + Past)
                   // Must be assigned to this driver
                   if (j.driverId !== currentUser.id) return false;
                   // Filter by date if selected
                   if (calendarSelectedDate) {
                       return j.date.startsWith(calendarSelectedDate);
                   }
                   return true;
              }
          }
          return false;
      }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [jobs, activeMainTab, requestsSubTab, ridesSubTab, appliedRequestFilters, calendarSelectedDate, currentUser.id, currentUser.skippedJobIds]);

  const myVehicles = currentUser.vehicles || [];

  const handleSaveVehicleData = async (vehicles: VehicleSettings[]) => {
    const updatedUser = await backend.updateDriverVehicles(currentUser.id, vehicles);
    setCurrentUser(updatedUser);
    setToast({ msg: 'Changes saved', type: 'success' });
  };
  const handleUpdateVehicle = (updatedVehicle: VehicleSettings) => {
      handleSaveVehicleData(myVehicles.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
  };
  const handleCreateAndContinue = (vehicleData: Partial<VehicleSettings>) => {
    const newVehicle: VehicleSettings = { id: Math.random().toString(36).substr(2, 9), make: '', model: '', year: '', color: '', plate: '', maxPassengers: 7, maxLuggage: 5, maxCarryOn: 5, type: 'Van', photos: [], features: { wifi: true, water: true, charger: true, accessible: false, childSeat: false }, autoCancelOffers: true, bufferTimeBefore: 0, bufferTimeAfter: 0, ...vehicleData, };
    handleSaveVehicleData([...myVehicles, newVehicle]); setEditingVehicleId(newVehicle.id); setSettingsView('EDIT_VEHICLE');
  };
  const handleSaveEditedVehicle = (formData: VehicleSettings) => { handleSaveVehicleData(myVehicles.map((v: VehicleSettings) => v.id === editingVehicleId ? formData : v)); setSettingsView('VEHICLES'); };
  const handleDeleteVehicle = async (vehicleId: string) => { handleSaveVehicleData(myVehicles.filter(v => v.id !== vehicleId)); setToast({msg: 'Vehicle deleted', type: 'info'}); };
  const handleUpdateProfile = async (userData: Partial<User>, noExit?: boolean) => { 
      const updatedUser = await backend.adminUpdateUserInfo(currentUser.id, userData); 
      setCurrentUser(updatedUser); 
      if (!noExit) setSettingsView('MAIN'); 
      setTimeout(() => setToast({msg: 'Changes saved', type: 'success'}), 2000); 
  };
  const handleUpdateDocuments = async (userData: Partial<User>) => { const updatedUser = await mockBackend.adminUpdateUserInfo(currentUser.id, userData); setCurrentUser(updatedUser); setToast({msg: 'Changes saved', type: 'success'}); };
  const handleUpdateZones = async (zones: any[]) => { const updatedUser = { ...currentUser, serviceZones: zones }; await mockBackend.adminUpdateUserInfo(currentUser.id, { serviceZones: zones }); setCurrentUser(updatedUser); setSettingsView('MAIN'); setTimeout(() => { setToast({ msg: 'Changes saved', type: 'success' }); }, 2000); };
  const handleUpdateZonesNoExit = async (zones: any[]) => { const updatedUser = { ...currentUser, serviceZones: zones }; await mockBackend.adminUpdateUserInfo(currentUser.id, { serviceZones: zones }); setCurrentUser(updatedUser); };
  const handleLogout = () => { mockBackend.logout(); window.location.hash = '/'; window.location.reload(); };

  const hasVehicles = myVehicles.length > 0;
  
  const renderSettingsContent = () => {
      switch(settingsView) {
          case 'MAIN': return (<div className="pb-8 animate-fade-in"><div className="flex justify-center pt-4 pb-3"><div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-4 py-1.5 rounded-full shadow-sm border border-slate-200 dark:border-slate-700"><Icons.Star className="w-4 h-4 fill-amber-400 text-amber-400" /><span className="font-bold text-slate-900 dark:text-white">0.0</span><span className="text-slate-400 text-xs ml-1">(0)</span><span className="text-slate-300 dark:text-slate-600 mx-2">|</span><Icons.Lock className="w-3 h-3 text-slate-400" /><Icons.ChevronRight className="w-3 h-3 text-slate-400 ml-1" /></div></div><div className="bg-white dark:bg-slate-800 border-t border-b border-slate-200 dark:border-slate-700"><SettingsMenuItem icon={Icons.UserCircle} label={t('driver_profile')} onClick={() => setSettingsView('PROFILE')} /><SettingsMenuItem icon={Icons.RotateCw} label={t('menu_smart_offers')} onClick={() => setSettingsView('OFFERS')} /><SettingsMenuItem icon={Icons.Bell} label={t('menu_notifications')} onClick={() => setSettingsView('NOTIFICATIONS')} /><SettingsMenuItem icon={Icons.Car} label={t('menu_vehicles')} onClick={() => setSettingsView('VEHICLES')} /><SettingsMenuItem icon={Icons.Info} label={t('menu_carrier')} onClick={() => setSettingsView('COMPANY')} /><SettingsMenuItem icon={Icons.MapPin} label={t('menu_area')} onClick={() => setSettingsView('ZONES')} /><SettingsMenuItem icon={Icons.DollarSign} label={t('menu_payout')} onClick={() => setSettingsView('PAYOUTS')} /><SettingsMenuItem icon={Icons.FileText} label={t('menu_reports')} onClick={() => setSettingsView('REPORTS')} /><SettingsMenuItem icon={Icons.Briefcase} label={t('menu_documents')} onClick={() => setSettingsView('DOCUMENTS')} /><SettingsMenuItem icon={Icons.Share} label={t('menu_invite')} onClick={() => setSettingsView('INVITE')} /><SettingsMenuItem icon={Icons.BookOpen} label={t('menu_app_info')} onClick={() => setSettingsView('INSTRUCTIONS')} /><SettingsMenuItem icon={Icons.HelpCircle} label={t('menu_help')} onClick={() => setSettingsView('SUPPORT')} /><SettingsMenuItem icon={Icons.Coins} label={t('currency')} value="AUD" onClick={() => setSettingsView('CURRENCY')} /><SettingsMenuItem icon={Icons.Ruler} label={t('units')} value="km" onClick={() => setSettingsView('DISTANCE')} /><SettingsMenuItem icon={Icons.Globe} label={t('language')} value="English" onClick={() => setSettingsView('LANGUAGE')} /></div><div className="p-6"><button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg transition-colors uppercase tracking-wide text-sm">{t('logout')}</button><p className="text-center text-xs text-slate-400 mt-4">Version 104.0.0 (7311)</p></div></div>);
          case 'PROFILE': return <ProfileSettingsView currentUser={currentUser} onSave={handleUpdateProfile} onBack={() => setSettingsView('MAIN')} />;
          case 'NOTIFICATIONS': return (
            <SettingsLayout title={t('notifications')} onBack={() => setSettingsView('MAIN')} footer={
                <div className="bg-white dark:bg-slate-800 z-20 shrink-0 p-4 pb-6">
                    <button 
                        onClick={() => { handleUpdateProfile({/*...notificationSettings*/}); setSettingsView('MAIN'); }} 
                        className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold py-4 rounded-full text-sm uppercase tracking-wide transition-colors shadow-lg mx-auto block"
                    >
                        {t('save')}
                    </button>
                </div>
            }>
                <div className="p-6 space-y-8">
                    {/* Vehicle Types Selector */}
                    <div>
                        <p className="text-sm text-slate-500 mb-2">{t('notifications_desc')}</p>
                        <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-lg text-slate-900 dark:text-white leading-tight">
                                {t('vehicle_types_list')}
                            </span>
                            <Icons.ChevronDown className="w-5 h-5 text-slate-900 dark:text-white shrink-0 ml-4" />
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-6">
                        <ToggleSwitch 
                            checked={notificationSettings.pushNewRequests} 
                            onChange={v => setNotificationSettings({...notificationSettings, pushNewRequests: v})} 
                            label={t('notify_push_new')} 
                        />
                        <ToggleSwitch 
                            checked={notificationSettings.emailNewRequests} 
                            onChange={v => setNotificationSettings({...notificationSettings, emailNewRequests: v})} 
                            label={t('notify_email_new')} 
                        />
                        <ToggleSwitch 
                            checked={notificationSettings.pushUrgent} 
                            onChange={v => setNotificationSettings({...notificationSettings, pushUrgent: v})} 
                            label={t('notify_push_urgent')} 
                        />
                        <ToggleSwitch 
                            checked={true} 
                            onChange={() => {}} 
                            label={t('notify_auto_offers')} 
                        />
                        <ToggleSwitch 
                            checked={true} 
                            onChange={() => {}} 
                            label={t('notify_24h_reminder')} 
                        />
                    </div>
                </div>
            </SettingsLayout>
          );
          case 'VEHICLES': return <SettingsLayout title={t('vehicles')} onBack={() => setSettingsView('MAIN')}><VehiclesView vehicles={myVehicles} onEdit={(id: string) => { setEditingVehicleId(id); setSettingsView('EDIT_VEHICLE'); }} onAdd={() => setSettingsView('CREATE_VEHICLE')} onDelete={handleDeleteVehicle} drivers={[currentUser, ...(currentUser.subDrivers || [])]} onUpdate={handleUpdateVehicle} /></SettingsLayout>;
          case 'CREATE_VEHICLE': return <CreateVehicleView onBack={() => setSettingsView('VEHICLES')} onSaveAndContinue={handleCreateAndContinue} />;
          case 'EDIT_VEHICLE': return <EditVehicleView vehicleId={editingVehicleId} vehicles={myVehicles} onSave={handleSaveEditedVehicle} onClose={() => setSettingsView('VEHICLES')} onDelete={() => { handleDeleteVehicle(editingVehicleId!); setSettingsView('VEHICLES'); setEditingVehicleId(null); }} />;
          case 'COMPANY': return <SettingsLayout title={t('company_profile')} onBack={() => setSettingsView('MAIN')} footer={<button onClick={() => handleUpdateProfile({ company: currentUser.company })} className="w-full bg-black text-white font-bold py-3 rounded-xl">{t('save')}</button>}><div className="p-6"><InputField label={t('placeholder_country')} value={currentUser.company?.country || ''} onChange={(v: string) => handleUpdateProfile({ company: {...currentUser.company, country: v} as CompanyProfile })} /><InputField label={t('placeholder_address')} value={currentUser.company?.registrationAddress || ''} onChange={(v: string) => handleUpdateProfile({ company: {...currentUser.company, registrationAddress: v} as CompanyProfile })} /></div></SettingsLayout>;
          case 'ZONES': return <ServiceZonesView onClose={() => setSettingsView('MAIN')} onSave={handleUpdateZonesNoExit} initialZones={currentUser.serviceZones} />;
          case 'PAYOUTS': return <PayoutsView currentUser={currentUser} onUpdate={handleUpdateProfile} onBack={() => setSettingsView('MAIN')} />;
          // Simple Wrappers
          case 'REPORTS': return <ReportsView onBack={() => setSettingsView('MAIN')} />;
          case 'INVITE': return <SettingsLayout title={t('invite')} onBack={() => setSettingsView('MAIN')}><div className="p-6 text-center text-slate-500">{t('coming_soon')}</div></SettingsLayout>;
          case 'DOCUMENTS': return <DocumentsView currentUser={currentUser} onBack={() => setSettingsView('MAIN')} />;
          case 'INSTRUCTIONS': return <SettingsLayout title={t('instructions')} onBack={() => setSettingsView('MAIN')}><div className="p-6 text-slate-600 dark:text-slate-300 space-y-4"><p>{t('instruction_1')}</p><p>{t('instruction_2')}</p><p>{t('instruction_3')}</p></div></SettingsLayout>;
          case 'SUPPORT': return <SettingsLayout title={t('support_title')} onBack={() => setSettingsView('MAIN')}><div className="p-6"><a href="mailto:drivers@tripfers.com" className="block p-4 bg-white dark:bg-slate-800 rounded-xl mb-4 border border-slate-200 dark:border-slate-700"><span className="font-bold dark:text-white">{t('email_support')}</span><p className="text-sm text-slate-500">drivers@tripfers.com</p></a></div></SettingsLayout>;
          case 'OFFERS': return <SettingsLayout title={t('smart_offers')} onBack={() => setSettingsView('MAIN')}><div className="p-6 text-center text-slate-500"><Icons.RotateCw className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>{t('coming_soon')}</p></div></SettingsLayout>;
          case 'CURRENCY': return <SettingsLayout title={t('currency')} onBack={() => setSettingsView('MAIN')}><div className="p-6"><p>{t('currency_placeholder')}</p></div></SettingsLayout>;
          case 'DISTANCE': return <SettingsLayout title={t('units')} onBack={() => setSettingsView('MAIN')}><div className="p-6"><p>{t('units_placeholder')}</p></div></SettingsLayout>;
          case 'LANGUAGE': return <SettingsLayout title={t('language')} onBack={() => setSettingsView('MAIN')}><div className="p-6"><p>{t('language_placeholder')}</p></div></SettingsLayout>;
          default: return null;
      }
  };

  const formatDateHeader = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  };
  
    // Helper to render child seat info
    const renderChildrenSeats = (children: { infant: number, convertible: number, booster: number } | undefined) => {
        if (!children) return null;
        const seats = [
            children.infant > 0 && `${children.infant} Infant Seat`,
            children.convertible > 0 && `${children.convertible} Convertible Seat`,
            children.booster > 0 && `${children.booster} Booster Seat`,
        ].filter(Boolean);

        if (seats.length === 0) return null;
        
        return (
            <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <Icons.Users className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="text-xs font-medium">{seats.join(', ')}</span>
            </div>
        );
    };

  return (
    <div className={`bg-slate-50 dark:bg-slate-900 min-h-screen relative safe-area-inset-bottom ${settingsView === 'ZONES' ? 'pb-0 overflow-hidden h-screen' : 'pb-24'}`}>
        <style>{`input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button {-webkit-appearance: none; margin: 0;} input[type=number] {-moz-appearance: textfield;}`}</style>
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        
        {/* Active Job Overlay */}
        {activeJob && (
            <div className="bg-red-600 text-white p-4 sticky top-0 z-50 shadow-lg animate-slide-up safe-area-inset-top">
            <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-lg flex items-center gap-2"><Icons.Navigation className="w-5 h-5"/> {t('active_ride')}</h3><span className="bg-white/20 px-2 py-1 rounded text-xs font-mono">{t('status_' + activeJob.status.toLowerCase())}</span></div><div className="mb-4"><p className="font-bold">{activeJob.pickup} → {activeJob.dropoff}</p><p className="text-sm opacity-80">{activeJob.clientName} • {activeJob.passengers} Pax</p></div><div className="grid grid-cols-2 gap-2 mb-4">{activeJob.status === JobStatus.ACCEPTED && (<button onClick={() => updateStatus(activeJob.id, JobStatus.DRIVER_EN_ROUTE)} className="bg-white text-red-600 font-bold py-2 rounded shadow-sm hover:bg-slate-100">{t('im_on_my_way')}</button>)}{activeJob.status === JobStatus.DRIVER_EN_ROUTE && (<button onClick={() => updateStatus(activeJob.id, JobStatus.DRIVER_ARRIVED)} className="bg-white text-red-600 font-bold py-2 rounded shadow-sm hover:bg-slate-100">{t('ive_arrived')}</button>)}{activeJob.status === JobStatus.DRIVER_ARRIVED && (<button onClick={() => updateStatus(activeJob.id, JobStatus.IN_PROGRESS)} className="bg-black text-white font-bold py-2 rounded shadow-sm hover:bg-slate-800">{t('start_trip')}</button>)}{activeJob.status === JobStatus.IN_PROGRESS && (<button onClick={() => updateStatus(activeJob.id, JobStatus.COMPLETED)} className="col-span-2 bg-slate-900 text-white font-bold py-2 rounded shadow-sm hover:bg-slate-800">{t('complete_trip')}</button>)}</div>
            </div>
        )}

        {/* 1. REQUESTS TAB */}
        {activeMainTab === 'requests' && (
            <div className="animate-fade-in">
                {/* SUB-HEADER */}
                <div className="sticky top-0 bg-white dark:bg-slate-900 z-30 shadow-sm">
                    <div className="flex p-2 gap-2 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setRequestsSubTab('NEW')}
                            className={`flex-1 min-w-[100px] py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wide ${requestsSubTab === 'NEW' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400'}`}
                        >
                            {t('new_requests')}
                        </button>
                        <button
                            onClick={() => setRequestsSubTab('OFFERS')}
                            className={`flex-1 min-w-[100px] py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wide ${requestsSubTab === 'OFFERS' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400'}`}
                        >
                            {t('with_offers')}
                        </button>
                         <button
                            onClick={() => setRequestsSubTab('SKIPPED')}
                            className={`flex-1 min-w-[100px] py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wide ${requestsSubTab === 'SKIPPED' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400'}`}
                        >
                            {t('skipped')}
                        </button>
                    </div>
                    <RequestsFilterPanel 
                        filters={requestFilters} 
                        onChange={setRequestFilters} 
                        onApply={() => setAppliedRequestFilters(requestFilters)}
                    />
                </div>

                <div className="p-4 space-y-4">
                     {(!currentUser.serviceZones || currentUser.serviceZones.length === 0) && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 p-4 rounded-xl flex items-start gap-3">
                            <Icons.Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-blue-800 dark:text-blue-200 font-bold text-sm mb-1">{t('set_service_zone')}</p>
                                <p className="text-blue-600 dark:text-blue-300 text-xs mb-3">{t('zone_not_defined_message')}</p>
                                <button onClick={() => { setActiveMainTab('settings'); setSettingsView('ZONES'); }} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold">{t('define_zone')}</button>
                            </div>
                        </div>
                    )}
                    
                    {!hasVehicles && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 p-4 rounded-xl text-center">
                            <p className="text-amber-800 dark:text-amber-200 font-bold mb-2">{t('vehicle_setup_required')}</p>
                            <p className="text-sm text-amber-600 dark:text-amber-300 mb-3">{t('vehicle_setup_message')}</p>
                            <button onClick={() => { setActiveMainTab('settings'); setSettingsView('VEHICLES'); }} className="bg-amber-600 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm">{t('add_vehicle')}</button>
                        </div>
                    )}

                    {filteredJobs.length === 0 ? (
                         <div className="text-center py-20 text-slate-400">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icons.Route className="w-8 h-8 text-slate-300" />
                            </div>
                            <p>{requestsSubTab === 'NEW' ? t('no_new_requests') : requestsSubTab === 'OFFERS' ? t('no_offers') : t('no_skipped_requests')}</p>
                        </div>
                    ) : (
                         filteredJobs.map(job => (
                            <div key={job.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 relative">
                                <div className="mb-4 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-slate-900 dark:text-white font-bold text-lg">{formatDateHeader(job.date)}</h3>
                                            {job.isUrgent && <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 animate-pulse"><Icons.Zap className="w-3 h-3 fill-white" /> {t('urgent')}</span>}
                                        </div>
                                        <div className="flex gap-2 items-center mt-1">
                                            <p className="text-slate-400 text-xs">#{job.id.substring(0,8)}</p>
                                            {/* FIX: `job.bookingType` is a string property and should not be called as a function. */}
                                            {job.bookingType && <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded uppercase border border-slate-200 dark:border-slate-600 text-slate-500">{t('booking_' + job.bookingType.toLowerCase())}</span>}
                                        </div>
                                    </div>
                                    {isSkipped(job.id) ? (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-500">{t('skipped')}</span>
                                    ) : (
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${job.status === 'PENDING' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{t('status_' + job.status.toLowerCase())}</span>
                                    )}
                                </div>
                                <div className="flex flex-col mb-4 relative">
                                    <div className="flex gap-3 relative z-10"><div className="flex flex-col items-center"><div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100 dark:ring-green-900/30"></div><div className="w-0.5 bg-slate-200 dark:bg-slate-700 h-full min-h-[24px] -my-1"></div></div><div className="flex-1 pb-3"><p className="text-base font-bold text-slate-900 dark:text-white leading-tight">{job.pickup}</p></div></div>
                                    <div className="flex gap-3 relative z-10"><div className="flex flex-col items-center pt-1"><div className="w-3 h-3 rounded-full bg-red-600 ring-4 ring-red-100 dark:ring-red-900/30"></div></div><div className="flex-1"><p className="text-base font-bold text-slate-900 dark:text-white leading-tight">{job.dropoff}</p></div></div>
                                </div>
                                <div className="flex items-center justify-between mb-5 border-t border-slate-100 dark:border-slate-700 pt-4">
                                    <div className="text-slate-700 dark:text-slate-300 font-medium text-sm flex items-center gap-2"><Icons.Car className="w-4 h-4"/> {t('vehicle_' + job.vehicleType.toLowerCase())}</div>
                                    <div className="flex items-center gap-3"><div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold text-xs"><Icons.User className="w-3.5 h-3.5" /> {job.passengers}</div><div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold text-xs"><Icons.ListFilter className="w-3.5 h-3.5" /> {job.luggage}</div></div>
                                </div>
                                
                                <div className="space-y-2 text-sm mb-5">
                                    {renderChildrenSeats(job.children)}
                                    {job.flightNumber && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            <Icons.Plane className="w-4 h-4 shrink-0" />
                                            <span className="text-xs font-medium">{t('flight')}: <strong>{job.flightNumber}</strong></span>
                                        </div>
                                    )}
                                     {job.nameSign && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            <Icons.User className="w-4 h-4 shrink-0" />
                                            <span className="text-xs font-medium">{t('name_sign')}: <strong>"{job.nameSign}"</strong></span>
                                        </div>
                                    )}
                                    {job.comment && (
                                        <div className="flex items-start gap-2 pt-2">
                                            <Icons.MessageSquare className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                                            <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-md border border-slate-200 dark:border-slate-700">{job.comment}</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* CARD ACTIONS */}
                                {requestsSubTab === 'SKIPPED' ? (
                                    <button 
                                        onClick={() => handleRestore(job.id)} 
                                        className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Icons.History className="w-5 h-5" />
                                        {t('restore_request')}
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleSkip(job.id)} className="w-12 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:text-red-600 text-slate-400 rounded-xl flex items-center justify-center transition-colors shadow-sm" title="Skip"><Icons.X className="w-5 h-5" /></button>
                                        
                                        {requestsSubTab === 'OFFERS' ? (
                                            <div className="flex-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-bold py-4 rounded-xl text-center text-sm border border-green-200 dark:border-green-800 flex items-center justify-center gap-2"><Icons.Check className="w-5 h-5" /> OFFER SENT</div>
                                        ) : (
                                            <button onClick={() => setSelectedJobForOffer(job)} className="flex-1 bg-black hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-md transition-all active:scale-[0.98] text-sm tracking-wide uppercase">OFFER PRICE</button>
                                        )}
                                    </div>
                                )}

                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* 2. RIDES TAB */}
        {activeMainTab === 'rides' && (
            <div className="animate-fade-in">
                 {/* SUB-HEADER */}
                <div className="sticky top-0 bg-white dark:bg-slate-900 z-30 shadow-sm border-b border-slate-200 dark:border-slate-800">
                    <div className="flex">
                        <button onClick={() => setRidesSubTab('SCHEDULED')} className={`flex-1 py-4 text-xs font-bold border-b-2 transition-colors uppercase tracking-wide ${ridesSubTab === 'SCHEDULED' ? 'border-black text-black dark:border-white dark:text-white' : 'border-transparent text-slate-500'}`}>{t('scheduled')}</button>
                        <button onClick={() => setRidesSubTab('PAST')} className={`flex-1 py-4 text-xs font-bold border-b-2 transition-colors uppercase tracking-wide ${ridesSubTab === 'PAST' ? 'border-black text-black dark:border-white dark:text-white' : 'border-transparent text-slate-500'}`}>{t('past')}</button>
                        <button onClick={() => setRidesSubTab('CALENDAR')} className={`flex-1 py-4 text-xs font-bold border-b-2 transition-colors uppercase tracking-wide ${ridesSubTab === 'CALENDAR' ? 'border-black text-black dark:border-white dark:text-white' : 'border-transparent text-slate-500'}`}>{t('calendar')}</button>
                    </div>
                </div>
                
                <div className="p-4 space-y-4">
                    {ridesSubTab === 'CALENDAR' ? (
                        <>
                            <CalendarView jobs={filteredJobs} onSelectDate={setCalendarSelectedDate} selectedDate={calendarSelectedDate} />
                            {calendarSelectedDate && (
                                <div className="mt-4">
                                    <h4 className="font-bold text-slate-500 uppercase text-xs mb-3">{t('trips_on')} {calendarSelectedDate}</h4>
                                    {filteredJobs.length === 0 ? <p className="text-slate-400 text-sm">{t('no_trips_date')}</p> : null}
                                </div>
                            )}
                            {/* If calendar selected date, filteredJobs is already filtered by date in useMemo */}
                             {calendarSelectedDate && filteredJobs.map(job => (
                                <div key={job.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-4">
                                     <div className="flex justify-between items-start mb-2">
                                         <h3 className="font-bold dark:text-white">{job.pickup}</h3>
                                         <span className="text-xs bg-slate-100 px-2 py-1 rounded font-bold">{job.status}</span>
                                     </div>
                                     <p className="text-sm text-slate-500">{t('trip_to')} {job.dropoff}</p>
                                     <p className="text-xs text-slate-400 mt-2">{new Date(job.date).toLocaleTimeString()}</p>
                                </div>
                             ))}
                        </>
                    ) : (
                        <>
                           {filteredJobs.length === 0 ? (
                                <div className="text-center py-20 text-slate-400">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4"><Icons.Calendar className="w-8 h-8 text-slate-300" /></div>
                                    <p>{ridesSubTab === 'SCHEDULED' ? t('no_scheduled_rides') : t('no_past_rides')}</p>
                                </div>
                           ) : (
                                filteredJobs.map(job => (
                                    <div key={job.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                                        <div className="mb-4 flex justify-between items-start">
                                            <div>
                                                <h3 className="text-slate-900 dark:text-white font-bold text-lg">{formatDateHeader(job.date)}</h3>
                                                <p className="text-slate-400 text-xs">#{job.id.substring(0,8)}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${job.status === 'COMPLETED' ? 'bg-slate-100 text-slate-800' : 'bg-blue-100 text-blue-800'}`}>{t('status_' + job.status.toLowerCase())}</span>
                                        </div>
                                        <div className="flex flex-col mb-4 relative">
                                            <div className="flex gap-3 relative z-10"><div className="flex flex-col items-center"><div className="w-3 h-3 rounded-full bg-green-500"></div><div className="w-0.5 bg-slate-200 dark:bg-slate-700 h-full min-h-[24px] -my-1"></div></div><div className="flex-1 pb-3"><p className="text-base font-bold text-slate-900 dark:text-white leading-tight">{job.pickup}</p></div></div>
                                            <div className="flex gap-3 relative z-10"><div className="flex flex-col items-center pt-1"><div className="w-3 h-3 rounded-full bg-red-600"></div></div><div className="flex-1"><p className="text-base font-bold text-slate-900 dark:text-white leading-tight">{job.dropoff}</p></div></div>
                                        </div>
                                        <div className="space-y-3 text-sm mb-5 border-t border-slate-100 dark:border-slate-700 pt-4">
                                            <div className="flex items-center gap-2"><Icons.User className="w-4 h-4"/> <span className="font-medium">{job.clientName}</span></div>
                                            {renderChildrenSeats(job.children)}
                                            {job.comment && (
                                                <div className="flex items-start gap-2 pt-1">
                                                    <Icons.MessageSquare className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                                                    <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-md border border-slate-200 dark:border-slate-700">{job.comment}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700 pt-3">
                                            <div className="flex items-center gap-1 font-bold text-green-600"><Icons.DollarSign className="w-4 h-4"/> {job.price}</div>
                                        </div>
                                        {ridesSubTab === 'SCHEDULED' && <button onClick={() => setActiveMainTab('chats')} className="w-full mt-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white font-bold py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600">{t('open_chat')}</button>}
                                    </div>
                                ))
                           )}
                        </>
                    )}
                </div>
            </div>
        )}

        {/* 3. CHATS TAB */}
        {activeMainTab === 'chats' && (<div className="p-4 space-y-4 animate-fade-in"><h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('messages')}</h2>{filteredJobs.length === 0 ? (<div className="text-center py-20 text-slate-400"><Icons.MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>{t('no_conversations')}</p></div>) : (filteredJobs.map(job => (<div key={job.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4"><div className="flex justify-between items-center mb-2"><h4 className="font-bold text-slate-900 dark:text-white text-sm">{job.clientName || 'Client'}</h4><span className="text-xs text-green-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> {t('online')}</span></div><div className="h-80 md:h-96 border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden"><ChatWindow jobId={job.id} currentUser={currentUser} otherUserName={job.clientName} /></div></div>)))}</div>)}
        
        {/* 4. SETTINGS TAB */}
        {activeMainTab === 'settings' && renderSettingsContent()}
        
        {/* FOOTER NAV (Mobile Optimized) */}
        {settingsView !== 'ZONES' && (
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 pb-safe z-40 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                <div className="flex justify-around items-center p-2">
                    <button onClick={() => handleNavigation(() => setActiveMainTab('requests'))} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeMainTab === 'requests' ? 'text-red-600 -translate-y-1' : 'text-slate-400'}`}>
                        <Icons.ListFilter className="w-6 h-6" />
                        <span className="text-[10px] font-bold">{t('nav_requests')}</span>
                    </button>
                    <button onClick={() => handleNavigation(() => setActiveMainTab('rides'))} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeMainTab === 'rides' ? 'text-red-600 -translate-y-1' : 'text-slate-400'}`}>
                        <Icons.Car className="w-6 h-6" />
                        <span className="text-[10px] font-bold">{t('nav_rides')}</span>
                    </button>
                    <button onClick={() => handleNavigation(() => setActiveMainTab('chats'))} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeMainTab === 'chats' ? 'text-red-600 -translate-y-1' : 'text-slate-400'}`}>
                        <Icons.MessageCircle className="w-6 h-6" />
                        <span className="text-[10px] font-bold">{t('nav_chats')}</span>
                    </button>
                    <button onClick={() => handleNavigation(() => setActiveMainTab('settings'))} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeMainTab === 'settings' ? 'text-amber-500 -translate-y-1' : 'text-slate-400'}`}>
                        <Icons.Settings className="w-6 h-6" />
                        <span className="text-[10px] font-bold flex items-center gap-0.5">
                            <Icons.Star className="w-3 h-3 fill-amber-500 stroke-none" /> 5.0
                        </span>
                    </button>
                </div>
            </div>
        )}
        
        {showUnsavedModal && (
            <ConfirmationModal
                title="Unsaved Changes"
                message="You have unsaved changes in your settings. Are you sure you want to leave without saving?"
                confirmText="Discard Changes"
                cancelText="Keep Editing"
                onConfirm={confirmNavigation}
                onCancel={() => setShowUnsavedModal(false)}
            />
        )}
        
        {selectedJobForOffer && (<OfferDetailsModal job={selectedJobForOffer} onClose={() => setSelectedJobForOffer(null)} onOffer={submitBid} onSkip={handleSkip} thresholds={thresholds} />)}
    </div>
  );
};
