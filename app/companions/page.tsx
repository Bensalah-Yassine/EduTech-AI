import {getAllCompanions} from "@/lib/actions/companion.actions";
import CompanionCard from "@/components/CompanionCard";
import {getSubjectColor} from "@/lib/utils";
import SearchInput from "@/components/SearchInput";
import SubjectFilter from "@/components/SubjectFilter";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const CompanionsLibrary = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) => {
    const user = await currentUser();
    
    if (!user) {
        redirect('/sign-in');
    }
    
    try {
        const filters = await searchParams;
        const subject = filters.subject ? filters.subject : '';
        const topic = filters.topic ? filters.topic : '';

        const companions = await getAllCompanions({ subject, topic });

        return (
            <main>
                <section className="flex justify-between gap-4 max-sm:flex-col">
                    <h1>My Companion Library</h1>
                    <div className="flex gap-4">
                        <SearchInput />
                        <SubjectFilter />
                    </div>
                </section>
                <section className="companions-grid">
                    {companions.length > 0 ? (
                        companions.map((companion) => (
                            <CompanionCard
                                key={companion.id}
                                {...companion}
                                color={getSubjectColor(companion.subject)}
                            />
                        ))
                    ) : (
                        <div className="text-center py-8 col-span-full">
                            <p className="text-muted-foreground">No companions found. Create your first companion to get started!</p>
                        </div>
                    )}
                </section>
            </main>
        );
    } catch (error) {
        console.error('Error loading companions:', error);
        return (
            <main>
                <div className="text-center py-8">
                    <p className="text-muted-foreground">Error loading your companions. Please try again.</p>
                </div>
            </main>
        );
    }
}

export default CompanionsLibrary