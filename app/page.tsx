import CompanionCard from "@/components/CompanionCard";
import CompanionsList from "@/components/CompanionList";
import CTA from "@/components/CTA";
import {recentSessions} from "@/constants";
import {getAllCompanions, getRecentSessions} from "@/lib/actions/companion.actions";
import {getSubjectColor} from "@/lib/utils";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import Dashboard from "@/components/Dashboard";

const Page = async () => {
    const user = await currentUser();
    
    // If user is authenticated, show their dashboard
    if (user) {
        try {
            const companions = await getAllCompanions({ limit: 3 });
            const recentSessionsCompanions = await getRecentSessions(10);

            return (
                <main className="py-6 flex flex-col gap-10">
                    <Dashboard 
                        userName={user.firstName || user.username || "Student"} 
                        userImage={user.imageUrl} 
                    />

                    <div className="w-full flex flex-col gap-6 max-w-[1300px] mx-auto px-4 md:px-0 mt-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold tracking-tight">AI Oral Companions</h2>
                            <Link href="/companions" className="text-sm font-semibold text-primary hover:underline">
                                View all companions
                            </Link>
                        </div>
                        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {companions.length > 0 ? (
                                companions.map((companion) => (
                                    <CompanionCard
                                        key={companion.id}
                                        {...companion}
                                        color={getSubjectColor(companion.subject)}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-8 glass-panel rounded-3xl col-span-3">
                                    <p className="text-muted-foreground text-sm">No oral companions created yet. Create one to get started!</p>
                                </div>
                            )}
                        </section>
                    </div>
                </main>
            );
        } catch (error) {
            console.error('Error loading user data:', error);
            return (
                <main>
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">Error loading your data. Please try again.</p>
                    </div>
                </main>
            );
        }
    }
    
    // If user is not authenticated, show landing page
    return (
        <main className="min-h-screen">
            {/* Hero Section */}
            <section className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="flex items-center gap-2.5 mb-8">
                    <Image
                        src="/images/logo.svg"
                        alt="EduTech AI Logo"
                        width={80}
                        height={80}
                    />
                    <h1 className="text-4xl font-bold">TeachFlow AI</h1>
                </div>
                <h2 className="text-3xl font-bold mb-4 max-w-2xl">
                    Learn Through Voice Conversations with AI Companions
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                    Create personalized AI teaching companions for any subject. Learn through natural voice conversations that feel engaging and effective.
                </p>
                <Link href="/sign-in">
                    <button className="btn-primary text-lg px-8 py-3">
                        Get Started
                    </button>
                </Link>
            </section>

            {/* Features Section */}
            <section className="py-16 px-4 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <h3 className="text-2xl font-bold text-center mb-12">Why Choose TeachFlow AI?</h3>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <Image src="/icons/mic-on.svg" alt="Voice" width={24} height={24} />
                            </div>
                            <h4 className="font-semibold mb-2">Voice-First Learning</h4>
                            <p className="text-muted-foreground">Learn through natural voice conversations, making education more accessible and engaging.</p>
                        </div>
                        <div className="text-center">
                            <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <Image src="/icons/plus.svg" alt="Customize" width={24} height={24} />
                            </div>
                            <h4 className="font-semibold mb-2">Personalized Companions</h4>
                            <p className="text-muted-foreground">Create AI companions tailored to your learning style, subject, and preferences.</p>
                        </div>
                        <div className="text-center">
                            <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <Image src="/icons/check.svg" alt="Progress" width={24} height={24} />
                            </div>
                            <h4 className="font-semibold mb-2">Track Your Progress</h4>
                            <p className="text-muted-foreground">Monitor your learning journey with detailed session history and progress tracking.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Learning?</h3>
                    <p className="text-lg text-muted-foreground mb-8">
                        Join thousands of learners who are already using AI companions to enhance their education.
                    </p>
                    <Link href="/sign-in">
                        <button className="btn-primary text-lg px-8 py-3">
                            Start Learning Today
                        </button>
                    </Link>
                </div>
            </section>
        </main>
    );
}

export default Page