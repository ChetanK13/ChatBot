import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User as UserIcon, MessageSquare, Briefcase, ChevronRight, ArrowRight, Edit2, Save, X, Building2, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import axios from "axios";

interface UserProfile {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface Employment {
    id: number;
    company_name: string;
    from_date: string;
    to_date?: string;
    is_currently_working: boolean;
}

export default function Dashboard() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [employments, setEmployments] = useState<Employment[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ first_name: "", last_name: "", email: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profRes, empRes] = await Promise.all([
                    axios.get("/auth/me"),
                    axios.get("/employment"),
                ]);
                setProfile(profRes.data);
                setEditForm({
                    first_name: profRes.data.first_name,
                    last_name: profRes.data.last_name,
                    email: profRes.data.email
                });
                setEmployments(empRes.data);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [location.pathname]); // refetch when returning from chatbot

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleSaveProfile = async () => {
        setSaveLoading(true);
        try {
            const res = await axios.put("/auth/me", editForm);
            setProfile(res.data);
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update profile", err);
        } finally {
            setSaveLoading(false);
        }
    };

    const isChatbot = location.pathname.includes("/chatbot");

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    return (
        <div className="flex h-screen bg-slate-50 flex-col md:flex-row font-sans overflow-hidden">
            {/* Sidebar */}
            <motion.div
                initial={{ x: -250 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
                className="w-full md:w-72 bg-white border-r border-gray-200 flex flex-col justify-between shadow-sm z-20"
            >
                <div>
                    <div className="p-8 flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-white">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <Briefcase className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 tracking-tight">HRMS Portal</h1>
                            <p className="text-xs font-medium text-blue-600">Career Manager</p>
                        </div>
                    </div>

                    <nav className="mt-6 px-4 space-y-2">
                        <Link
                            to="/dashboard"
                            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${!isChatbot ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-gray-600 hover:bg-gray-100"}`}
                        >
                            <div className="flex items-center space-x-3">
                                <UserIcon className={`w-5 h-5 ${!isChatbot ? "text-blue-100" : "text-gray-400 group-hover:text-blue-600"}`} />
                                <span className="font-medium">Profile Overview</span>
                            </div>
                            {!isChatbot && <ChevronRight className="w-4 h-4 text-blue-200" />}
                        </Link>

                        <Link
                            to="/dashboard/chatbot"
                            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isChatbot ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-gray-600 hover:bg-gray-100"}`}
                        >
                            <div className="flex items-center space-x-3">
                                <MessageSquare className={`w-5 h-5 ${isChatbot ? "text-blue-100" : "text-gray-400 group-hover:text-blue-600"}`} />
                                <span className="font-medium">AI HR Assistant</span>
                            </div>
                            {isChatbot && <ChevronRight className="w-4 h-4 text-blue-200" />}
                        </Link>
                    </nav>
                </div>

                <div className="p-6 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-xl transition-colors group"
                    >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Sign Out</span>
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4 font-medium">© 2026 Xelpmoc Design</p>
                </div>
            </motion.div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden bg-slate-50/50 flex flex-col relative">
                {/* Decorative background blur */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

                <div className="flex-1 overflow-auto p-4 sm:p-8 z-10">
                    {isChatbot ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="h-full bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden flex flex-col"
                        >
                            <Outlet />
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-5xl mx-auto space-y-6"
                        >
                            <header className="mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Your Profile</h2>
                                <p className="text-gray-500 mt-1">Manage your employment history and personal details.</p>
                            </header>

                            {isLoading ? (
                                <div className="flex justify-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                    {/* Personal Info Card */}
                                    <div className="xl:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-gray-800 flex items-center">
                                                <UserIcon className="w-5 h-5 text-blue-500 mr-2" />
                                                Personal Info
                                            </h3>
                                            {!isEditing ? (
                                                <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button onClick={() => setIsEditing(false)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {isEditing ? (
                                                <motion.div
                                                    key="edit"
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                    className="space-y-4"
                                                >
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">First Name</label>
                                                        <input type="text" value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Last Name</label>
                                                        <input type="text" value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Email</label>
                                                        <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                                    </div>
                                                    <button onClick={handleSaveProfile} disabled={saveLoading} className="w-full flex justify-center items-center py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                                                        {saveLoading ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                                                    </button>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="view"
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                    className="space-y-5"
                                                >
                                                    <div className="flex flex-col items-center py-4">
                                                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/30 mb-4">
                                                            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                                                        </div>
                                                        <h4 className="text-xl font-bold text-gray-800">{profile?.first_name} {profile?.last_name}</h4>
                                                        <p className="text-gray-500 text-sm">{profile?.email}</p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="mt-8 bg-blue-50 p-5 rounded-2xl border border-blue-100 cursor-pointer group hover:bg-blue-100 transition-colors" onClick={() => navigate('/dashboard/chatbot')}>
                                            <div className="flex items-center space-x-3 mb-2">
                                                <MessageSquare className="w-5 h-5 text-blue-600" />
                                                <h4 className="font-semibold text-blue-800">AI Assistant</h4>
                                            </div>
                                            <p className="text-sm text-blue-600/80 mb-3">To update your employment records below, simply ask the AI.</p>
                                            <span className="text-blue-700 text-sm font-bold flex items-center group-hover:translate-x-1 transition-transform">
                                                Open Chatbot <ArrowRight className="w-4 h-4 ml-1" />
                                            </span>
                                        </div>
                                    </div>

                                    {/* Employment History List */}
                                    <div className="xl:col-span-2 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-gray-800 flex items-center">
                                                <Briefcase className="w-5 h-5 text-blue-500 mr-2" />
                                                Employment History
                                            </h3>
                                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                                                {employments.length} {employments.length === 1 ? 'Record' : 'Records'}
                                            </span>
                                        </div>

                                        {employments.length > 0 ? (
                                            <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-4 before:w-0.5 before:bg-gray-100">
                                                {employments.map((emp, idx) => (
                                                    <motion.div
                                                        key={emp.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        className="relative pl-10"
                                                    >
                                                        <div className="absolute left-0 top-1.5 w-8 h-8 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center shadow-sm z-10">
                                                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                                        </div>
                                                        <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl hover:shadow-md transition-shadow group">
                                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                                                                <h4 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{emp.company_name}</h4>
                                                                <span className="inline-flex items-center text-xs font-semibold text-gray-500 bg-white px-2.5 py-1 rounded-lg border border-gray-200 mt-2 sm:mt-0">
                                                                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                                                                    {formatDate(emp.from_date)} - {emp.is_currently_working || !emp.to_date ? 'Present' : formatDate(emp.to_date)}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-500">Record ID: #{emp.id}</p>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 px-4 rounded-2xl bg-gray-50 border border-gray-100 border-dashed">
                                                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                <h4 className="text-gray-800 font-semibold mb-1">No employment records yet</h4>
                                                <p className="text-gray-500 text-sm max-w-sm mx-auto">Open the AI HR Assistant from the menu to easily add your first role chronologically.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
