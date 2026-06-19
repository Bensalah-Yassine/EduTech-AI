'use client';

import {useEffect, useRef, useState} from 'react'
import {cn, getSubjectColor} from "@/lib/utils";
import {apiService, ApiMessage} from "@/lib/api.service"; // Replaced Vapi import
import Image from "next/image";
import Lottie, {LottieRefCurrentProps} from "lottie-react";
import soundwaves from '@/constants/soundwaves.json'

// Updated enum for call status
enum CallStatus {
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED',
}

// Updated component props interface
interface CompanionComponentProps {
    companionId: string;
    subject: string;
    topic: string;
    name: string;
    userName: string;
    userImage: string;
    voice: string;
    style: string;
}

const CompanionComponent = ({ subject, topic, name, userName, userImage, style, voice }: CompanionComponentProps) => {
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [messages, setMessages] = useState<ApiMessage[]>([]); // Updated type

    const lottieRef = useRef<LottieRefCurrentProps>(null);

    useEffect(() => {
        if(lottieRef.current) {
            if(isSpeaking) {
                lottieRef.current?.play()
            } else {
                lottieRef.current?.stop()
            }
        }
    }, [isSpeaking, lottieRef])

    useEffect(() => {
        // Updated event handlers to use apiService
        const onCallStart = () => setCallStatus(CallStatus.ACTIVE);

        const onCallEnd = () => {
            setCallStatus(CallStatus.FINISHED);
        }

        const onMessage = (message: ApiMessage) => {
            // Only show messages in the UI, no need to save to history in this component
            setMessages((prev) => [message, ...prev])
        }

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);

        // Register event listeners
        apiService.on('call-start', onCallStart);
        apiService.on('call-end', onCallEnd);
        apiService.on('message', onMessage);
        apiService.on('speech-start', onSpeechStart);
        apiService.on('speech-end', onSpeechEnd);

        // Cleanup function
        return () => {
            apiService.off('call-start', onCallStart);
            apiService.off('call-end', onCallEnd);
            apiService.off('message', onMessage);
            apiService.off('speech-start', onSpeechStart);
            apiService.off('speech-end', onSpeechEnd);
        }
    }, []);

    const toggleMicrophone = () => {
        apiService.toggleMute();
        setIsMuted(apiService.getMuted());
    }

    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING)

        // Connect to our API service instead of Vapi
        try {
            await apiService.connect({ subject, topic, style, voice });
        } catch (error) {
            console.error('Connection error:', error);
            setCallStatus(CallStatus.INACTIVE);
        }
    }

    const handleDisconnect = () => {
        setCallStatus(CallStatus.FINISHED)
        apiService.disconnect()
    }

    return (
        <section className="flex flex-col h-[80vh] max-w-6xl mx-auto w-full">
            <div className="flex flex-col md:flex-row gap-8 mb-6">
                <div className="flex flex-col items-center w-full md:w-2/5">
                    <div 
                        className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl shadow-lg flex items-center justify-center overflow-hidden border-4 border-white"
                        style={{ backgroundColor: getSubjectColor(subject)}}
                    >
                        <div
                            className={cn(
                                'absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-in-out',
                                callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE ? 'opacity-100' : 'opacity-0',
                                callStatus === CallStatus.CONNECTING && 'opacity-100 animate-pulse'
                            )}
                        >
                            <Image 
                                src={`/icons/${subject}.svg`} 
                                alt={subject} 
                                width={150} 
                                height={150} 
                                className="drop-shadow-lg"
                            />
                        </div>

                        <div 
                            className={cn(
                                'absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-in-out',
                                callStatus === CallStatus.ACTIVE ? 'opacity-100' : 'opacity-0'
                            )}
                        >
                            <Lottie
                                lottieRef={lottieRef}
                                animationData={soundwaves}
                                autoplay={false}
                                className="w-full h-full"
                            />
                        </div>
                    </div>
                    
                    <div className="mt-4 text-center">
                        <h2 className="text-2xl font-bold">{name}</h2>
                        <p className="text-muted-foreground capitalize">{subject} • {topic}</p>
                    </div>
                </div>

                <div className="flex flex-col w-full md:w-3/5">
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-lg h-full flex flex-col">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative">
                                <Image 
                                    src={userImage} 
                                    alt={userName} 
                                    width={60} 
                                    height={60} 
                                    className="rounded-full border-2 border-primary"
                                />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold">{userName}</h3>
                                <p className="text-sm text-muted-foreground">Learner</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 mt-auto">
                            <button 
                                className="flex items-center justify-center gap-3 bg-card border border-border rounded-xl p-4 hover:bg-accent transition-colors"
                                onClick={toggleMicrophone} 
                                disabled={callStatus !== CallStatus.ACTIVE}
                            >
                                <Image 
                                    src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'} 
                                    alt="microphone" 
                                    width={24} 
                                    height={24} 
                                />
                                <span className="font-medium">
                                    {isMuted ? 'Microphone Off' : 'Microphone On'}
                                </span>
                            </button>
                            
                            <button 
                                className={cn(
                                    'rounded-xl py-4 cursor-pointer transition-all w-full text-white font-semibold text-lg flex items-center justify-center gap-2',
                                    callStatus === CallStatus.ACTIVE 
                                        ? 'bg-red-600 hover:bg-red-700' 
                                        : 'bg-primary hover:bg-primary/90',
                                    callStatus === CallStatus.CONNECTING && 'animate-pulse'
                                )} 
                                onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall}
                            >
                                {callStatus === CallStatus.ACTIVE ? (
                                    <>
                                        <Image src="/icons/call-end.svg" alt="end" width={20} height={20} />
                                        End Session
                                    </>
                                ) : callStatus === CallStatus.CONNECTING ? (
                                    <>
                                        <Image src="/icons/loader.svg" alt="connecting" width={20} height={20} />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <Image src="/icons/call-start.svg" alt="start" width={20} height={20} />
                                        Start Learning Session
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <section className="flex-grow flex flex-col bg-card rounded-2xl border border-border p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Conversation</h3>
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-3 h-3 rounded-full",
                            callStatus === CallStatus.ACTIVE ? "bg-green-500 animate-pulse" : 
                            callStatus === CallStatus.CONNECTING ? "bg-yellow-500" : "bg-gray-300"
                        )}></div>
                        <span className="text-sm text-muted-foreground capitalize">
                            {callStatus === CallStatus.ACTIVE ? "In Session" : 
                             callStatus === CallStatus.CONNECTING ? "Connecting" : "Not in Session"}
                        </span>
                    </div>
                </div>
                
                <div className="flex-grow overflow-hidden">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            <p>Start a session to begin your conversation</p>
                        </div>
                    ) : (
                        <div className="transcript-message no-scrollbar h-full">
                            {messages.map((message, index) => {
                                if(message.role === 'assistant') {
                                    return (
                                        <div key={index} className="flex gap-3 mb-4">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                                <span className="text-primary-foreground text-xs font-bold">
                                                    {name.split(' ')[0].charAt(0)}
                                                </span>
                                            </div>
                                            <div className="flex-grow">
                                                <p className="font-semibold text-sm">{name.split(' ')[0]}</p>
                                                <div className="bg-muted rounded-lg p-3 mt-1">
                                                    <p className="text-foreground">{message.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                } else {
                                    return (
                                        <div key={index} className="flex gap-3 mb-4 justify-end">
                                            <div className="flex-grow flex flex-col items-end">
                                                <p className="font-semibold text-sm text-right">{userName}</p>
                                                <div className="bg-primary rounded-lg p-3 mt-1">
                                                    <p className="text-primary-foreground">{message.content}</p>
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                                                <span className="text-accent-foreground text-xs font-bold">
                                                    {userName.charAt(0)}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                }
                            })}
                        </div>
                    )}
                </div>
                
                <div className="transcript-fade" />
            </section>
        </section>
    )
}

export default CompanionComponent