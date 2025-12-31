

// FIX: Add a global type declaration for `window.google` to inform TypeScript
// that this property will exist at runtime after the Google Maps script is loaded.
declare global {
  interface Window {
    google: any;
  }
}

export enum UserRole {
  CLIENT = 'CLIENT',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN', // Super Admin
  ADMIN_SUPPORT = 'ADMIN_SUPPORT',
  ADMIN_FINANCE = 'ADMIN_FINANCE',
  GUEST = 'GUEST'
}

export enum JobStatus {
  PENDING = 'PENDING',
  BIDDING = 'BIDDING',
  ACCEPTED = 'ACCEPTED',
  
  // New granular statuses for active rides
  DRIVER_EN_ROUTE = 'DRIVER_EN_ROUTE',
  DRIVER_ARRIVED = 'DRIVER_ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
  REJECTED = 'REJECTED'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE', // Verified and active
  PENDING_VERIFICATION = 'PENDING_VERIFICATION', // Driver awaiting admin approval
  PROCESSING = 'PROCESSING', // Admin is working on it
  SUSPENDED = 'SUSPENDED', // Blocked by admin
  REJECTED = 'REJECTED'
}

export type BookingType = 'DISTANCE' | 'HOURLY' | 'DELIVERY';

export interface VehiclePhoto {
  id: string;
  url: string; // Base64 or URL
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isDefault: boolean;
}

export interface SubDriver {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  photo?: string;
}

export interface VehicleSettings {
  id: string;
  make: string;
  model: string;
  year: string;
  color: string;
  plate: string;
  maxPassengers: number;
  maxLuggage: number;
  maxCarryOn: number;
  type: string;
  photos: VehiclePhoto[];
  features: {
    wifi: boolean;
    water: boolean;
    charger: boolean;
    accessible: boolean;
    childSeat: boolean;
  };
  autoCancelOffers: boolean;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  defaultDriverId?: string;
}

export interface CompanyProfile {
  country: string;
  ownershipType: 'Individual' | 'Company';
  taxId: string;
  driverLanguages: string[]; // e.g. ['English', 'Spanish']
  registrationAddress: string;
  postalCode: string;
  baseLocation: string; // e.g. "Gold Coast Airport"
}

// New Document Types
export type DocumentType = 
  | 'LICENSE_SELFIE' 
  | 'VRC' 
  | 'VRC_PHOTO' 
  | 'INSURANCE' 
  | 'TRANSPORT_LICENSE';

export interface DriverDocument {
  id: string;
  type: DocumentType;
  url: string; // Base64 or URL
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  uploadedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  rating?: number;
  isMember?: boolean;
  joinDate?: string;
  vehicles?: VehicleSettings[]; // Changed to array for multi-vehicle support
  subDrivers?: SubDriver[]; // Additional drivers managed by this account
  skippedJobIds?: string[]; // Track skipped jobs
  serviceZones?: any[]; // Driver's operating areas (polygons/circles)
  
  // Detailed Profile Info
  company?: CompanyProfile;
  paypalEmail?: string;
  paymentVerificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NONE';

  // Updated Documents Structure
  documents?: DriverDocument[];
  
  notes?: string; // Admin notes
  totalSpent?: number; // For Clients
  totalEarnings?: number; // For Drivers
  totalTrips?: number; // For Drivers (Experience)
  balance?: number; // Current wallet balance
}

export interface Bid {
  id: string;
  driverId: string;
  driverName: string;
  amount: number;
  vehicleDescription: string;
  rating: number;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  jobId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isSystem?: boolean; // For "Driver Arrived" messages etc.
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Job {
  id: string;
  clientId: string;
  clientName: string;
  pickup: string;
  pickupCoordinates?: Coordinates; // For geospatial filtering
  dropoff?: string; // Optional for Hourly
  dropoffCoordinates?: Coordinates;
  stops?: string[]; // Intermediate stops
  date: string;
  
  // New Fields
  bookingType?: BookingType;
  durationHours?: number; // For Hourly
  returnDate?: string;
  returnTime?: string;
  isReturnTrip?: boolean;
  isUrgent?: boolean; // New Urgent Flag

  passengers: number;
  luggage: number;
  carryOn?: number;
  distanceKm: number;
  status: JobStatus;
  bids: Bid[];
  selectedBidId?: string;
  price?: number; // Final price
  
  // Detailed booking fields
  children?: {
    infant: number;
    convertible: number;
    booster: number;
  };
  needsWifi?: boolean;
  needsEnglish?: boolean;
  comment?: string;
  flightNumber?: string;
  nameSign?: string;
  promoCode?: string;
  vehicleType?: string; // e.g., 'Economy', 'SUV'
  plate?: string; // Optional: Assigned vehicle plate
  
  // Admin / System
  createdAt: string;
  driverId?: string;
  driverName?: string;
  adminNotes?: string;
  messages?: ChatMessage[];
  disputeReason?: string; // If status is DISPUTED
}

export interface DriverFilter {
  minPax: number;
  maxPax: number;
  startDate: string;
  endDate: string;
  noCompetitors: boolean;
  onlyUrgent: boolean; // < 24 hours
  showSkipped: boolean; 
}

export interface IntegrationsConfig {
  // Admin Info
  primaryAdminEmail: string;

  // Service Keys
  googleMapsKey: string;
  googleGeminiKey: string; // Added Gemini
  flightAwareKey: string; // Aero API Key
  
  // Stripe
  stripePublishableKey: string;
  stripeSecretKey: string;
  
  // Twilio
  adminMobileNumber: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioMessagingServiceSid: string;
  twilioFromNumber: string;
  twilioEnabled: boolean; // Toggle
  
  // URL
  publicUrl: string;
  
  // Legacy / Other
  stripeKey?: string; // deprecated
  stripePublishedKey?: string; // deprecated
  firebaseKey?: string;
  twilioSid?: string; // deprecated
}

export interface AdminBadgeSettings {
  showTripsBadge: boolean;
  showRequestBadge: boolean;
  showUpcomingBadge: boolean;
  showCompleteBadge: boolean;
}

export interface AnalyticsData {
  name: string;
  value: number;
}

// --- NEW ADMIN MODULE TYPES ---

export interface PricingConfig {
  baseFare: number;
  tier1Rate: number; // 0-10km
  tier2Rate: number; // 10-100km
  tier3Rate: number; // 100-250km
  tier4Rate: number; // 250km+
  multipliers: {
    [key: string]: number; // 'Economy': 1.0, etc.
  };
  enablePeakPricing: boolean;
  peakMultiplier: number;
  enableWeekendPricing: boolean;
  weekendMultiplier: number;
  commissionRate?: number;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  value: number;
  maxUses: number;
  usedCount: number;
  expiryDate: string;
  isActive: boolean;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'PAYMENT' | 'DRIVER' | 'CLIENT' | 'TECH' | 'OTHER';
  createdAt: string;
  messages: {
    sender: 'USER' | 'ADMIN';
    text: string;
    timestamp: string;
  }[];
}

export interface Transaction {
  id: string;
  userId: string; // Client or Driver
  jobId?: string;
  type: 'PAYMENT' | 'REFUND' | 'PAYOUT' | 'MEMBERSHIP' | 'COMMISSION';
  amount: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  date: string;
  description: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string; // e.g., "OVERRIDE_PRICE", "BAN_USER"
  targetId?: string; // JobID or UserID
  details: string;
  timestamp: string;
  ip: string;
}

export interface SystemNotification {
  id: string;
  type: 'PUSH' | 'EMAIL' | 'SMS';
  targetRole: 'ALL' | 'CLIENT' | 'DRIVER';
  title: string;
  message: string;
  sentAt: string;
  status: 'SENT' | 'FAILED';
}

export interface PricingThresholds {
  highAlertPercent: number; // Red (High)
  lowAlertPercent: number;  // Red (Low)
  fairOfferPercent: number; // Blue
  goodOfferPercent: number; // Green
}

export interface SupportSettings {
  financeEmail: string;
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
}