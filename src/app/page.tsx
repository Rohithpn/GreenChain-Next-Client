"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from '../lib/firebase';
import { User, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, onSnapshot, query, where, DocumentData, addDoc, setDoc, doc, Timestamp, deleteDoc, orderBy } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { generatePdfReport } from '../lib/reportGenerator';

// --- Main App Component ---
export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-green-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="mt-2 text-gray-700">Loading GreenChain...</p>
        </div>
      </div>
    );
  }

  return user ? <Dashboard user={user} /> : <AuthPage />;
}

// --- Redesigned Authentication Page ---
function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true); setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "users", cred.user.uid), {
                    email: cred.user.email, orgName: organizationName, createdAt: Timestamp.now()
                });
            }
        } catch (err: any) { 
            setError(err.message); 
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 font-sans p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl">
                <div className="flex flex-col items-center space-y-2">
                    <svg className="w-12 h-12 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                    </svg>
                    <h1 className="text-4xl font-bold text-gray-800">GreenChain</h1>
                    <p className="text-gray-600">{isLogin ? 'Securely sign in to your account' : 'Start your sustainability journey'}</p>
                </div>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-center text-red-700">{error.replace('Firebase:', '')}</div>}
                <form onSubmit={handleAuthAction} className="space-y-4">
                    {!isLogin && <input type="text" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Your Company Inc." required className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors placeholder-gray-600 text-gray-900" />}
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors placeholder-gray-600 text-gray-900" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors placeholder-gray-600 text-gray-900" />
                    <button type="submit" disabled={loading} className="w-full py-3 mt-4 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-gray-400 flex items-center justify-center">
                        {loading ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>
                <p className="w-full text-sm text-center text-gray-600">
                    {isLogin ? 'Need an account?' : 'Already have an account?'}
                    <span onClick={() => { setIsLogin(!isLogin); setError(''); }} className="ml-1 font-semibold text-green-600 cursor-pointer hover:underline">
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </span>
                </p>
            </div>
        </div>
    );
}

// --- Overview Component ---
function Overview({ suppliers }: { suppliers: DocumentData[] }) {
    const totalSuppliers = suppliers.length;
    const highRiskCount = suppliers.filter(s => s.predictedRisk === 'High').length;
    const mediumRiskCount = suppliers.filter(s => s.predictedRisk === 'Medium').length;
    const lowRiskCount = suppliers.filter(s => s.predictedRisk === 'Low').length;

    const stats = [
        { label: 'Total Suppliers', value: totalSuppliers, color: 'text-blue-600' },
        { label: 'High Risk', value: highRiskCount, color: 'text-red-600' },
        { label: 'Medium Risk', value: mediumRiskCount, color: 'text-amber-600' },
        { label: 'Low Risk', value: lowRiskCount, color: 'text-green-600' },
    ];

    return (
        <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map(stat => (
                    <div key={stat.label} className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center text-center transition-all hover:shadow-xl hover:-translate-y-1">
                        <p className={`text-5xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-sm font-medium text-gray-600 mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Dashboard Component (Reordered) ---
function Dashboard({ user }: { user: User }) {
    const [suppliers, setSuppliers] = useState<DocumentData[]>([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);

    const SupplierMap = useMemo(() => dynamic(() => import('../components/SupplierMap'), {
        ssr: false,
        loading: () => <div className="h-[500px] w-full bg-gray-200 rounded-xl flex items-center justify-center"><p className="text-gray-500">Map is loading...</p></div>
    }), []);

    useEffect(() => {
        const q = query(collection(db, "suppliers"), where("ownerId", "==", user.uid), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setLoadingSuppliers(false);
            },
            (error) => {
                console.error("Firestore Error:", error);
            }
        );
        return () => unsubscribe();
    }, [user.uid]);

    return (
        <div className="min-h-screen bg-slate-100">
            <nav className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center space-x-2">
                    <svg className="w-8 h-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>
                    <h1 className="text-2xl font-bold text-gray-800">GreenChain</h1>
                </div>
                <div>
                    <span className="text-gray-700 mr-4 hidden sm:inline">{user.email}</span>
                    <button onClick={() => signOut(auth)} className="px-4 py-2 font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                        Sign Out
                    </button>
                </div>
            </nav>
            <main className="p-4 md:p-8 max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
                <div className="mt-6 space-y-8">
                    {/* NEW LAYOUT ORDER */}
                    <Overview suppliers={suppliers} />
                    <SupplierMap suppliers={suppliers} />
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-2">
                            <SupplierForm user={user} />
                        </div>
                        <div className="lg:col-span-3">
                            <SupplierList suppliers={suppliers} isLoading={loadingSuppliers} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// --- Helper Components ---
const CheckboxField = ({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: (checked: boolean) => void }) => (
    <div className="flex items-center">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
        <label htmlFor={id} className="ml-3 block text-sm font-medium text-gray-800">{label}</label>
    </div>
);

// --- Refined Supplier Form ---
function SupplierForm({ user }: { user: User }) {
    const initialFormState = {
        name: '', country: 'India', industryVertical: 'Garment Manufacturing',
        water_usage_m3: '', turnover_rate_percent: '', workplace_accidents_last_year: '',
        total_emissions_kg_co2e: '', number_of_workers: '51-200',
        has_anti_corruption_policy: false, publishes_esg_report: false,
        is_iso14001_certified: false, is_sa8000_certified: false
    };
    const [formData, setFormData] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const handleFormChange = (field: string, value: string | boolean | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('Getting ESG prediction from AI...');

        const aiPayload = { ...formData, processing_type: formData.industryVertical, sector: 'Apparel',
            total_emissions_kg_co2e: parseFloat(formData.total_emissions_kg_co2e),
            water_usage_m3: parseFloat(formData.water_usage_m3),
            turnover_rate_percent: parseFloat(formData.turnover_rate_percent),
            workplace_accidents_last_year: parseInt(formData.workplace_accidents_last_year, 10),
        };

        try {
            const response = await fetch('http://127.0.0.1:5001/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(aiPayload) });
            if (!response.ok) throw new Error(`AI Server Error: ${response.statusText}`);
            const result = await response.json();
            setMessage('Prediction received! Saving to database...');
            const dbPayload = { ...aiPayload, ownerId: user.uid, createdAt: Timestamp.now(), predictedRisk: result.prediction, confidenceScores: result.confidenceScores };
            await addDoc(collection(db, "suppliers"), dbPayload);
            setMessage(`✅ Supplier "${formData.name}" added with a risk of: ${result.prediction.toUpperCase()}`);
            setFormData(initialFormState);
        } catch (err: any) {
            setMessage(`❌ Error: ${err.message}. Is the Python API server running?`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const inputFieldClass = "w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors placeholder-gray-600 text-gray-900";

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg h-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Add New Supplier</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="Supplier Name" value={formData.name} onChange={e => handleFormChange('name', e.target.value)} required className={inputFieldClass} />
                <select value={formData.country} onChange={e => handleFormChange('country', e.target.value)} className={inputFieldClass}>
                    {['Pakistan', 'China', 'Bangladesh', 'India', 'Turkey', 'Vietnam', 'USA', 'Brazil', 'Morocco'].map(c => <option key={c}>{c}</option>)}
                </select>
                <select value={formData.industryVertical} onChange={e => handleFormChange('industryVertical', e.target.value)} className={inputFieldClass}>
                    {['Dyeing & Finishing', 'Spinning Mill', 'Weaving & Knitting', 'Garment Manufacturing', 'Printing', 'Packaging', 'Logistics'].map(i => <option key={i}>{i}</option>)}
                </select>
                <select value={formData.number_of_workers} onChange={e => handleFormChange('number_of_workers', e.target.value)} className={inputFieldClass}>
                    <option>1-50</option><option>51-200</option><option>201-500</option><option>501-1000</option><option>1001-5000</option><option>5001+</option>
                </select>

                <div className="pt-4 space-y-4">
                    <h4 className="font-semibold text-gray-700">Environmental</h4>
                    <input type="number" placeholder="Total Emissions (kg CO₂e)" value={formData.total_emissions_kg_co2e} onChange={e => handleFormChange('total_emissions_kg_co2e', e.target.value)} required className={inputFieldClass} />
                    <input type="number" placeholder="Annual Water Usage (m³)" value={formData.water_usage_m3} onChange={e => handleFormChange('water_usage_m3', e.target.value)} required className={inputFieldClass} />
                    
                    <h4 className="font-semibold text-gray-700 pt-2">Social</h4>
                    <input type="number" placeholder="Employee Turnover Rate (%)" value={formData.turnover_rate_percent} onChange={e => handleFormChange('turnover_rate_percent', e.target.value)} required className={inputFieldClass} />
                    <input type="number" placeholder="Workplace Accidents (Yearly)" value={formData.workplace_accidents_last_year} onChange={e => handleFormChange('workplace_accidents_last_year', e.target.value)} required className={inputFieldClass} />

                    <h4 className="font-semibold text-gray-700 pt-2">Governance & Certifications</h4>
                    <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
                        <CheckboxField id="g_policy" label="Has Anti-Corruption Policy?" checked={formData.has_anti_corruption_policy} onChange={v => handleFormChange('has_anti_corruption_policy', v)} />
                        <CheckboxField id="g_report" label="Publishes ESG Report?" checked={formData.publishes_esg_report} onChange={v => handleFormChange('publishes_esg_report', v)} />
                        <CheckboxField id="e_cert" label="ISO 14001 Certified?" checked={formData.is_iso14001_certified} onChange={v => handleFormChange('is_iso14001_certified', v)} />
                        <CheckboxField id="s_cert" label="SA8000 Certified?" checked={formData.is_sa8000_certified} onChange={v => handleFormChange('is_sa8000_certified', v)} />
                    </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-3 mt-2 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center">
                    {isSubmitting ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : 'Add & Analyze Supplier'}
                </button>
                {message && <p className="mt-4 text-sm text-center text-gray-600 animate-pulse">{message}</p>}
            </form>
        </div>
    );
}

// --- Refined Supplier List (Edit button removed) ---
function SupplierList({ suppliers, isLoading }: { suppliers: DocumentData[], isLoading: boolean }) {
    
    const handleDelete = async (supplierId: string) => {
        if (window.confirm("Are you sure you want to delete this supplier? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, "suppliers", supplierId));
            } catch (error) {
                console.error("Error removing document: ", error);
                alert("Failed to delete supplier.");
            }
        }
    };

    const getRiskChip = (risk: string) => {
        const colors = {
            High: 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-200',
            Medium: 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200',
            Low: 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200'
        }[risk] || 'bg-gray-100 text-gray-800';
        return <span className={`px-3 py-1 text-sm font-semibold rounded-full ${colors}`}>{risk}</span>;
    };

    if (isLoading) return <div className="p-6 bg-white rounded-xl shadow-lg flex justify-center items-center h-full"><p className="text-gray-600">Loading suppliers...</p></div>;
    
    return (
        <div className="p-6 bg-white rounded-xl shadow-lg h-full">
            <h3 className="text-2xl font-bold text-gray-800">Your Suppliers</h3>
            <div className="mt-4 space-y-3">
                {suppliers.length === 0 ? <p className="text-gray-700 text-center py-8">No suppliers added yet.</p> :
                    suppliers.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                            <div>
                                <p className="font-semibold text-gray-900">{s.name}</p>
                                <p className="text-sm text-gray-600">{s.country} - {s.industryVertical}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                {getRiskChip(s.predictedRisk)}
                                <button onClick={() => generatePdfReport(s)} className="p-2 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-800 transition-colors" title="Download Report">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" /></svg>
                                </button>
                                <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors" title="Delete Supplier">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm1 4a1 1 0 100 2h4a1 1 0 100-2H8z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
}

