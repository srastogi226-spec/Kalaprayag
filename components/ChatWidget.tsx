import React, { useState, useEffect, useRef } from 'react';

interface Message {
    id: string;
    role: 'assistant' | 'user';
    content: string;
    timestamp: string;
}

const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [hasStartedChat, setHasStartedChat] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    // Replace with actual key or provided via props/env
    const SARVAM_API_KEY = 'sk_1kg55j8i_XlET8vbS11D3TIP2XvpD2Z0r';

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-IN'; // Default to Indian English/Hindi context

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
                setIsListening(false);
                handleSend(transcript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech Recognition Error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const handleVoiceInput = () => {
        if (!recognitionRef.current) {
            alert('Voice recognition is not supported in this browser.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        // Opening message
        if (messages.length === 0) {
            setTimeout(() => {
                const openingMsg: Message = {
                    id: 'welcome',
                    role: 'assistant',
                    content: "Namaste! 🙏 Welcome to Kala Prayag.\n\nI am here to help you discover handcrafted treasures, book workshops, or commission a bespoke piece.\n\nHow can I help you today?",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages([openingMsg]);
            }, 1000);
        }
    }, []);

    const handleSend = async (content: string) => {
        if (!content.trim()) return;

        setHasStartedChat(true);
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const history = messages.map(m => ({
                role: m.role,
                content: m.content
            }));
            history.push({ role: 'user', content });

            const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-subscription-key': SARVAM_API_KEY
                },
                body: JSON.stringify({
                    model: 'sarvam-m',
                    messages: [
                        {
                            role: 'system',
                            content: "You are 'Bani' — a warm, knowledgeable assistant for Kala Prayag. \n\nOUR PRODUCTS & OFFERS:\n1. Handcrafted Pottery & Vases (Blue pottery, terracotta)\n2. Wall Art & Sculptures (Brass work, Dhokra art)\n3. Textiles (Hand-block prints, woven throws)\n4. Brass Lighting (Lamps, scones)\n5. Custom Studio: We take bespoke commissions.\n6. Workshops: pottery and brass casting sessions.\n\nTONE: Warm, quiet luxury, poetic. Understand Hindi, Hinglish, and English. Reply in the same language as the user.\n\nIMPORTANT: Be descriptive. Ensure your answer is complete."
                        },
                        ...history
                    ],
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error Status:', response.status);
                console.error('API Error Response:', errorData);
                throw new Error(errorData.message || `API Error: ${response.status}`);
            }

            const data = await response.json();
            let assistantContent = data.choices[0]?.message?.content || data.choices[0]?.message?.reasoning_content || "";

            // Clean <think> tags from Sarvam-m responses
            if (assistantContent.includes('<think>')) {
                const parts = assistantContent.split('</think>');
                if (parts.length > 1 && parts[1].trim()) {
                    // Extract only the part AFTER the closing think tag
                    assistantContent = parts[1].trim();
                } else {
                    // If no closing tag or nothing after it, just strip the opening/closing tags themselves
                    assistantContent = assistantContent.replace(/<\/?think>/g, '').trim();
                }
            }

            if (!assistantContent) {
                assistantContent = "I am pondering our craft stories... Could you please share more about what you are looking for?";
                console.warn('Empty AI response received', data);
            }

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: assistantContent,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (error: any) {
            console.error('Chat Error:', error);
            // Fallback message if API fails or key is missing
            const errorMsg: Message = {
                id: 'error',
                role: 'assistant',
                content: `I apologize, but I'm having a quiet moment (${error.message || 'Connection issue'}). Please try again or contact our creators directly.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const quickReplies = [
        "What handcrafted products do you have?",
        "Tell me about your workshops",
        "I want a custom piece made",
        "What are your prices?",
        "Who are your artisans?"
    ];

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) setUnreadCount(0);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[200] font-sans">
            {/* Trigger Button State */}
            {!isOpen && (
                <div className="relative flex flex-col items-end">
                    {/* Tooltip */}
                    <div className="mb-4 bg-white border border-[#E5E5E5] px-4 py-3 shadow-lg relative animate-tooltip-bounce whitespace-nowrap">
                        <p className="text-[#8B735B] font-bold text-xs uppercase tracking-wider leading-tight">Ask us anything</p>
                        <p className="text-[#999] text-[10px] lowercase tracking-wide mt-1">in Hindi or English</p>
                        <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-r border-b border-[#E5E5E5] rotate-45"></div>
                    </div>

                    {/* Button */}
                    <button
                        onClick={toggleOpen}
                        className="w-14 h-14 bg-[#2C2C2C] flex items-center justify-center relative shadow-xl hover:bg-black transition-all group"
                    >
                        <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#8B735B] rounded-full border-2 border-[#FAF9F6] flex items-center justify-center">
                                <span className="text-white text-[9px] font-bold">{unreadCount}</span>
                            </div>
                        )}
                    </button>
                </div>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="w-[360px] h-[520px] bg-[#FAF9F6] shadow-2xl flex flex-col relative animate-chat-window overflow-hidden">
                    {/* Header */}
                    <div className="bg-[#2C2C2C] p-4 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-[#8B735B] flex items-center justify-center shrink-0">
                                <span className="text-white text-xs font-bold tracking-tighter" style={{ fontFamily: "'Tiro Devanagari', serif" }}>KP</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white text-[11px] uppercase tracking-[0.2em] font-medium leading-none mb-1">Kala Prayag</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-[#999] text-[9px] uppercase tracking-widest font-light">Online · Replies instantly</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={toggleOpen} className="text-white/40 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Powered by strip */}
                    <div className="bg-[#F5F0E8] px-4 py-2 border-b border-[#E5E5E5] flex items-center gap-1 flex-wrap shrink-0">
                        <span className="text-[#999] text-[10px] font-light">Powered by</span>
                        <span className="text-[#8B735B] text-[10px] font-bold uppercase tracking-widest">Sarvam AI</span>
                        <span className="text-[#999] text-[10px] font-light ml-auto">· Understands Hindi & English</span>
                    </div>

                    {/* Messages area */}
                    <div className="flex-grow overflow-y-auto p-4 space-y-4 scroll-smooth">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-500`}>
                                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="w-6 h-6 bg-[#8B735B] flex items-center justify-center shrink-0 text-[8px] text-white font-bold tracking-tighter self-end mb-4">KP</div>
                                    )}
                                    <div className="flex flex-col">
                                        <div className={`p-3 text-[14px] leading-relaxed shadow-sm ${msg.role === 'user'
                                            ? 'bg-[#2C2C2C] text-white'
                                            : 'bg-white text-[#2C2C2C] border border-[#E5E5E5]'
                                            }`}>
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                        <span className={`text-[9px] text-[#BBB] mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>{msg.timestamp}</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start animate-in fade-in">
                                <div className="flex gap-2 items-end">
                                    <div className="w-6 h-6 bg-[#8B735B] flex items-center justify-center shrink-0 text-[8px] text-white font-bold tracking-tighter mb-4">KP</div>
                                    <div className="flex flex-col">
                                        <div className="bg-white border border-[#E5E5E5] px-4 py-3 shadow-sm flex gap-1 items-center h-[42px]">
                                            <div className="w-1 h-1 bg-[#8B735B] rounded-full animate-typing-dot"></div>
                                            <div className="w-1 h-1 bg-[#8B735B] rounded-full animate-typing-dot [animation-delay:150ms]"></div>
                                            <div className="w-1 h-1 bg-[#8B735B] rounded-full animate-typing-dot [animation-delay:300ms]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="pb-4" />
                    </div>

                    {/* Listening Overlay */}
                    {isListening && (
                        <div className="absolute inset-0 top-[110px] bottom-[54px] bg-[#FAF9F6]/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
                            <div className="flex items-center gap-1.5 h-12 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-1 bg-[#8B735B] rounded-full animate-soundwave"
                                        style={{
                                            height: `${[14, 28, 42, 28, 14][i]}px`,
                                            animationDelay: `${i * 150}ms`
                                        }}
                                    />
                                ))}
                            </div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-[#8B735B] font-bold">Listening...</p>
                            <button
                                onClick={() => setIsListening(false)}
                                className="mt-8 text-[9px] uppercase tracking-widest text-[#999] hover:text-[#2C2C2C] underline underline-offset-4"
                            >
                                Tap to cancel
                            </button>
                        </div>
                    )}

                    {/* Bottom Area */}
                    <div className="shrink-0">
                        {/* Quick Replies */}
                        {!hasStartedChat && (
                            <div className="px-4 py-3 bg-gradient-to-t from-[#FAF9F6] to-transparent">
                                <p className="text-[10px] uppercase tracking-widest text-[#999] mb-3 font-semibold">Quick Questions</p>
                                <div className="flex flex-wrap gap-2">
                                    {quickReplies.map((reply) => (
                                        <button
                                            key={reply}
                                            onClick={() => handleSend(reply)}
                                            className="px-3 py-1.5 border border-[#E5E5E5] text-[11px] text-[#666] bg-white transition-all hover:border-[#8B735B] hover:text-[#8B735B]"
                                        >
                                            {reply}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Bar */}
                        <div className="bg-white border-t border-[#E5E5E5] p-2 flex items-center gap-2">
                            <button
                                onClick={handleVoiceInput}
                                className={`w-9 h-9 flex items-center justify-center transition-all ${isListening ? 'bg-[#8B735B] text-white' : 'text-[#999] hover:text-[#8B735B] hover:bg-[#F5F5F5]'
                                    }`}
                                title="Speak"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </button>

                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend(inputValue)}
                                placeholder="Type in Hindi or English..."
                                className="flex-grow bg-transparent px-1 py-2 text-sm focus:outline-none placeholder:text-[#BBB]"
                                disabled={isTyping || isListening}
                            />
                            <button
                                onClick={() => handleSend(inputValue)}
                                disabled={!inputValue.trim() || isTyping || isListening}
                                className={`w-9 h-9 flex items-center justify-center transition-all ${!inputValue.trim() || isTyping || isListening
                                    ? 'bg-[#E5E5E5] text-white'
                                    : 'bg-[#2C2C2C] text-white hover:bg-[#8B735B]'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>

                        {/* Privacy footer */}
                        <div className="bg-[#FAF9F6] py-2 text-center border-t border-[#F0F0F0]">
                            <p className="text-[8px] uppercase tracking-[0.3em] text-[#BBB] font-medium">
                                🔒 Your conversation is private · Kala Prayag
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
