// app/(routes)/companion/[id]/session/page.tsx
'use server';

import { getCompanion } from "@/lib/actions/companion.actions"; // Adjust path if needed
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getSubjectColor } from "@/lib/utils"; // Adjust path if needed
import Image from "next/image";
import CompanionComponent from "@/components/CompanionComponent"; // Adjust path if needed

interface CompanionSessionPageProps {
    params: { id: string };
}

// Define a type for your companion object if not already available
// This should match the structure returned by getCompanion
interface CompanionData {
    id: string;
    name: string | null | undefined;
    subject: string | null | undefined;
    title?: string | null | undefined; // Optional
    topic?: string | null | undefined; // Optional
    duration: number | string | null | undefined; // Can be string like "30" or number
    style?: string | null | undefined;
    voice?: string | null | undefined;
    // Add other fields from your companion model
}

const CompanionSession = async ({ params }: CompanionSessionPageProps) => {
    const { id } = params;
    const user = await currentUser();

    if (!user) {
        redirect('/sign-in');
        return null; // Important for TypeScript control flow
    }

    const companion: CompanionData | null = await getCompanion(id);

    // Validate essential companion data
    if (!companion) {
        // console.warn(`Companion not found for ID: ${id}. Redirecting.`);
        redirect('/companions');
        return null;
    }

    const name = companion.name;
    const subject = companion.subject;
    const rawTopic = companion.topic || companion.title;

    if (typeof name !== 'string' || !name.trim() ||
        typeof subject !== 'string' || !subject.trim() ||
        typeof rawTopic !== 'string' || !rawTopic.trim()) {
        // console.warn(`Essential companion data (name, subject, topic) is missing or invalid for ID: ${id}. Redirecting.`);
        redirect('/companions');
        return null;
    }

    // Prepare style and voice with defaults, ensuring they are strings
    const finalStyle = (typeof companion.style === 'string' && companion.style.trim())
        ? companion.style.trim()
        : 'conversational';

    const finalVoice = (typeof companion.voice === 'string' && companion.voice.trim())
        ? companion.voice.trim()
        : 'default';
        
    const displayDuration = companion.duration ? String(companion.duration) : "N/A";


    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 space-y-6">
            {/* Header Section */}
            <article className="flex rounded-xl justify-between p-6 max-md:flex-col bg-white shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-6">
                    <div
                        className="size-[80px] flex items-center justify-center rounded-xl max-md:hidden transition-all duration-300 hover:scale-110 shadow-md"
                        style={{ backgroundColor: getSubjectColor(subject) }} // subject is now a validated string
                    >
                        <Image
                            src={`/icons/${subject}.svg`}
                            alt={subject}
                            width={40}
                            height={40}
                            className="filter brightness-0 invert"
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4 flex-wrap">
                            <h1 className="font-bold text-3xl text-gray-900 tracking-tight">
                                {name} {/* name is now a validated string */}
                            </h1>
                            <div className="subject-badge max-sm:hidden bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                                {subject} {/* subject is now a validated string */}
                            </div>
                        </div>
                        <p className="text-xl text-gray-700 font-medium leading-relaxed">{rawTopic}</p> {/* rawTopic is now a validated string */}
                        <div className="flex flex-wrap gap-3 text-sm">
                            {companion.style && (
                                <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                    <span className="font-medium capitalize">{finalStyle}</span>
                                </div>
                            )}
                            {companion.voice && (
                                <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                    <span className="font-medium">{finalVoice}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-3 max-md:mt-6 max-md:items-start">
                    <div className="flex items-center gap-2 text-3xl font-bold text-gray-900 max-md:text-2xl">
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {displayDuration} minutes
                    </div>
                    <div className="text-sm text-gray-500 bg-gradient-to-r from-green-100 to-green-200 px-4 py-2 rounded-full font-medium">
                        Session Duration
                    </div>
                </div>
            </article>

            {/* Notices Section */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-blue-900 text-lg mb-2">AI-Powered Learning</h3>
                            <p className="text-sm text-blue-700 leading-relaxed">This session uses Google Gemini AI for intelligent, personalized conversations. Ensure your microphone is enabled for the optimal interactive experience.</p>
                            <div className="mt-3 flex items-center gap-2 text-xs text-blue-600"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span className="font-medium">AI Ready</span></div>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 via-amber-50 to-orange-100 border border-amber-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" /></svg>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-amber-900 text-lg mb-2">Browser Requirements</h4>
                            <p className="text-sm text-amber-700 leading-relaxed mb-3">Voice recognition works optimally in Chrome, Edge, and Safari. HTTPS connection is required for all voice features.</p>
                            <div className="flex flex-wrap gap-2">{['Chrome', 'Edge', 'Safari'].map((browser) => (<span key={browser} className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-medium">{browser}</span>))}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Start Tips */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-purple-900 text-lg mb-3">Quick Start Tips</h4>
                        <div className="grid sm:grid-cols-2 gap-3 text-sm text-purple-700">
                            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div><span>Click "Start Voice Session" to begin</span></div>
                            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div><span>Press Space to toggle microphone</span></div>
                            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div><span>Speak naturally for best results</span></div>
                            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div><span>AI responds with voice and text</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Session Stats */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h4 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" /></svg>
                    Session Overview
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg"><div className="text-2xl font-bold text-blue-600">{displayDuration}</div><div className="text-sm text-gray-600">Minutes</div></div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg"><div className="text-2xl font-bold text-green-600">AI</div><div className="text-sm text-gray-600">Powered</div></div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg"><div className="text-2xl font-bold text-purple-600">Voice</div><div className="text-sm text-gray-600">Interactive</div></div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg"><div className="text-2xl font-bold text-orange-600">{subject}</div><div className="text-sm text-gray-600">Subject</div></div>
                </div>
            </div>

            {/* Main Component */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <CompanionComponent
                    companionId={id}
                    subject={subject} // Validated non-empty string
                    topic={rawTopic}   // Validated non-empty string
                    name={name}     // Validated non-empty string
                    userName={user.firstName || 'User'} // user is non-null here
                    userImage={user.imageUrl || '/images/default-user.png'} // Consistent default path
                    style={finalStyle} // Guaranteed string
                    voice={finalVoice} // Guaranteed string
                />
            </div>
        </main>
    );
}

export default CompanionSession;