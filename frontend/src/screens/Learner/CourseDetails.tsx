import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { VideoPlayerSection } from '../../components/LearnerDashboard/sections/VideoPlayerSection';
import { CourseDetailsSection } from '../../components/LearnerDashboard/sections/CourseDetailsSection';
import { UserProfileSection } from '../../components/LearnerDashboard/sections/UserProfileSection';
import { LearnerLayout } from '../../components/LearnerDashboard/Layout';
import { getLearnerCourse } from '../../services/learner';
import { Loader2 } from 'lucide-react';

export const CourseDetails: React.FC = () => {
  const { id, subdomain } = useParams<{ id: string; subdomain?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Get subdomain from path if present
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const detectedSubdomain = subdomain || (pathSegments[0] && pathSegments[0] !== 'learner' && pathSegments[0] !== 'superadmin' 
    ? pathSegments[0] 
    : null);

  // Build navigation paths with subdomain support
  const getPath = (path: string) => {
    if (detectedSubdomain) {
      return `/${detectedSubdomain}${path}`;
    }
    return path;
  };

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await getLearnerCourse(parseInt(id));
        if (response.success && response.data) {
          setCourse(response.data);
        }
      } catch (err) {
        console.error('Error fetching course:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);


  if (loading) {
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
      <div className="w-full">
        <main className="bg-[#ffffff] rounded-[38px_0px_0px_0px] min-h-[calc(100vh-79px)] p-10">
        <div className="flex flex-col items-center gap-8 max-w-[1586px] mx-auto translate-y-[-1rem] animate-fade-in opacity-0">
          <VideoPlayerSection
            course={course ? {
              title: course.title,
              categories: course.categories || [course.category].filter(Boolean),
              price: course.price,
              duration: course.duration || '7 Hours',
              lessons_count: course.lessons_count || course.sections?.length || 26,
              version: course.version || '1',
              updated_at: course.updated_at,
              cover_image: course.cover_image,
              video_url: course.video?.video_url,
            } : undefined}
            onClose={() => navigate(getPath('/learner/learning'))}
          />
          <div className="flex items-start gap-[47px] w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
            <CourseDetailsSection
              course={course ? {
                description: course.description,
                target_audience: course.target_audience,
                prerequisites: course.prerequisites,
                pedagogical_methods: course.pedagogical_methods,
                evaluation_methods: course.evaluation_methods,
                monitoring_methods: course.monitoring_methods,
                cover_image: course.cover_image,
                video_url: course.video?.video_url,
              } : undefined}
            />
            <UserProfileSection
              course={course ? {
                objectives: course.objectives,
                modules: course.sections || course.modules,
                instructors: course.instructors || (course.instructor ? [course.instructor] : []),
              } : undefined}
            />
          </div>
          </div>
        </main>
      </div>
    </LearnerLayout>
  );
};

