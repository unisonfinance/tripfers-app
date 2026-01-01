import { 
    User, UserRole, Job, JobStatus, Bid, IntegrationsConfig, UserStatus, 
    VehicleSettings, PricingConfig, SupportTicket, Transaction, AuditLog, 
    SystemNotification, ChatMessage, PromoCode, AdminBadgeSettings, 
    PricingThresholds, SupportSettings, DocumentType, DriverDocument, BrandingSettings 
} from '../types';
import { 
    collection, doc, setDoc, getDoc, updateDoc, deleteDoc, 
    onSnapshot, query, where, orderBy, getDocs, Timestamp, 
    addDoc 
} from "firebase/firestore";
import { 
    signInWithEmailAndPassword, createUserWithEmailAndPassword, 
    signOut, onAuthStateChanged 
} from "firebase/auth";
import { auth, db } from './firebase';

// --- HELPER FUNCTIONS ---

// Ray-casting algorithm for Point-in-Polygon
function isPointInPolygon(point: {lat: number, lng: number}, vs: {lat: number, lng: number}[]) {
    const x = point.lng, y = point.lat;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i].lng, yi = vs[i].lat;
        const xj = vs[j].lng, yj = vs[j].lat;
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Helper to convert Firestore timestamps to ISO strings
const convertTimestamps = (data: any): any => {
    if (!data) return data;
    if (data instanceof Timestamp) {
        return data.toDate().toISOString();
    }
    if (Array.isArray(data)) {
        return data.map(convertTimestamps);
    }
    if (typeof data === 'object') {
        const newData: any = {};
        for (const key in data) {
            newData[key] = convertTimestamps(data[key]);
        }
        return newData;
    }
    return data;
};

// --- REAL BACKEND SERVICE ---

class BackendService {
    private users: User[] = [];
    private jobs: Job[] = [];
    private pricing: PricingConfig = {
        baseFare: 2,
        tier1Rate: 4.60,
        tier2Rate: 2.20,
        tier3Rate: 1.80,
        tier4Rate: 1.10,
        multipliers: { Economy: 1.0, Comfort: 1.15, Business: 1.25, Premium: 1.40, VIP: 2.50, SUV: 1.30, Van: 1.20, Minibus: 1.90, Bus: 3.50 },
        enablePeakPricing: false,
        peakMultiplier: 1.25,
        enableWeekendPricing: false,
        weekendMultiplier: 1.10
    };
    private thresholds: PricingThresholds | null = null;
    private supportSettings: SupportSettings | null = null;
    private badgeSettings: AdminBadgeSettings | null = null;
    private brandingSettings: BrandingSettings | null = null;
    private tickets: SupportTicket[] = [];
    private transactions: Transaction[] = [];
    private auditLogs: AuditLog[] = [];
    private notifications: SystemNotification[] = [];
    private promoCodes: PromoCode[] = [];
    
    private integrations: IntegrationsConfig | null = null;
    
    private listeners: (() => void)[] = [];
    private unsubscribes: (() => void)[] = [];
    
    private currentUser: User | null = null;
    private currentUserKey = 'tripfers_current_user';

    constructor() {
        console.log("Initializing Real Backend (Firebase)...");
        this.initRealtimeSync();
        this.initAuthListener();
    }

    private initAuthListener() {
        onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    this.currentUser = convertTimestamps({ id: userDoc.id, ...userDoc.data() }) as User;
                    localStorage.setItem(this.currentUserKey, JSON.stringify(this.currentUser));
                }
            } else {
                this.currentUser = null;
                localStorage.removeItem(this.currentUserKey);
            }
            this.notifyListeners();
        });
    }

    private initRealtimeSync() {
        // Sync Users
        this.unsubscribes.push(onSnapshot(collection(db, 'users'), (snapshot) => {
            this.users = snapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() })) as User[];
            this.notifyListeners();
        }));

        // Sync Jobs
        this.unsubscribes.push(onSnapshot(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')), (snapshot) => {
            this.jobs = snapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() })) as Job[];
            this.notifyListeners();
        }));

        // Sync Tickets
        this.unsubscribes.push(onSnapshot(collection(db, 'tickets'), (snapshot) => {
            this.tickets = snapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() })) as SupportTicket[];
            this.notifyListeners();
        }));

        // Sync Settings
        this.unsubscribes.push(onSnapshot(doc(db, 'settings', 'pricing'), (doc) => {
            if (doc.exists()) this.pricing = doc.data() as PricingConfig;
            this.notifyListeners();
        }));

        // Sync Thresholds
        this.unsubscribes.push(onSnapshot(doc(db, 'settings', 'thresholds'), (doc) => {
            if (doc.exists()) this.thresholds = doc.data() as PricingThresholds;
            this.notifyListeners();
        }));

        // Sync Support Settings
        this.unsubscribes.push(onSnapshot(doc(db, 'settings', 'support'), (doc) => {
            if (doc.exists()) this.supportSettings = doc.data() as SupportSettings;
            this.notifyListeners();
        }));

        // Sync Badge Settings
        this.unsubscribes.push(onSnapshot(doc(db, 'settings', 'badges'), (doc) => {
            if (doc.exists()) this.badgeSettings = doc.data() as AdminBadgeSettings;
            this.notifyListeners();
        }));

        // Sync Branding Settings
        this.unsubscribes.push(onSnapshot(doc(db, 'settings', 'branding'), (doc) => {
            if (doc.exists()) this.brandingSettings = doc.data() as BrandingSettings;
            this.notifyListeners();
        }));
        
        // Sync Integrations
        this.unsubscribes.push(onSnapshot(doc(db, 'settings', 'integrations'), (doc) => {
            if (doc.exists()) this.integrations = doc.data() as IntegrationsConfig;
            this.notifyListeners();
        }));

        // Sync Promo Codes
        this.unsubscribes.push(onSnapshot(collection(db, 'promo_codes'), (snapshot) => {
            this.promoCodes = snapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() })) as PromoCode[];
            this.notifyListeners();
        }));
    }

    subscribe(listener: () => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener());
    }

    // --- AUTH ---
    getCurrentUser(): User | null {
        if (typeof window === 'undefined') return null;
        // Try memory first, then localStorage (for page refreshes before auth loads)
        if (this.currentUser) return this.currentUser;
        const stored = localStorage.getItem(this.currentUserKey);
        try {
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    }

    async getUser(userId: string): Promise<User | undefined> {
        return this.users.find(u => u.id === userId);
    }

    async login(email: string, pass: string, role: UserRole = UserRole.CLIENT, name?: string) {
        // ADMIN LOGIN OVERRIDE
        if (role === UserRole.ADMIN) {
            // Check hardcoded credentials first
            if (email === 'jclott77@gmail.com' && pass === 'Corina77&&') {
                // Ensure admin exists in DB
                let adminUser = this.users.find(u => u.email === email && u.role === UserRole.ADMIN);
                if (!adminUser) {
                    // Auto-create if missing (recovery)
                    adminUser = {
                        id: 'admin_master',
                        name: 'Super Admin',
                        email: email,
                        role: UserRole.ADMIN,
                        status: UserStatus.ACTIVE,
                        joinDate: new Date().toISOString()
                    };
                    // Save to DB
                    await setDoc(doc(db, 'users', adminUser.id), adminUser);
                    this.users.push(adminUser);
                }
                
                // Set current user
                this.currentUser = adminUser;
                localStorage.setItem(this.currentUserKey, JSON.stringify(adminUser));
                this.notifyListeners();
                return adminUser;
            } else {
                // Invalid admin credentials
                throw { code: 'auth/invalid-credential', message: 'Invalid email or password.' };
            }
        }

        // STANDARD FIREBASE LOGIN (Client/Driver)
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            // ... fetch user profile ...
            const docRef = doc(db, "users", userCredential.user.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const userData = docSnap.data() as User;
                this.currentUser = userData;
                localStorage.setItem(this.currentUserKey, JSON.stringify(userData));
                this.notifyListeners();
                return userData;
            } else {
                // Handle case where auth exists but profile missing
                throw { code: 'auth/user-not-found', message: 'User profile not found.' };
            }
        } catch (error: any) {
            console.error("Login error:", error);
            throw error;
        }
    }

    async register(email: string, password: string, name: string, role: UserRole): Promise<User> {
        try {
            // STRICT ENFORCEMENT: Only jclott77@gmail.com can be ADMIN
            if (role === UserRole.ADMIN && email !== 'jclott77@gmail.com') {
                throw new Error("Unauthorized: Account creation restricted.");
            }

            const result = await createUserWithEmailAndPassword(auth, email, password);
            const newUser: User = {
                id: result.user.uid,
                name, email, role,
                status: role === UserRole.DRIVER ? UserStatus.PENDING_VERIFICATION : UserStatus.ACTIVE,
                rating: 5.0,
                joinDate: new Date().toISOString(),
                vehicles: [],
                skippedJobIds: [],
                documents: [],
                totalTrips: 0,
                balance: 0,
                totalEarnings: 0
            };
            await setDoc(doc(db, 'users', newUser.id), newUser);
            this.currentUser = newUser;
            return newUser;
        } catch (error) {
            console.error("Register failed:", error);
            throw error;
        }
    }

    async logout() {
        await signOut(auth);
        this.currentUser = null;
        localStorage.removeItem(this.currentUserKey);
        this.notifyListeners();
    }

    // --- JOBS ---
    async getJobs(role: UserRole, userId?: string): Promise<Job[]> {
        const allJobs = this.jobs;
        
        if (role === UserRole.ADMIN) return allJobs;
        
        if (role === UserRole.DRIVER) {
             const driver = this.users.find(u => u.id === userId);
             const maxPax = driver?.vehicles?.length ? Math.max(...driver.vehicles.map(v => v.maxPassengers)) : 100;
             
             return allJobs.filter(j => {
                 if (j.driverId === userId) return true;
                 if (j.status === JobStatus.CANCELLED) return false;
                 if (j.bids?.some(b => b.driverId === userId)) return true;
                 
                 if (j.status === JobStatus.PENDING || j.status === JobStatus.BIDDING) {
                     if (j.passengers > maxPax) return false;
                     // Zone Check
                     if (driver?.serviceZones && driver.serviceZones.length > 0 && j.pickupCoordinates) {
                         let isInZone = false;
                         for (const zone of driver.serviceZones) {
                             if (zone.type === 'polygon' && zone.path) {
                                 if (isPointInPolygon(j.pickupCoordinates, zone.path)) {
                                     isInZone = true;
                                     break;
                                 }
                             }
                         }
                         if (!isInZone) return false;
                     }
                     return true;
                 }
                 return false;
             });
        }
        
        return allJobs.filter(j => j.clientId === userId);
    }

    async createJob(jobData: Partial<Job>): Promise<Job> {
        const newJobRef = doc(collection(db, 'bookings'));
        const newJob = {
            id: newJobRef.id,
            status: JobStatus.PENDING,
            bids: [],
            distanceKm: 0,
            passengers: 1,
            luggage: 0,
            createdAt: new Date().toISOString(),
            messages: [],
            isUrgent: false,
            ...jobData
        } as Job;
        await setDoc(newJobRef, newJob);
        return newJob;
    }

    async updateJob(jobId: string, updates: Partial<Job>): Promise<Job> {
        await updateDoc(doc(db, 'bookings', jobId), updates);
        return { ...this.jobs.find(j => j.id === jobId), ...updates } as Job;
    }

    async updateJobStatus(jobId: string, status: JobStatus): Promise<Job> {
        await updateDoc(doc(db, 'bookings', jobId), { status });
        
        if (status === JobStatus.COMPLETED) {
            const job = this.jobs.find(j => j.id === jobId);
            if (job && job.driverId && job.price) {
                const driver = this.users.find(u => u.id === job.driverId);
                if (driver) {
                    const commission = job.price * (this.pricing.commissionRate || 0.295); 
                    const net = job.price - commission;
                    
                    // Update Driver Balance
                    await updateDoc(doc(db, 'users', driver.id), {
                        balance: (driver.balance || 0) + net,
                        totalEarnings: (driver.totalEarnings || 0) + net,
                        totalTrips: (driver.totalTrips || 0) + 1
                    });

                    // Log Transaction
                    await addDoc(collection(db, 'transactions'), {
                        userId: 'system',
                        type: 'COMMISSION',
                        amount: commission,
                        status: 'SUCCESS',
                        date: new Date().toISOString(),
                        description: `Commission for Trip #${job.id}`
                    });
                }
            }
        }
        return this.jobs.find(j => j.id === jobId)!;
    }

    async placeBid(jobId: string, bid: Partial<Bid>): Promise<Job> {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) throw new Error("Job not found");
        
        const newBid = { 
            id: Math.random().toString(36).substr(2,9), 
            timestamp: new Date().toISOString(), 
            ...bid 
        };
        const updatedBids = [...(job.bids || []), newBid];
        
        await updateDoc(doc(db, 'bookings', jobId), {
            bids: updatedBids,
            status: JobStatus.BIDDING
        });
        return { ...job, bids: updatedBids, status: JobStatus.BIDDING } as Job;
    }

    async acceptBid(jobId: string, bidId: string): Promise<Job> {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) throw new Error("Job not found");
        const bid = job.bids?.find(b => b.id === bidId);
        if (!bid) throw new Error("Bid not found");

        const updates = {
            status: JobStatus.ACCEPTED,
            driverId: bid.driverId,
            driverName: bid.driverName,
            price: bid.amount,
            selectedBidId: bidId
        };
        await updateDoc(doc(db, 'bookings', jobId), updates);
        return { ...job, ...updates } as Job;
    }

    // --- USERS ---
    async updateUserStatus(userId: string, status: UserStatus): Promise<User> {
        await updateDoc(doc(db, 'users', userId), { status });
        return this.users.find(u => u.id === userId)!;
    }
    
    async adminUpdateUserInfo(userId: string, data: Partial<User>): Promise<User> {
        // Handle nested Documents update carefully if needed, but simple merge for now
        await updateDoc(doc(db, 'users', userId), data);
        return this.users.find(u => u.id === userId)!;
    }

    // --- DOCUMENTS ---
    async uploadDocument(userId: string, type: DocumentType, file: File): Promise<DriverDocument> {
        const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
           const reader = new FileReader();
           reader.readAsDataURL(file);
           reader.onload = () => resolve(reader.result as string);
           reader.onerror = error => reject(error);
       });
       const base64Url = await toBase64(file);

       const newDoc: DriverDocument = {
           id: 'doc_' + Math.random().toString(36).substr(2, 9),
           type,
           url: base64Url,
           status: 'PENDING',
           uploadedAt: new Date().toISOString()
       };

       const user = this.users.find(u => u.id === userId);
       if (user) {
           const currentDocs = user.documents?.filter(d => d.type !== type) || [];
           await updateDoc(doc(db, 'users', userId), {
               documents: [...currentDocs, newDoc]
           });
       }
       return newDoc;
    }
    
    async adminUpdateDocumentStatus(userId: string, docId: string, status: 'APPROVED' | 'REJECTED', reason?: string): Promise<void> {
        const user = this.users.find(u => u.id === userId);
        if (user && user.documents) {
            const newDocs = user.documents.map(d => 
                d.id === docId ? { ...d, status, rejectionReason: reason } : d
            );
            await updateDoc(doc(db, 'users', userId), { documents: newDocs });
        }
    }

    // --- MISC / ADMIN ---
    async getPricingConfig() { return this.pricing || {} as PricingConfig; }
    async updatePricingConfig(config: PricingConfig) { 
        await setDoc(doc(db, 'settings', 'pricing'), config);
    }

    async adminApprovePaymentDetails(userId: string, status: 'APPROVED' | 'REJECTED') {
         await updateDoc(doc(db, 'users', userId), { paymentVerificationStatus: status });
         return this.users.find(u => u.id === userId)!;
    }

    async sendMessage(jobId: string, senderId: string, text: string): Promise<ChatMessage> {
        const job = this.jobs.find(j => j.id === jobId);
        const sender = this.users.find(u => u.id === senderId);
        const msg: ChatMessage = {
             id: Math.random().toString(),
             jobId, 
             senderId, 
             senderName: sender?.name || 'User', 
             text, 
             timestamp: new Date().toISOString()
        };
        const messages = [...(job?.messages || []), msg];
        await updateDoc(doc(db, 'bookings', jobId), { messages });
        return msg;
    }

    async getStats() {
        // Real-time calculation from synced data
        const safeJobs = this.jobs;
        // Filter out the main admin from total users count
        const nonAdminUsers = this.users.filter(u => u.email !== 'jclott77@gmail.com');
        
        return {
          totalUsers: nonAdminUsers.length,
          totalJobs: safeJobs.length,
          revenue: safeJobs.filter(j => j.status === JobStatus.COMPLETED).reduce((acc, j) => acc + (j.price || 0) * 0.295, 0),
          activeDrivers: nonAdminUsers.filter(u => u.role === UserRole.DRIVER && u.status === UserStatus.ACTIVE).length,
          todayBookings: safeJobs.filter(j => new Date(j.createdAt).getDate() === new Date().getDate()).length,
          activeDisputes: safeJobs.filter(j => j.status === JobStatus.DISPUTED).length
        };
    }

    // --- STRIPE ---
    async getIntegrations() { 
        // 1. Try to fetch from Firestore settings
        if (!this.integrations) {
            try {
                const docRef = await getDoc(doc(db, 'settings', 'integrations'));
                if (docRef.exists()) {
                    this.integrations = docRef.data() as IntegrationsConfig;
                } else {
                     // Fallback defaults and SAVE them so next time it exists
                     this.integrations = { 
                         primaryAdminEmail: 'jclott77@gmail.com',
                         googleMapsKey: '', 
                         googleGeminiKey: '',
                         stripePublishableKey: '', 
                         stripeSecretKey: '',
                         flightAwareKey: '',
                         adminMobileNumber: '',
                         twilioAccountSid: '',
                         twilioAuthToken: '',
                         twilioMessagingServiceSid: '',
                         twilioFromNumber: '',
                         twilioEnabled: false,
                         publicUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
                     };
                     await setDoc(doc(db, 'settings', 'integrations'), this.integrations);
                }
            } catch (error) {
                console.error("Error fetching integrations:", error);
                // Return defaults on error to avoid breaking UI
                return { 
                     primaryAdminEmail: 'jclott77@gmail.com',
                     googleMapsKey: '', 
                     googleGeminiKey: '',
                     stripePublishableKey: '', 
                     stripeSecretKey: '',
                     flightAwareKey: '',
                     adminMobileNumber: '',
                     twilioAccountSid: '',
                     twilioAuthToken: '',
                     twilioMessagingServiceSid: '',
                     twilioFromNumber: '',
                     twilioEnabled: false,
                     publicUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
                 } as IntegrationsConfig;
            }
        }
        return this.integrations; 
    }

    async updateIntegrations(config: IntegrationsConfig) {
        this.integrations = config;
        await setDoc(doc(db, 'settings', 'integrations'), config);
    }

    async initiateStripeCheckout(jobId: string, price: number): Promise<string> {
        // In a real app, this calls a Cloud Function to create a Stripe Checkout Session.
        // For this demo, we will simulate a successful payment flow.
        
        console.log(`[Stripe] Initiating checkout for Job ${jobId} Amount: $${price}`);
        
        // Simulating network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Return a fake success URL for now to test the UI flow
        return `${window.location.origin}/payment-success?jobId=${jobId}`;
    }
    async getAuditLogs() { return this.auditLogs; }
    async getAdminBadgeSettings() { 
        if (!this.badgeSettings) {
             const docRef = await getDoc(doc(db, 'settings', 'badges'));
             if (docRef.exists()) {
                 this.badgeSettings = docRef.data() as AdminBadgeSettings;
             } else {
                 this.badgeSettings = { showTripsBadge:true, showRequestBadge:true, showUpcomingBadge:true, showCompleteBadge:false };
             }
        }
        return this.badgeSettings;
    }
    async updateAdminBadgeSettings(s: AdminBadgeSettings) {
        this.badgeSettings = s;
        await setDoc(doc(db, 'settings', 'badges'), s);
    }

    // --- Branding Settings ---
    async getBrandingSettings(): Promise<BrandingSettings> {
        try {
            const docRef = doc(db, 'settings', 'branding');
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                return snap.data() as BrandingSettings;
            }
            return {
                mainFaviconUrl: '',
                adminFaviconUrl: ''
            };
        } catch (error) {
            console.warn("Failed to fetch branding:", error);
            return { mainFaviconUrl: '', adminFaviconUrl: '' };
        }
    }

    async updateBrandingSettings(settings: BrandingSettings): Promise<void> {
        try {
            const docRef = doc(db, 'settings', 'branding');
            await setDoc(docRef, settings, { merge: true });
            this.brandingSettings = settings;
            this.notifyListeners();
            console.log("Branding saved to Firestore:", settings);
        } catch (error) {
            console.error("Error saving branding:", error);
            throw error;
        }
    }

    async updatePricingThresholds(t: PricingThresholds) {
        this.thresholds = t;
        await setDoc(doc(db, 'settings', 'thresholds'), t);
    }
    async getPricingThresholds() { 
        if (!this.thresholds) {
            const docRef = await getDoc(doc(db, 'settings', 'thresholds'));
            if (docRef.exists()) {
                this.thresholds = docRef.data() as PricingThresholds;
            } else {
                this.thresholds = { highAlertPercent: 50, lowAlertPercent: 50, fairOfferPercent: 35, goodOfferPercent: 10 };
            }
        }
        return this.thresholds;
    }

    async updateSupportSettings(s: SupportSettings) {
        this.supportSettings = s;
        await setDoc(doc(db, 'settings', 'support'), s);
    }
    async getSupportSettings() { 
        if (!this.supportSettings) {
            const docRef = await getDoc(doc(db, 'settings', 'support'));
            if (docRef.exists()) {
                this.supportSettings = docRef.data() as SupportSettings;
            } else {
                this.supportSettings = { financeEmail: '', supportEmail: '', supportPhone: '', whatsappNumber: '' };
            }
        }
        return this.supportSettings;
    }
    async getTransactions() { return this.transactions; }
    async getNotifications() { return this.notifications; }
    async getPromoCodes() { return this.promoCodes; }
    async createPromoCode(p: Partial<PromoCode>) { return p as PromoCode; }
    
    async resolveDispute(jobId: string, resolution: string) {
        const status = resolution === 'REFUND' ? JobStatus.CANCELLED : JobStatus.COMPLETED;
        await updateDoc(doc(db, 'bookings', jobId), { 
            status: status,
            adminNotes: `Dispute resolved by admin: ${resolution}`
        });
        
        // Log it
        await addDoc(collection(db, 'audit_logs'), {
            action: 'RESOLVE_DISPUTE',
            targetId: jobId,
            details: `Resolution: ${resolution}`,
            timestamp: new Date().toISOString(),
            adminId: this.currentUser?.id || 'admin'
        });
    }

    async updateDriverVehicles(uid: string, v: VehicleSettings[]) { await updateDoc(doc(db, 'users', uid), { vehicles: v }); return this.users.find(u => u.id === uid)!; }
    
    async skipJob(uid: string, jid: string) {
        const user = this.users.find(u => u.id === uid);
        if (user) {
            const skipped = [...(user.skippedJobIds || []), jid];
            await updateDoc(doc(db, 'users', uid), { skippedJobIds: skipped });
        }
    }
    
    async unskipJob(uid: string, jid: string) {
        const user = this.users.find(u => u.id === uid);
        if (user && user.skippedJobIds) {
            const skipped = user.skippedJobIds.filter(id => id !== jid);
            await updateDoc(doc(db, 'users', uid), { skippedJobIds: skipped });
        }
    }

    async cancelJob(jobId: string) {
        await this.updateJobStatus(jobId, JobStatus.CANCELLED);
    }

    async loginWithGoogle(role: UserRole) { return this.login('google@test.com', 'pass', role); }
    async createSupportTicket(t: Partial<SupportTicket>) { return t as SupportTicket; }
    async getAllUsers() { return this.users; }
    async assignDriver(jobId: string, driverId: string) { 
        const driver = this.users.find(u => u.id === driverId);
        if (driver) await updateDoc(doc(db, 'bookings', jobId), { driverId, driverName: driver.name, status: JobStatus.ACCEPTED }); 
    }
    async adminOverridePrice(jobId: string, price: number) { await updateDoc(doc(db, 'bookings', jobId), { price }); }
    async updateTicketStatus(id: string, status: any) {}
    async sendSystemNotification(n: any) {}
    // async initiateStripeCheckout(uid: string) { return ''; } // Removed duplicate
    async confirmMembership(uid: string, sess: string) { return {success: true}; }
    async getDriverPublicProfile(id: string) { return this.users.find(u => u.id === id); }
    calculatePrice(dist: number, type: string) { return 100; } // Fallback

    // --- DATA CLEANUP ---
    async deleteUserByEmail(email: string) {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log(`Deleted all users with email: ${email}`);
    }

    async ensureSingleAdmin(adminEmail: string, currentUid: string) {
        const q = query(collection(db, 'users'), where('email', '==', adminEmail));
        const querySnapshot = await getDocs(q);
        
        const deletePromises = querySnapshot.docs.map(async (docSnap) => {
            if (docSnap.id !== currentUid) {
                await deleteDoc(docSnap.ref);
                console.log(`Removed duplicate admin record: ${docSnap.id}`);
            }
        });
        await Promise.all(deletePromises);
    }

    async cleanupDatabase() {
        console.log("Starting Database Cleanup...");
        
        // 1. Delete Non-Admin Users AND Duplicate Admins
        const usersSnap = await getDocs(collection(db, 'users'));
        const currentUid = auth.currentUser?.uid;
        
        const deleteUserPromises = usersSnap.docs.map(async (docSnap) => {
            const userData = docSnap.data();
            // Delete if not the main admin email
            if (userData.email !== 'jclott77@gmail.com') {
                await deleteDoc(doc(db, 'users', docSnap.id));
            } else if (currentUid && docSnap.id !== currentUid) {
                // It IS the admin email, but not the CURRENT logged in UID (a duplicate)
                await deleteDoc(doc(db, 'users', docSnap.id));
            }
        });
        await Promise.all(deleteUserPromises);

        // 2. Delete All Bookings
        const bookingsSnap = await getDocs(collection(db, 'bookings'));
        const deleteBookingPromises = bookingsSnap.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deleteBookingPromises);

        // 3. Delete All Tickets
        const ticketsSnap = await getDocs(collection(db, 'tickets'));
        const deleteTicketPromises = ticketsSnap.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deleteTicketPromises);

        // 4. Delete All Transactions
        const txSnap = await getDocs(collection(db, 'transactions'));
        const deleteTxPromises = txSnap.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deleteTxPromises);

        // 5. Delete All Notifications
        const notifSnap = await getDocs(collection(db, 'notifications'));
        const deleteNotifPromises = notifSnap.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deleteNotifPromises);

        console.log("Database Cleanup Complete. Only Admin remains.");
        this.notifyListeners();
    }

    // --- STUBS for Interface Compatibility ---
    async verifyDriver(driverId: string) { return this.updateUserStatus(driverId, UserStatus.ACTIVE); }
    async deleteUser(userId: string) { await deleteDoc(doc(db, 'users', userId)); }
    
    async manualPayout(userId: string, amount: number) { 
        // Log Transaction
        await addDoc(collection(db, 'transactions'), {
            userId: userId,
            type: 'PAYOUT',
            amount: amount,
            status: 'SUCCESS',
            date: new Date().toISOString(),
            description: `Manual payout by admin`
        });
        
        // Update user balance (deduct)
        const user = this.users.find(u => u.id === userId);
        if (user) {
            await updateDoc(doc(db, 'users', userId), {
                balance: (user.balance || 0) - amount
            });
        }
    }
}

export const backend = new BackendService();
