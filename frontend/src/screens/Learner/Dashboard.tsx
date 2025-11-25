import React, { useState, useEffect } from 'react';
import { LearnerLayout } from '../../components/LearnerDashboard/Layout';
import { LearningProgressSection } from '../../components/LearnerDashboard/sections/LearningProgressSection';
import { NewsAndUpdatesSection } from '../../components/LearnerDashboard/sections/NewsAndUpdatesSection';
import { RecentActivitiesSection } from '../../components/LearnerDashboard/sections/RecentActivitiesSection';
import { UpcomingEventsSection } from '../../components/LearnerDashboard/sections/UpcomingEventsSection';
import { useLearnerDashboard } from '../../hooks/useLearnerDashboard';
import { getEventsAndNews } from '../../services/learner';
import { useLanguage } from '../../contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

export const LearnerDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { stats, loading: statsLoading } = useLearnerDashboard();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch recent activities/news using the new combined endpoint
        try {
          const response = await getEventsAndNews(3, 'all');
          
          if (response) {
            if (response.success === true || response.success === undefined) {
              // Check if data exists in different possible locations
              const data = response.data || response;
              
              // Try to get all items from different possible structures
              const allItems = data?.all || data?.events || data?.news || (Array.isArray(data) ? data : []);
              
              if (allItems && allItems.length > 0) {
                // Map the data to the format expected by RecentActivitiesSection
                const mappedData = allItems.map((item: any) => ({
                  id: item.id,
                  title: item.title || 'Sans titre',
                  description: item.description || item.content || '',
                  image_url: item.image_url || item.image || null,
                  created_at: item.created_at || item.published_at || new Date().toISOString(),
                }));
                
                setActivities(mappedData);
              } else {
                setActivities([]);
              }
            } else {
              setActivities([]);
            }
          } else {
            setActivities([]);
          }
        } catch (err) {
          setActivities([]);
        }
      } catch (err) {
        // Silent error handling
      } finally {
        setLoading(false);
      }
    };

    if (!statsLoading) {
      fetchData();
    }
  }, [statsLoading]);

  // Transform upcoming_deadlines from stats to the format expected by UpcomingEventsSection
  const upcomingEvents = stats?.upcoming_deadlines?.slice(0, 3).map((event: any) => ({
    id: event.id,
    type: event.type,
    title: event.title,
    subtitle: event.instructor,
    date: event.date,
    formatted_date: event.formatted_date || new Date(event.date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    image_url: event.image_url || event.image,
    instructor_avatar: event.instructor_avatar,
    badge: {
      text: event.days_remaining === 0 ? 'Aujourd\'hui' : event.days_remaining === 1 ? 'Demain' : `J-${event.days_remaining}`,
      color: event.days_remaining < 0 ? 'bg-[#fe2f40]' : event.days_remaining === 0 ? 'bg-[#ff9600]' : event.days_remaining <= 2 ? 'bg-[#ff9600]' : 'bg-[#007aff]',
    },
  })) || [];

  if (statsLoading || loading) {
    return (
      <LearnerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#007aff]" />
        </div>
      </LearnerLayout>
    );
  }

  return (
    <LearnerLayout>
      <div className="flex gap-8 min-h-full">
        {/* Main Content Area - Scrollable */}
        <div className="flex-1 flex flex-col gap-8 min-w-0">
          {/* Learning Progress Section */}
          <div className="flex-shrink-0">
            <LearningProgressSection />
          </div>
        </div>

        {/* Right Sidebar - Upcoming Events, Calendar, Activities */}
        <aside className="w-[419px] flex-shrink-0 flex flex-col gap-8">
          {/* Upcoming Events */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="[font-family:'Urbanist',Helvetica] font-bold text-[#19294a] text-[22px] tracking-[0] leading-normal">
                {t('learner.dashboard.upcomingEvents')}
              </h2>
            </div>
            <UpcomingEventsSection events={upcomingEvents} showTitle={false} limit={3} />
          </section>

          {/* Calendar */}
          <section>
            <NewsAndUpdatesSection />
          </section>

          {/* Recent Activities */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="[font-family:'Urbanist',Helvetica] font-bold text-[#19294a] text-[22px] tracking-[0] leading-normal">
                {t('learner.dashboard.eventsNews')}
              </h2>
            </div>
            <RecentActivitiesSection activities={activities} />
          </section>
        </aside>
      </div>
    </LearnerLayout>
  );
};
