import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { User, Mail, Lock, UserPlus, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Signup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        confirm_password: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (formData.password !== formData.confirm_password) {
            setError("Passwords do not match");
            return;
        }
        setIsLoading(true);
        try {
            await axios.post("/auth/signup", formData);
            navigate("/login");
        } catch (err: any) {
            setError(err.response?.data?.error || "Signup failed");
            setIsLoading(false);
        }
    };

    const inputClasses = "w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 hover:border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all focus:bg-white";
    const labelClasses = "block mb-1.5 text-sm font-medium text-gray-700 ml-1";
    const iconClasses = "absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none";

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden py-10">
            {/* Background design elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/10 blur-[120px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg bg-white/80 backdrop-blur-xl shadow-2xl shadow-blue-900/5 rounded-3xl p-8 border border-white z-10"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ rotate: -180, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ duration: 0.6, type: "spring" }}
                        className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4"
                    >
                        <UserPlus className="text-white w-8 h-8 ml-1" />
                    </motion.div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Create Account</h2>
                    <p className="text-gray-500">Join us to manage your employment history</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-1/2">
                            <label className={labelClasses}>First Name</label>
                            <div className="relative group">
                                <div className={iconClasses}>
                                    <User className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input type="text" name="first_name" className={inputClasses} placeholder="John" onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="w-full sm:w-1/2">
                            <label className={labelClasses}>Last Name</label>
                            <div className="relative group">
                                <div className={iconClasses}>
                                    <User className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input type="text" name="last_name" className={inputClasses} placeholder="Doe" onChange={handleChange} required />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={labelClasses}>Email Address</label>
                        <div className="relative group">
                            <div className={iconClasses}>
                                <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input type="email" name="email" className={inputClasses} placeholder="john@example.com" onChange={handleChange} required />
                        </div>
                    </div>

                    <div>
                        <label className={labelClasses}>Password</label>
                        <div className="relative group">
                            <div className={iconClasses}>
                                <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input type="password" name="password" className={inputClasses} placeholder="••••••••" onChange={handleChange} required />
                        </div>
                    </div>

                    <div>
                        <label className={labelClasses}>Confirm Password</label>
                        <div className="relative group">
                            <div className={iconClasses}>
                                <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input type="password" name="confirm_password" className={inputClasses} placeholder="••••••••" onChange={handleChange} required />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 px-4 text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 rounded-xl transition-all font-semibold text-lg flex justify-center items-center group relative overflow-hidden mt-6"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>Create Account</span>
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-gray-500">
                    <p className="text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors underline decoration-blue-600/30 decoration-2 underline-offset-4">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
