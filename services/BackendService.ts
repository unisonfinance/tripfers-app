import { 
    User, UserRole, Job, JobStatus, Bid, IntegrationsConfig, UserStatus, 
    VehicleSettings, PricingConfig, SupportTicket, Transaction, AuditLog, 
    SystemNotification, ChatMessage, PromoCode, AdminBadgeSettings, 
    PricingThresholds, SupportSettings, DocumentType, DriverDocument, BrandingSettings, MarketingBannerSettings 
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from './firebase';

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

            // IMPORTANT: Create user without automatically signing them in if the current user is an admin
            // This prevents the admin from being logged out when creating a partner account
            
            // Check if we are currently logged in as ADMIN
            const currentUser = auth.currentUser;
            const isCreatingPartnerAsAdmin = currentUser && role === UserRole.AGENCY;

            let newUser: User;
            let uid: string;

            if (isCreatingPartnerAsAdmin) {
                // Secondary App initialization workaround to create user without signing out current user
                // However, Firebase Client SDK doesn't support this easily without a second app instance.
                // For a simpler approach in this SPA:
                // We will use a temporary workaround: Create the user, then immediately sign the admin back in? 
                // No, that requires the admin password.
                
                // Better approach for Client SDK: 
                // We cannot create a user without signing in as them in the Client SDK.
                // The proper way is to use a Callable Cloud Function `createPartnerAccount`.
                // BUT, since we are doing client-side only for now:
                
                // We will throw an error if they try to do this without a Cloud Function, 
                // OR we accept that it logs them out and switches to the new user (which is what the user complained about).
                
                // FIX: We will create a specialized "invitePartner" method that uses a secondary Firebase App instance 
                // to avoid disrupting the main auth session.
                
                // Dynamic Import to avoid top-level side effects if possible, or just standard initializeApp
                const { initializeApp } = await import("firebase/app");
                const { getAuth, createUserWithEmailAndPassword: createAuthUser } = await import("firebase/auth");
                const { firebaseConfig } = await import("./firebase"); // We need to export firebaseConfig from firebase.ts
                
                // Initialize a secondary app
                const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
                const secondaryAuth = getAuth(secondaryApp);
                
                const result = await createAuthUser(secondaryAuth, email, password);
                uid = result.user.uid;
                
                // Clean up secondary app (optional, but good practice)
                // secondaryApp.delete(); // delete() is async, might need to wait or ignore
                
            } else {
                // Standard flow (Self-registration)
                const result = await createUserWithEmailAndPassword(auth, email, password);
                uid = result.user.uid;
            }

            newUser = {
                id: uid,
                name, email, role,
                status: role === UserRole.DRIVER ? UserStatus.PENDING_VERIFICATION : UserStatus.ACTIVE,
                rating: 5.0,
                joinDate: new Date().toISOString(),
                vehicles: [],
                skippedJobIds: [],
                documents: [],
                totalTrips: 0,
                balance: 0,
                totalEarnings: 0,
                serviceZones: [] 
            };
            
            await setDoc(doc(db, 'users', newUser.id), newUser);
            
            // Only update local state if we are NOT an admin creating a partner
            if (!isCreatingPartnerAsAdmin) {
                this.currentUser = newUser;
            }
            
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
                const agencyId = (job as any).agencyId;
                
                // 1. Calculate Standard Commission (e.g. 29.5%)
                const platformCommissionRate = this.pricing.commissionRate || 0.295;
                const platformCommission = job.price * platformCommissionRate;
                const driverNet = job.price - platformCommission;

                if (driver) {
                    // Update Driver Balance
                    await updateDoc(doc(db, 'users', driver.id), {
                        balance: (driver.balance || 0) + driverNet,
                        totalEarnings: (driver.totalEarnings || 0) + driverNet,
                        totalTrips: (driver.totalTrips || 0) + 1
                    });

                    // Log Driver Transaction
                    await addDoc(collection(db, 'transactions'), {
                        userId: driver.id,
                        type: 'EARNING',
                        amount: driverNet,
                        status: 'SUCCESS',
                        date: new Date().toISOString(),
                        description: `Earnings for Trip #${job.id.substring(0,8)}`
                    });
                }
                
                // 2. Handle Partner Commission (if applicable)
                if (agencyId) {
                    const agency = this.users.find(u => u.id === agencyId);
                    if (agency && agency.agencySettings) {
                        // Partner gets a cut of the platform commission (or a fixed % of trip)
                        // Typically: 5% of Total Trip Price
                        const partnerRate = agency.agencySettings.commissionRate || 0.05;
                        const partnerEarnings = job.price * partnerRate;
                        
                        // Update Partner Balance
                        await updateDoc(doc(db, 'users', agencyId), {
                            balance: (agency.balance || 0) + partnerEarnings,
                            totalEarnings: (agency.totalEarnings || 0) + partnerEarnings
                        });
                        
                        // Log Partner Transaction
                        await addDoc(collection(db, 'transactions'), {
                            userId: agencyId,
                            type: 'COMMISSION',
                            amount: partnerEarnings,
                            status: 'SUCCESS',
                            date: new Date().toISOString(),
                            description: `Commission for Trip #${job.id.substring(0,8)}`
                        });
                        
                        console.log(`[Commission] Paid Partner ${agency.name}: $${partnerEarnings}`);
                    }
                }

                // Log Admin Revenue (Platform Commission - Partner Payout)
                // This is just for logs, doesn't go to a specific wallet doc
                await addDoc(collection(db, 'transactions'), {
                    userId: 'system',
                    type: 'REVENUE',
                    amount: platformCommission,
                    status: 'SUCCESS',
                    date: new Date().toISOString(),
                    description: `Platform Revenue for Trip #${job.id.substring(0,8)}`
                });
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

        // Notify Driver
        await addDoc(collection(db, 'notifications'), {
             userId: bid.driverId,
             title: "Bid Accepted!",
             message: `Your bid for trip from ${job.pickup} to ${job.dropoff || 'Hourly'} has been accepted. Waiting for payment.`,
             type: 'INFO',
             read: false,
             createdAt: new Date().toISOString()
        });
        
        // Notify Admin
        await addDoc(collection(db, 'notifications'), {
             targetRole: 'ADMIN',
             title: "Bid Accepted",
             message: `Client ${job.clientName} accepted bid from ${bid.driverName} for Job #${jobId.substring(0,8)}.`,
             type: 'INFO',
             read: false,
             createdAt: new Date().toISOString()
        });

        return { ...job, ...updates } as Job;
    }

    async markJobAsPaid(jobId: string) {
        // Update Job
        await updateDoc(doc(db, 'bookings', jobId), { 
            paymentStatus: 'PAID',
            isPaid: true
        });
        
        const job = this.jobs.find(j => j.id === jobId);
        if (job) {
             // Notify Driver
             if (job.driverId) {
                 await addDoc(collection(db, 'notifications'), {
                     userId: job.driverId,
                     title: "Payment Received!",
                     message: `Client has paid for Job #${jobId.substring(0,8)}. You can now proceed.`,
                     type: 'SUCCESS',
                     read: false,
                     createdAt: new Date().toISOString()
                });
             }
            
            // Notify Admin
            await addDoc(collection(db, 'notifications'), {
                 targetRole: 'ADMIN',
                 title: "Payment Received",
                 message: `Payment received for Job #${jobId.substring(0,8)}.`,
                 type: 'SUCCESS',
                 read: false,
                 createdAt: new Date().toISOString()
            });

            // Log Transaction
            await addDoc(collection(db, 'transactions'), {
                userId: job.clientId,
                jobId: job.id,
                type: 'PAYMENT',
                amount: job.price || 0,
                status: 'SUCCESS',
                date: new Date().toISOString(),
                description: `Payment for Trip #${job.id}`
            });
        }
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
    async uploadFile(path: string, file: File): Promise<string> {
        try {
            const storageRef = ref(storage, path);
            const snapshot = await uploadBytes(storageRef, file);
            return await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Error uploading file:", error);
            throw error;
        }
    }

    async uploadDocument(userId: string, type: DocumentType, file: File, url?: string): Promise<DriverDocument> {
       let finalUrl = url;
       if (!finalUrl) {
           const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
               const reader = new FileReader();
               reader.readAsDataURL(file);
               reader.onload = () => resolve(reader.result as string);
               reader.onerror = error => reject(error);
           });
           finalUrl = await toBase64(file);
       }

       const newDoc: DriverDocument = {
           id: 'doc_' + Math.random().toString(36).substr(2, 9),
           type,
           url: finalUrl,
           status: 'PENDING',
           uploadedAt: new Date().toISOString()
       };

       const user = this.users.find(u => u.id === userId);
       if (user) {
           // REPLACE existing document of same type if exists
           const currentDocs = user.documents?.filter(d => d.type !== type) || [];
           await updateDoc(doc(db, 'users', userId), {
               documents: [...currentDocs, newDoc]
           });
       }
       return newDoc;
    }
    
    async adminUpdateDocumentStatus(userId: string, docId: string, status: 'APPROVED' | 'REJECTED', reason?: string): Promise<void> {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                const userData = userSnap.data() as User;
                if (userData.documents) {
                    const newDocs = userData.documents.map(d => 
                        d.id === docId ? { ...d, status, rejectionReason: reason || '' } : d
                    );
                    await updateDoc(userRef, { documents: newDocs });
                    console.log(`Document ${docId} status updated to ${status}`);
                }
            }
        } catch (error) {
            console.error("Error updating document status:", error);
            throw error;
        }
    }

    // --- MISC / ADMIN ---
    async getPricingConfig() { return this.pricing || {} as PricingConfig; }
    async updatePricingConfig(config: PricingConfig) { 
        await setDoc(doc(db, 'settings', 'pricing'), config);
    }

    async adminApprovePaymentDetails(userId: string, status: 'APPROVED' | 'REJECTED'): Promise<void> {
        await updateDoc(doc(db, 'users', userId), {
            paymentVerificationStatus: status
        });
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
             timestamp: new Date().toISOString(),
             reactions: {}
        };
        const messages = [...(job?.messages || []), msg];
        await updateDoc(doc(db, 'bookings', jobId), { messages });
        return msg;
    }

    async addReaction(jobId: string, messageId: string, userId: string, emoji: string) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job || !job.messages) return;

        const messages = job.messages.map(msg => {
            if (msg.id === messageId) {
                const reactions = msg.reactions || {};
                const users = reactions[emoji] || [];
                
                // Toggle reaction
                let newUsers;
                if (users.includes(userId)) {
                    newUsers = users.filter(u => u !== userId);
                } else {
                    newUsers = [...users, userId];
                }

                // If no users left for this emoji, remove the key
                if (newUsers.length === 0) {
                    delete reactions[emoji];
                } else {
                    reactions[emoji] = newUsers;
                }
                
                return { ...msg, reactions };
            }
            return msg;
        });

        await updateDoc(doc(db, 'bookings', jobId), { messages });
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
    async getIntegrations(): Promise<IntegrationsConfig> {
        try {
            const docRef = doc(db, 'settings', 'integrations');
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                return snap.data() as IntegrationsConfig;
            }
            return {
                googleMapsKey: '',
                primaryAdminEmail: 'jclott77@gmail.com',
                stripePublishableKey: '',
                stripeSecretKey: '',
                twilioAccountSid: '',
                twilioAuthToken: '',
                twilioFromNumber: '',
                adminMobileNumber: '',
                twilioEnabled: false
            } as any;
        } catch (e) {
            console.error("Failed to fetch integrations", e);
            return {} as any;
        }
    }

    async updateIntegrations(config: IntegrationsConfig) {
        this.integrations = config;
        await setDoc(doc(db, 'settings', 'integrations'), config);
    }

    async initiateStripeCheckout(jobId: string, price: number): Promise<void> {
        const config = await this.getIntegrations();
        
        // Use provided keys if not in config (Fallback for Demo)
        const publishableKey = config.stripePublishableKey || 'pk_test_51SfFxpIXU7WLKiqXsKuv8CJDEdT9tpK5CQL0Yeu8dAL3A5auIItJ4Scr6mbOlZzbVDMttpbXbnLir29pPkwiyH0c00iy3T1e2m';

        console.log(`[Stripe] Initiating checkout for Job ${jobId} Amount: $${price}`);
        
        try {
            const createStripeSession = httpsCallable(functions, 'createStripeSession');
            
            // Call Cloud Function
            const { data }: any = await createStripeSession({
                jobId,
                price,
                successUrl: `${window.location.origin}/#/dashboard/client?payment_success=true&jobId=${jobId}`,
                cancelUrl: `${window.location.origin}/#/dashboard/client?payment_cancel=true`,
                customerEmail: this.currentUser?.email,
                customerName: this.currentUser?.name
            });

            if (!data || !data.sessionId) {
                throw new Error("Failed to create Stripe Session");
            }

            const stripe = await loadStripe(publishableKey);
            if (stripe) {
                const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
                if (error) throw error;
            }
        } catch (error) {
            console.error("Stripe Checkout Error:", error);
            alert("Payment initiation failed. Please try again.");
            throw error;
        }
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
                adminFaviconUrl: '',
                loginFormImageUrl: '',
                mainSiteLogoUrl: '',
                mainSiteLogoDarkUrl: '',
                partnerFaviconUrl: '',
                partnerLogoUrl: '',
                logoHeight: 32, // Default 32px (h-8)
                logoMarginLeft: 0,
                logoMarginTop: 0,
                logoMarginBottom: 0
            };
        } catch (error) {
            console.warn("Failed to fetch branding:", error);
            return { 
                mainFaviconUrl: '', 
                adminFaviconUrl: '', 
                loginFormImageUrl: '',
                mainSiteLogoUrl: '',
                mainSiteLogoDarkUrl: '',
                logoHeight: 32,
                logoMarginLeft: 0,
                logoMarginTop: 0,
                logoMarginBottom: 0
            };
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
    // Marketing
    async getMarketingSettings(): Promise<MarketingBannerSettings> {
        try {
            const docRef = doc(db, 'settings', 'marketing');
            const snap = await getDoc(docRef);
            if (snap.exists()) return snap.data() as MarketingBannerSettings;
            
            // Default settings if not found
            return {
                text: 'Become a Member — Faster Responses',
                textColor: '#FFFFFF',
                backgroundColor: 'bg-emerald-600', // Default class
                buttonText: 'Join Now',
                linkUrl: '#',
                isEnabled: true
            };
        } catch (error) {
            console.error("Failed to fetch marketing settings", error);
             return {
                text: 'Become a Member — Faster Responses',
                textColor: '#FFFFFF',
                backgroundColor: 'bg-emerald-600',
                buttonText: 'Join Now',
                linkUrl: '#',
                isEnabled: true
            };
        }
    }

    async updateMarketingSettings(settings: MarketingBannerSettings): Promise<void> {
        try {
             const docRef = doc(db, 'settings', 'marketing');
             await setDoc(docRef, settings, { merge: true });
        } catch (error) {
            console.error("Failed to update marketing settings", error);
            throw error;
        }
    }

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

    async updateDriverVehicles(uid: string, v: VehicleSettings[]) { 
        await updateDoc(doc(db, 'users', uid), { vehicles: v }); 
        return this.users.find(u => u.id === uid)!; 
    }

    async updateDriverServiceZones(uid: string, zones: any[]) {
        await updateDoc(doc(db, 'users', uid), { serviceZones: zones });
        return this.users.find(u => u.id === uid)!;
    }

    async updateDriverCompanyProfile(uid: string, p: CompanyProfile) {
        await updateDoc(doc(db, 'users', uid), { companyProfile: p });
        return this.users.find(u => u.id === uid)!;
    }
    
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
    calculatePrice(dist: number, type: string) {
        if (!this.pricing) return 0;

        let price = this.pricing.baseFare || 0;
        let remainingDist = dist;

        // Tier 1: 0-10km
        if (remainingDist > 0) {
            const tier1Dist = Math.min(remainingDist, 10);
            price += tier1Dist * (this.pricing.tier1Rate || 0);
            remainingDist -= tier1Dist;
        }

        // Tier 2: 10-100km
        if (remainingDist > 0) {
            const tier2Dist = Math.min(remainingDist, 90); // 100 - 10
            price += tier2Dist * (this.pricing.tier2Rate || 0);
            remainingDist -= tier2Dist;
        }

        // Tier 3: 100-250km
        if (remainingDist > 0) {
            const tier3Dist = Math.min(remainingDist, 150); // 250 - 100
            price += tier3Dist * (this.pricing.tier3Rate || 0);
            remainingDist -= tier3Dist;
        }

        // Tier 4: 250km+
        if (remainingDist > 0) {
            price += remainingDist * (this.pricing.tier4Rate || 0);
        }

        // Apply Vehicle Multiplier
        const multiplier = this.pricing.multipliers?.[type] || 1.0;
        price *= multiplier;

        // Apply Peak Pricing (Global Toggle)
        if (this.pricing.enablePeakPricing) {
            price *= (this.pricing.peakMultiplier || 1.0);
        }

        // Apply Weekend Pricing
        if (this.pricing.enableWeekendPricing) {
            const day = new Date().getDay();
            if (day === 0 || day === 6) { // Sunday or Saturday
                price *= (this.pricing.weekendMultiplier || 1.0);
            }
        }

        return Math.round(price);
    }

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
    
    async restoreDriver() {
        const driverId = 'restored_driver_' + Date.now();
        const driver: User = {
            id: driverId,
            name: "Restored Test Driver",
            email: `test.driver.${Date.now()}@example.com`,
            role: UserRole.DRIVER,
            status: UserStatus.ACTIVE,
            rating: 4.9,
            joinDate: new Date().toISOString(),
            totalTrips: 42,
            totalEarnings: 3500.00,
            balance: 250.00,
            vehicles: [{
                id: 'v_' + Math.random().toString(36).substr(2, 5),
                make: 'Toyota',
                model: 'Camry',
                year: '2022',
                color: 'White',
                plate: 'TEST-888',
                type: 'Comfort',
                maxPassengers: 4,
                maxLuggage: 2,
                maxCarryOn: 2,
                photos: [],
                features: { wifi: true, water: true, charger: true, accessible: false, childSeat: true },
                autoCancelOffers: false,
                bufferTimeBefore: 0,
                bufferTimeAfter: 0
            }],
            documents: [
                { id: 'd1', type: 'LICENSE_SELFIE', status: 'APPROVED', url: 'https://via.placeholder.com/150', uploadedAt: new Date().toISOString() },
                { id: 'd2', type: 'INSURANCE', status: 'APPROVED', url: 'https://via.placeholder.com/150', uploadedAt: new Date().toISOString() }
            ],
            serviceZones: []
        };
        await setDoc(doc(db, 'users', driverId), driver);
        return driver;
    }

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
