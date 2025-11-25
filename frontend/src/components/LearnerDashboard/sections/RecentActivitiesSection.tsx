import React, { useState } from 'react';
import { ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { fixImageUrl } from '../../../lib/utils';

interface Activity {
  id: number;
  title: string;
  description: string;
  image_url?: string;
  created_at: string;
}

interface RecentActivitiesSectionProps {
  activities?: Activity[];
}

export const RecentActivitiesSection: React.FC<RecentActivitiesSectionProps> = ({
  activities = [],
}) => {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  
  const handleImageError = (activityId: number) => {
    setImageErrors((prev) => new Set(prev).add(activityId));
  };
  
  const hasActivities = activities && Array.isArray(activities) && activities.length > 0;
  
  if (!hasActivities) {
    return (
      <section className="flex flex-col w-full max-w-[370px] gap-2.5">
        <Card className="border-[#f6f6f6] shadow-[0px_4px_100px_10px_#09294c1a]">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-gray-500">Aucune activité récente</p>
          </CardContent>
        </Card>
      </section>
    );
  }
  
  return (
    <section className="flex flex-col w-full max-w-[370px] gap-2.5">
      {activities.map((activity, index) => (
        <Card
          key={activity.id || index}
          className="border-[#f6f6f6] shadow-[0px_4px_100px_10px_#09294c1a] transition-transform hover:scale-[1.02] cursor-pointer"
        >
            <CardContent className="p-0 h-[90px]">
              <article className="flex items-center gap-4 h-full">
                {activity.image_url && !imageErrors.has(activity.id) ? (
                  <img
                    className="w-[117px] h-[90px] rounded-l-[15px] object-cover flex-shrink-0"
                    alt={activity.title}
                    src={fixImageUrl(activity.image_url)}
                    onError={() => handleImageError(activity.id)}
                  />
                ) : (
                  <div className="w-[117px] h-[90px] rounded-l-[15px] bg-gradient-to-br from-[#e5f3ff] to-[#d6e9ff] flex-shrink-0 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-[#6a90b9]" />
                  </div>
                )}

                <div className="flex-1 flex flex-col justify-center gap-1 pr-3 min-w-0">
                  <h3 className="[font-family:'Urbanist',Helvetica] font-semibold text-black text-[15px] tracking-[0] leading-[normal] truncate">
                    {activity.title}
                  </h3>
                  <p className="[font-family:'Urbanist',Helvetica] font-medium text-[#bfc0c1] text-xs tracking-[0] leading-[normal] line-clamp-2">
                    {activity.description}
                  </p>
                </div>

                <ChevronRight className="w-3 h-3 text-black flex-shrink-0 mr-3" />
              </article>
            </CardContent>
          </Card>
      ))}
    </section>
  );
};

