'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from "next/image";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import soundwaves from '@/constants/soundwaves.json'; // Ensure this path is correct
import { addToSessionHistory } from "@/lib/actions/companion.actions";
import {
    cn,
    getSubjectColor,
    configureGeminiAssistant,
    selectOptimalVoice,
    getVoicePreferences,
    handleSpeechError,
    createSessionConfig,
    SessionConfig // Import the SessionConfig type
} from "@/lib/utils";

enum CallStatus {
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED',
}

enum VoiceGender {
    MALE = 'male',
    FEMALE = 'female'
}

interface GeminiMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface CompanionComponentProps {
    companionId: string;
    subject: string;
    topic: string;
    name: string;
    userName: string;
    userImage: string;
    style: string;
    voice: string;
}

const CompanionComponent = ({
    companionId,
    subject,
    topic,
    name,
    userName,
    userImage,
    style,
    voice
}: CompanionComponentProps) => {
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [messages, setMessages] = useState<GeminiMessage[]>([]);
    const [selectedVoiceGender, setSelectedVoiceGender] = useState<VoiceGender>(VoiceGender.FEMALE);
    const [isTyping, setIsTyping] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [voicesLoaded, setVoicesLoaded] = useState(false);
    const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);

    const lottieRef = useRef<LottieRefCurrentProps>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
    const conversationHistory = useRef<GeminiMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const config = createSessionConfig(companionId, subject, topic, name, style, voice);
        setSessionConfig(config);
    }, [companionId, subject, topic, name, style, voice]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const speechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
            const speechSynthesisSupported = 'speechSynthesis' in window;
            setSpeechSupported(speechRecognitionSupported && speechSynthesisSupported);

            if (speechSynthesisSupported) {
                const loadVoices = () => {
                    const synthVoices = window.speechSynthesis.getVoices();
                    if (synthVoices.length > 0) {
                        setVoicesLoaded(true);
                        if (window.speechSynthesis.onvoiceschanged) {
                            window.speechSynthesis.onvoiceschanged = null;
                        }
                    }
                };
                if (window.speechSynthesis.getVoices().length === 0) {
                    window.speechSynthesis.onvoiceschanged = loadVoices;
                } else {
                    loadVoices(); // Call it directly if voices are already loaded
                }
            }
        }
        // Cleanup onvoiceschanged
        return () => {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.onvoiceschanged = null;
            }
        };
    }, []); // Run once on mount to set up voice loading

    const callGeminiAPI = useCallback(async (userMessage: string): Promise<string> => {
        try {
            const systemPromptToUse = sessionConfig?.systemPrompt ??
                configureGeminiAssistant({ voice, style, subject, topic, name });

            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: systemPromptToUse },
                        ...conversationHistory.current,
                        { role: 'user', content: userMessage }
                    ]
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error: ${response.status} - ${errorText}`);
                if (response.status === 429) return "I'm experiencing high demand. Please try again later.";
                return `I encountered an issue (Error ${response.status}). Please try again.`;
            }
            const data = await response.json();
            return data.response || "I'm sorry, I didn't get a proper response. Try again?";
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            return "I'm having trouble connecting. Check your internet and try again.";
        }
    }, [sessionConfig, voice, style, subject, topic, name]); // Dependencies for callGeminiAPI

    const speakText = useCallback((text: string) => {
        if (!speechSupported || !voicesLoaded || !text.trim()) {
            if (!voicesLoaded) console.warn("SpeakText called before voices loaded.");
            setIsSpeaking(false);
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        synthesisRef.current = utterance;

        const allVoices = window.speechSynthesis.getVoices();
        if (allVoices.length === 0) {
            console.warn("No voices available for speech synthesis.");
            setIsSpeaking(false);
            return;
        }
        const selectedSpVoice = selectOptimalVoice(allVoices, selectedVoiceGender, voice);

        if (selectedSpVoice) {
            utterance.voice = selectedSpVoice;
        } else {
            console.warn("Could not find an optimal voice, using default.");
        }

        const voicePrefs = getVoicePreferences(voice);
        utterance.rate = voicePrefs.rate;
        utterance.pitch = selectedVoiceGender === VoiceGender.MALE && selectedSpVoice?.name.toLowerCase().includes('male')
            ? voicePrefs.pitch * 0.9
            : voicePrefs.pitch;
        utterance.volume = voicePrefs.volume;

        utterance.onstart = () => {
            setIsSpeaking(true);
            recognitionRef.current?.stop();
        };
        utterance.onend = () => {
            setIsSpeaking(false);
            if (callStatus === CallStatus.ACTIVE && !isMuted && recognitionRef.current) {
                try { recognitionRef.current.start(); }
                catch (e) { console.error("Error restarting recognition after speech", e); }
            }
        };
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            setIsSpeaking(false);
            if (callStatus === CallStatus.ACTIVE && !isMuted && recognitionRef.current) {
                try { recognitionRef.current.start(); }
                catch (e) { console.error("Error restarting recognition after speech error", e); }
            }
        };
        window.speechSynthesis.speak(utterance);
    }, [speechSupported, voicesLoaded, selectedVoiceGender, voice, callStatus, isMuted]); // Dependencies for speakText

    const handleUserMessage = useCallback(async (content: string) => {
        if (!content.trim() || isTyping) return;

        const userMsg: GeminiMessage = { role: 'user', content: content.trim(), timestamp: new Date() };
        // Optimistic update for user message
        setMessages(prev => [userMsg, ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
        conversationHistory.current.push(userMsg);
        setIsTyping(true);

        try {
            const assistantResponse = await callGeminiAPI(content);
            const assistantMsg: GeminiMessage = { role: 'assistant', content: assistantResponse, timestamp: new Date() };
            setMessages(prev => [assistantMsg, ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
            conversationHistory.current.push(assistantMsg);
            if (callStatus === CallStatus.ACTIVE && !isMuted) {
                speakText(assistantResponse);
            }
        } catch (error) {
            console.error('Error processing message:', error);
            const errorMsg: GeminiMessage = { role: 'assistant', content: "I encountered an error processing your message. Please try again.", timestamp: new Date() };
            setMessages(prev => [errorMsg, ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
        } finally {
            setIsTyping(false);
        }
    }, [isTyping, callGeminiAPI, speakText, callStatus, isMuted]); // Dependencies for handleUserMessage


    useEffect(() => {
        if (typeof window !== 'undefined' && speechSupported) {
            const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
            if (!SpeechRecognition) {
                setSpeechSupported(false); // Should have been caught earlier, but good check
                return;
            }

            if (!recognitionRef.current) { // Initialize only once
                 recognitionRef.current = new SpeechRecognition();
            }
            const recognition = recognitionRef.current;
            recognition.continuous = true;
            recognition.interimResults = false; // Set to false if you only want final results
            recognition.lang = 'en-US';
            recognition.maxAlternatives = 1;

            recognition.onstart = () => setIsListening(true);

            recognition.onend = () => {
                setIsListening(false);
                // Only auto-restart if the call is active and user is not muted
                if (callStatus === CallStatus.ACTIVE && !isMuted && recognitionRef.current) {
                    setTimeout(() => { // Add a small delay
                        try {
                            // Double-check conditions before restarting
                            if (callStatus === CallStatus.ACTIVE && !isMuted) {
                                recognitionRef.current?.start();
                            }
                        } catch (error) {
                            // Avoid error if already started or in a bad state
                            if ((error as DOMException).name !== 'InvalidStateError') {
                                console.log('Recognition restart failed:', error);
                            }
                        }
                    }, 100);
                }
            };

            recognition.onresult = (event) => {
                const transcript = event.results[event.results.length - 1][0].transcript.trim();
                if (transcript) {
                    handleUserMessage(transcript);
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error, event.message);
                setIsListening(false);
                const errorMessage = handleSpeechError(event.error);
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    alert(errorMessage);
                    setSpeechSupported(false);
                }
                // For 'no-speech', it might auto-stop. onend will handle restart if needed.
            };
        }
        // Cleanup function for this effect
        return () => {
            recognitionRef.current?.abort(); // Abort to stop immediately and prevent onend restart
        };
    }, [speechSupported, callStatus, isMuted, handleUserMessage]); // Dependencies for speech recognition setup

    useEffect(() => {
        if (lottieRef.current) {
            if (isSpeaking || isListening || isTyping) {
                lottieRef.current.play();
            } else {
                lottieRef.current.stop();
            }
        }
    }, [isSpeaking, isListening, isTyping]);

    const toggleMicrophone = () => {
        if (!speechSupported || callStatus !== CallStatus.ACTIVE) {
            if (!speechSupported) alert('Speech recognition is not supported in this browser.');
            return;
        }
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        if (newMutedState) {
            recognitionRef.current?.stop(); // This will trigger onend
            // setIsListening(false); // onend will set this
        } else {
            // Unmuting: Start recognition if conditions are met
            if (recognitionRef.current && callStatus === CallStatus.ACTIVE) {
                try {
                    recognitionRef.current.start();
                } catch (error) {
                    if ((error as DOMException).name !== 'InvalidStateError') {
                        console.error('Failed to start recognition on unmute:', error);
                    }
                }
            }
        }
    };

    const handleCall = async () => {
        if (!speechSupported) {
            alert('Voice features are not supported. Use Chrome, Edge, or Safari with HTTPS.');
            return;
        }
        if (!voicesLoaded) {
            alert('Voices are still loading. Please wait a moment and try again.');
            return;
        }

        setCallStatus(CallStatus.CONNECTING);
        conversationHistory.current = [];
        setMessages([]);
        setIsTyping(false);
        setIsSpeaking(false);
        setIsListening(false);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate connection
            setCallStatus(CallStatus.ACTIVE);

            if (!isMuted && recognitionRef.current) {
                try { recognitionRef.current.start(); }
                catch (error) { console.error('Failed to start recognition on call start:', error); }
            }

            const dynamicGreeting = sessionConfig?.conversationStarter
                ? `Hello ${userName}! I'm ${name}, your ${subject} companion. ${sessionConfig.conversationStarter}`
                : `Hello ${userName}! I'm ${name}, your ${subject} companion. I'm excited to help you explore ${topic}. What would you like to discuss first?`;

            const greetingMsg: GeminiMessage = { role: 'assistant', content: dynamicGreeting, timestamp: new Date() };
            setMessages([greetingMsg]); // Ensure it's the first message
            conversationHistory.current.push(greetingMsg);
            speakText(dynamicGreeting);

        } catch (error) {
            console.error('Error starting session:', error);
            setCallStatus(CallStatus.INACTIVE);
            alert('Failed to start session. Please try again.');
        }
    };

    const handleDisconnect = async () => {
        setCallStatus(CallStatus.FINISHED);
        recognitionRef.current?.stop(); // This will trigger onend
        // setIsListening(false); // onend will handle this
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);

        if (conversationHistory.current.length > 0) {
            try {
                await addToSessionHistory(companionId);
                console.log('Session history saved for companion:', companionId);
            } catch (error) {
                console.error('Failed to save session history:', error);
            }
        }
        setTimeout(() => {
            setCallStatus(CallStatus.INACTIVE);
            setMessages([]); // Clear messages for next session
        }, 2000);
    };

    useEffect(() => {
        return () => { // Component unmount cleanup
            recognitionRef.current?.abort();
            recognitionRef.current = null;
            window.speechSynthesis?.cancel();
            synthesisRef.current = null;
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
            if (callStatus === CallStatus.ACTIVE && (e.code === 'Space' || e.key === ' ')) {
                e.preventDefault();
                toggleMicrophone();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [callStatus, toggleMicrophone]); // toggleMicrophone is a dependency

    if (!speechSupported && typeof window !== 'undefined') {
        return (
            <section className="flex items-center justify-center h-[60vh] p-4">
                <div className="text-center p-6 sm:p-8 bg-red-50 border border-red-200 rounded-lg shadow-md max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Voice Features Not Supported</h3>
                    <p className="text-red-700 text-sm mb-4">
                        This feature requires a modern browser like Chrome, Edge, or Safari, and access to your microphone. Please ensure you are using a compatible browser and have granted microphone permissions.
                    </p>
                    <p className="text-red-600 text-xs">
                        If the issue persists, try accessing this site over HTTPS.
                    </p>
                </div>
            </section>
        );
    }

    const sortedMessages = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const avatarBgColor = getSubjectColor(subject); // This now returns a string

    return (
        <section className="flex flex-col h-[80vh] max-h-[calc(100vh-100px)] w-full max-w-4xl mx-auto p-4">
            <section className="flex gap-4 sm:gap-8 max-sm:flex-col mb-4">
                {/* Companion Section */}
                <div className="companion-section flex-1 flex flex-col items-center p-4 border rounded-lg shadow-sm bg-white">
                    <div className="companion-avatar relative w-32 h-32 sm:w-40 sm:h-40 mb-3" style={{ backgroundColor: `${avatarBgColor}33`, borderRadius: '50%' }}>
                        <div className={cn('absolute inset-0 flex items-center justify-center transition-opacity duration-1000', callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE ? 'opacity-100' : 'opacity-0', callStatus === CallStatus.CONNECTING && 'opacity-100 animate-pulse')}>
                            <Image src={`/icons/${subject}.svg`} alt={subject} width={100} height={100} className="max-sm:w-20 max-sm:h-20" />
                        </div>
                        <div className={cn('absolute inset-0 flex items-center justify-center transition-opacity duration-1000', callStatus === CallStatus.ACTIVE ? 'opacity-100' : 'opacity-0')}>
                            <Lottie lottieRef={lottieRef} animationData={soundwaves} loop={true} autoplay={false} className="companion-lottie w-full h-full" />
                        </div>
                    </div>
                    <p className="font-bold text-xl sm:text-2xl text-gray-800">{name}</p>
                    {callStatus === CallStatus.ACTIVE && (
                        <div className="mt-2 flex flex-col items-center gap-1 text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", isListening ? "bg-green-500 animate-pulse" : (isMuted ? "bg-red-500" : "bg-gray-400"))} />
                                <span className="text-gray-600">{isListening ? "Listening..." : (isMuted ? "Muted" : "Ready")}</span>
                            </div>
                            {isTyping && <div className="flex items-center gap-1 text-blue-600"><div className="w-1 h-1 bg-current rounded-full animate-pulse"></div><div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div><div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div><span className="ml-1">Thinking...</span></div>}
                            {isSpeaking && <div className="text-purple-600 flex items-center gap-1"><div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>Speaking...</div>}
                        </div>
                    )}
                </div>

                {/* User Section */}
                <div className="user-section flex-1 flex flex-col items-center p-4 border rounded-lg shadow-sm bg-white">
                    <div className="user-avatar relative w-32 h-32 sm:w-40 sm:h-40 mb-3">
                        <Image src={userImage || '/images/default-user.png'} alt={userName} layout="fill" objectFit="cover" className="rounded-full" />
                    </div>
                    <p className="font-bold text-xl sm:text-2xl text-gray-800">{userName}</p>
                    <button
                        className={cn("btn-mic mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors w-full max-w-xs", isMuted ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-green-50 text-green-700 hover:bg-green-100", callStatus !== CallStatus.ACTIVE && "opacity-50 cursor-not-allowed")}
                        onClick={toggleMicrophone}
                        disabled={callStatus !== CallStatus.ACTIVE}
                        title={callStatus === CallStatus.ACTIVE ? (isMuted ? 'Click to unmute (or press Space)' : 'Click to mute (or press Space)') : 'Start session to use microphone'}
                    >
                        <Image src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'} alt="mic status" width={24} height={24} />
                        <span className="max-sm:hidden">{isMuted ? 'Unmute' : 'Mute'}</span>
                        <span className="sm:hidden">{isMuted ? 'Off' : 'On'}</span>
                    </button>
                    <button
                        className={cn('mt-2 rounded-lg py-2.5 px-4 cursor-pointer transition-all duration-150 w-full max-w-xs text-white font-medium', callStatus === CallStatus.ACTIVE ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-md hover:shadow-lg' : 'bg-primary hover:bg-primary/90 active:bg-primary/80 shadow-md hover:shadow-lg', callStatus === CallStatus.CONNECTING && 'bg-gray-400 animate-pulse cursor-not-allowed', callStatus === CallStatus.FINISHED && 'bg-gray-500 cursor-not-allowed')}
                        onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall}
                        disabled={callStatus === CallStatus.CONNECTING || callStatus === CallStatus.FINISHED || (!voicesLoaded && callStatus === CallStatus.INACTIVE)}
                    >
                        {callStatus === CallStatus.ACTIVE ? "End Session"
                            : callStatus === CallStatus.CONNECTING ? 'Connecting...'
                                : callStatus === CallStatus.FINISHED ? 'Session Ended'
                                    : 'Start Voice Session'}
                    </button>
                </div>
            </section>

            {/* Transcript Section */}
            <section className="transcript flex-1 mt-1 border rounded-lg shadow-sm bg-white overflow-hidden">
                <div className="transcript-message h-full overflow-y-auto p-4 space-y-4 no-scrollbar">
                    {sortedMessages.length === 0 && callStatus === CallStatus.ACTIVE && (
                        <div className="text-center text-gray-500 py-8">
                            <p className="text-lg">Voice session started!</p>
                            <p className="text-sm mt-1">Start speaking to begin the conversation.</p>
                            <p className="text-xs text-gray-400 mt-2">(Press Space to toggle microphone)</p>
                        </div>
                    )}
                    {sortedMessages.length === 0 && callStatus === CallStatus.INACTIVE && (
                        <div className="text-center text-gray-400 py-8">
                            <p className="text-lg">Ready to Chat?</p>
                            <p className="text-sm mt-1">Click "Start Voice Session" to begin.</p>
                        </div>
                    )}
                    {sortedMessages.map((message, index) => {
                        const timeStr = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        if (message.role === 'assistant') {
                            return (
                                <div key={index} className="flex items-start gap-2.5 animate-fadeIn">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 mt-1" style={{ backgroundColor: avatarBgColor }}>
                                        {name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col gap-1 w-full max-w-[calc(100%-40px-10px)]">
                                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                            <span className="text-sm font-semibold text-gray-900">{name.split(' ')[0].replace(/[.,]/g, '')}</span>
                                            <span className="text-xs font-normal text-gray-500">{timeStr}</span>
                                        </div>
                                        <p className="text-sm font-normal py-2.5 px-3.5 text-gray-800 bg-gray-100 rounded-e-xl rounded-es-xl inline-block break-words">
                                            {message.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        } else { // User's message
                            return (
                                <div key={index} className="flex items-start justify-end gap-2.5 animate-fadeIn">
                                    <div className="flex flex-col gap-1 w-full max-w-[calc(100%-40px-10px)] items-end">
                                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                            <span className="text-sm font-semibold text-gray-900">{userName}</span>
                                            <span className="text-xs font-normal text-gray-500">{timeStr}</span>
                                        </div>
                                        <p className="text-sm font-normal py-2.5 px-3.5 text-white bg-primary rounded-s-xl rounded-ee-xl inline-block break-words text-left">
                                            {message.content}
                                        </p>
                                    </div>
                                    <Image src={userImage || '/images/default-user.png'} alt={userName} width={32} height={32} className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
                                </div>
                            );
                        }
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </section>
        </section>
    );
};

export default CompanionComponent;