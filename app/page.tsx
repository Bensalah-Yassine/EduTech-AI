import CompanionCard from '@/components/CompanionCard';
import CompanionList from '@/components/CompanionList';
import CTA from '@/components/CTA';
import { recentSessions, subjects } from '@/constants';
import { getAllCompanions, getRecentSessions } from '@/lib/actions/companion.actions';
import { getSubjectColor } from '@/lib/utils';

const Page = async () => {
  const companions = await getAllCompanions({ limit : 3});
  const recentSessions = await getRecentSessions({ limit : 10});
  return (
    <main>
      <h1>
        Popular Companions
      </h1>
      <section className='home-section'>
        {companions.map((companion) => (
          <CompanionCard
            key={companion.id}
            color={getSubjectColor(companion.subject)}
            {...companion}
          
          />

        ))}
        
      </section>
      <section className='home-section'>
        <CompanionList 
          title="Recently completed sessions"
          companions={recentSessions}
          classNames="w-2/3 max-lg:w-full"
        />
        <CTA />

      </section>
    </main>
    
  )
}

export default Page