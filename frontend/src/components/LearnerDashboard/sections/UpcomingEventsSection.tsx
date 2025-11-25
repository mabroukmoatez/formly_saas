import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, Bell, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { useAuth } from '../../../contexts/AuthContext';
import { Card, CardContent } from '../../ui/card';
import { fixImageUrl } from '../../../lib/utils';

interface UpcomingEvent {
  id: number;
  type: 'session' | 'quiz' | 'assignment';
  title: string;
  subtitle?: string;
  date: string;
  formatted_date: string;
  image_url?: string;
  instructor_avatar?: string;
  badge: {
    text: string;
    color: string;
  };
}

interface UpcomingEventsSectionProps {
  events?: UpcomingEvent[];
  isHeader?: boolean;
  showTitle?: boolean;
  limit?: number;
}

export const UpcomingEventsSection: React.FC<UpcomingEventsSectionProps> = ({
  events = [],
  isHeader = false,
  showTitle = true,
  limit = 3,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ subdomain?: string }>();

  // Get subdomain from path if present
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const subdomain = params.subdomain || (pathSegments[0] && pathSegments[0] !== 'learner' && pathSegments[0] !== 'superadmin' 
    ? pathSegments[0] 
    : null);

  // Build navigation paths with subdomain support
  const getPath = (path: string) => {
    if (subdomain) {
      return `/${subdomain}${path}`;
    }
    return path;
  };

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.name || 'Utilisateur';
  };

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.name) {
      return user.name.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleLogout = async () => {
    await logout();
    if (subdomain) {
      navigate(`/${subdomain}/login`);
    } else {
      navigate('/login');
    }
  };

  if (isHeader) {
    return (
      <header className="flex w-full items-center justify-between relative translate-y-[-1rem] animate-fade-in opacity-0">
        <h1 className="[font-family:'Urbanist',Helvetica] font-normal text-[#ffffff] text-[35px] tracking-[0] leading-[normal] whitespace-nowrap">
          <span className="font-bold">Hello, </span>
          <span className="[font-family:'Urbanist',Helvetica] font-normal text-[#ffffff] text-[35px] tracking-[0]">
            {getUserDisplayName().split(' ')[0]}
          </span>
          <span className="font-bold">&nbsp;</span>
          <span className="[font-family:'Urbanist',Helvetica] font-normal text-[#ffffff] text-[35px] tracking-[0]">
            {getUserDisplayName().split(' ').slice(1).join(' ')}
          </span>
        </h1>

        <nav className="inline-flex items-center gap-[25px]">
          <Button
            variant="ghost"
            size="icon"
            className="h-auto w-auto p-0 hover:bg-transparent relative"
          >
            <Bell className="w-6 h-6 text-white" />
            {/* TODO: Add notification count from API */}
            {/* <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
              {notificationCount}
            </span> */}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto inline-flex items-center gap-1 p-0 hover:bg-transparent"
              >
                <div className="inline-flex items-center gap-2">
                  <Avatar className="w-10 h-[38px]">
                    <AvatarImage src={user?.image_url} />
                    <div className="w-[38px] h-[38px] bg-[#ff9600] rounded-[19px] flex items-center justify-center">
                      <AvatarFallback className="bg-transparent [font-family:'Urbanist',Helvetica] font-bold text-[#ffffff] text-sm leading-[18px] tracking-[0]">
                        {getInitials()}
                      </AvatarFallback>
                    </div>
                  </Avatar>

                  <div className="inline-flex flex-col items-start justify-center gap-0.5">
                    <span className="[font-family:'Urbanist',Helvetica] font-bold text-[#ffffff] text-sm tracking-[0] leading-[18px] whitespace-nowrap">
                      {getUserDisplayName().toUpperCase()}
                    </span>

                    <Badge className="h-auto px-1 py-[3px] rounded bg-[linear-gradient(0deg,rgba(0,133,255,0.1)_0%,rgba(0,133,255,0.1)_100%),linear-gradient(0deg,rgba(255,255,255,1)_0%,rgba(255,255,255,1)_100%)] bg-lightbackgroundblue hover:bg-lightbackgroundblue">
                      <span className="[font-family:'Urbanist',Helvetica] font-medium text-[#0085ff] text-[7px] tracking-[0] leading-[normal] whitespace-nowrap">
                        Apprenant
                      </span>
                    </Badge>
                  </div>
                </div>

                <ChevronDown className="w-6 h-6 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate(getPath('/learner/profile'))}>
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(getPath('/learner/profile?tab=settings'))}>
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </header>
    );
  }

  return (
    <section className="translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="[font-family:'Urbanist',Helvetica] font-bold text-[#19294a] text-[22px] tracking-[0] leading-normal">
            Prochainement
          </h2>
          <Button
            variant="link"
            className="h-auto p-0 text-[#007aff] text-[15px] [font-family:'Urbanist',Helvetica] font-normal underline"
            onClick={() => navigate(getPath('/learner/calendar'))}
          >
            Voir plus
            <ArrowRight className="w-[15px] h-[15px] ml-1" />
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {events.slice(0, limit).map((event, index) => (
          <Card
            key={event.id}
            className="shadow-[0px_4px_6px_4px_#09294c0a] border-0 translate-y-[-1rem] animate-fade-in opacity-0 hover:shadow-[0px_4px_12px_4px_#09294c15] transition-shadow cursor-pointer"
            style={
              {
                '--animation-delay': `${600 + index * 100}ms`,
              } as React.CSSProperties
            }
          >
            <CardContent className="p-1.5 flex items-center gap-3 relative">
              {event.image_url && (
                <img
                  className="w-[53px] h-[53px] rounded-lg object-cover flex-shrink-0"
                  alt={event.title}
                  src={fixImageUrl(event.image_url)}
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="[font-family:'Urbanist',Helvetica] font-semibold text-black text-sm tracking-[0] leading-normal truncate">
                      {event.title}
                    </h3>
                    {event.subtitle && (
                      <div className="flex items-center gap-1 mt-1">
                        {event.instructor_avatar && (
                          <div
                            className="w-3 h-3 rounded-full bg-cover bg-center flex-shrink-0"
                            style={{
                              backgroundImage: `url(${fixImageUrl(event.instructor_avatar)})`,
                            }}
                          />
                        )}
                        <span className="opacity-40 [font-family:'Urbanist',Helvetica] font-normal text-black text-[9px] tracking-[0] leading-normal truncate">
                          {event.subtitle}
                        </span>
                      </div>
                    )}
                    <p className="[font-family:'Urbanist',Helvetica] font-normal text-[#7b8392] text-[10px] tracking-[0] leading-normal mt-1">
                      {event.formatted_date}
                    </p>
                  </div>

                  <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0 mt-1" />
                </div>
              </div>

              <Badge
                className={`${event.badge.color} absolute top-3 right-3 w-[37px] h-[37px] rounded-[7px] border border-solid border-[#0000001a] flex items-center justify-center text-[#ffffff] [font-family:'Urbanist',Helvetica] font-semibold text-sm hover:${event.badge.color}`}
              >
                {event.badge.text}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

