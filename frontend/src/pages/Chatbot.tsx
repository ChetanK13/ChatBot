import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Send, Bot, User as UserIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    sender: "bot" | "user";
    text: string;
}

export default function Chatbot() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [options, setOptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchInit = async () => {
            try {
                setLoading(true);
                const res = await axios.get("/chatbot/init");
                addBotMessages(res.data.messages, res.data.options);
                setLoading(false);
            } catch (err) {
                setLoading(false);
                addBotMessages(["Sorry, could not connect to server."], []);
            }
        };
        fetchInit();
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading, options]);

    const addBotMessages = (msgs: string[], opts?: string[]) => {
        const formatted = msgs.map((m) => ({ sender: "bot" as const, text: m }));
        setMessages((prev) => [...prev, ...formatted]);
        setOptions(opts || []);
    };

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        setMessages((prev) => [...prev, { sender: "user", text }]);
        setInput("");
        setOptions([]);
        setLoading(true);

        try {
            const res = await axios.post("/chatbot/message", { message: text });
            addBotMessages(res.data.messages, res.data.options);
        } catch (err) {
            addBotMessages(["Error: Something went wrong processing your request. Type 'cancel' to reset."], []);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionClick = (option: string) => {
        sendMessage(option);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            sendMessage(input);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative font-sans">
            {/* Header */}
            <div className="flex items-center space-x-3 px-6 py-4 border-b border-gray-100 bg-white shadow-sm z-10 sticky top-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <Bot className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-800">HR Assistant</h2>
                    <p className="text-xs text-green-500 font-medium flex items-center">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                        Online
                    </p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
                <AnimatePresence>
                    {messages.map((msg, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            key={index}
                            className={`flex items-end space-x-2 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                            {msg.sender === "bot" && (
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 mb-1">
                                    <Bot className="w-4 h-4" />
                                </div>
                            )}

                            <div
                                className={`max-w-[75%] px-5 py-3.5 shadow-sm whitespace-pre-line text-[15px] leading-relaxed
                                ${msg.sender === "user"
                                        ? "bg-blue-600 text-white rounded-2xl rounded-br-sm shadow-blue-600/20"
                                        : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-sm"
                                    }`}
                            >
                                {msg.text}
                            </div>

                            {msg.sender === "user" && (
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0 mb-1">
                                    <UserIcon className="w-4 h-4" />
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-end space-x-2 justify-start"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 mb-1">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-white border border-gray-100 px-5 py-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center space-x-1.5 w-20">
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={bottomRef} className="h-2" />
            </div>

            {/* Options & Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)] sticky bottom-0 z-10 w-full flex flex-col items-center">
                <AnimatePresence>
                    {options.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10, height: 0 }}
                            className="flex flex-wrap gap-2 mb-4 w-full justify-center"
                        >
                            {options.map((opt, i) => (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    key={i}
                                    onClick={() => handleOptionClick(opt)}
                                    className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-full text-sm font-semibold transition-colors border border-blue-200 shadow-sm"
                                >
                                    {opt}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center space-x-2 w-full mx-auto relative group">
                    <input
                        type="text"
                        className="flex-1 pl-6 pr-14 py-4 border border-gray-200 hover:border-blue-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-gray-50 hover:bg-white focus:bg-white transition-all shadow-sm text-[15px] placeholder-gray-400"
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={loading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0 shadow-md transform hover:scale-105"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -ml-0.5 mt-0.5" />}
                    </button>
                </div>
                <p className="text-[11px] text-center text-gray-400/80 mt-3 font-medium tracking-wide w-full">
                    Type "cancel" or "restart" to reset the conversation at any time.
                </p>
            </div>
        </div>
    );
}
