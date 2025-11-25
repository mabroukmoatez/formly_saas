import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ShoppingCart, 
  Clock,
  Users,
  Star,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { LearnerLayout } from '../../components/LearnerDashboard/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Loader2 } from 'lucide-react';
import { getCatalogCourses, addToCart, CatalogCourse } from '../../services/learner';
import { showSuccess, showError } from '../../utils/notifications';

export const Catalog: React.FC = () => {
  const { organization } = useOrganization();
  const { isDark } = useTheme();
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'synchronous' | 'asynchronous' | 'e-learning'>('all');
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  const primaryColor = organization?.primary_color || '#007aff';

  useEffect(() => {
    fetchCourses();
  }, [categoryFilter, typeFilter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCatalogCourses({
        search: searchQuery || undefined,
        category: categoryFilter || undefined,
        type: typeFilter === 'all' ? undefined : typeFilter,
        has_available_sessions: true
      });
      if (response.success && response.data) {
        setCourses(response.data.courses || []);
      } else {
        setError('Erreur lors du chargement du catalogue');
      }
    } catch (err: any) {
      console.error('Error fetching catalog courses:', err);
      setError(err.message || 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (course: CatalogCourse, sessionId?: number) => {
    try {
      setAddingToCart(course.id);
      const response = await addToCart({
        course_id: course.id,
        session_id: sessionId
      });
      if (response.success) {
        showSuccess('Succès', 'Formation ajoutée au panier');
        fetchCourses(); // Refresh to update is_in_cart status
      }
    } catch (err: any) {
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue');
    } finally {
      setAddingToCart(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(price);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredCourses = courses.filter(course =>
    searchQuery === '' ||
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LearnerLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
              Catalogue de Formations
            </h1>
            <p className="text-gray-500 mt-1">
              Découvrez et inscrivez-vous aux formations disponibles
            </p>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher une formation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        fetchCourses();
                      }
                    }}
                    className="pl-10"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="all">Tous les types</option>
                  <option value="synchronous">Synchrone</option>
                  <option value="asynchronous">Asynchrone</option>
                  <option value="e-learning">E-learning</option>
                </select>
                <Button onClick={fetchCourses} style={{ backgroundColor: primaryColor }}>
                  Rechercher
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Courses Grid */}
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: primaryColor }} />
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-red-500">{error}</p>
                <Button onClick={() => fetchCourses()} className="mt-4">
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          ) : filteredCourses.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucune formation trouvée</h3>
                <p className="text-gray-500">
                  {searchQuery ? 'Aucune formation ne correspond à votre recherche.' : 'Aucune formation disponible pour le moment.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="relative">
                    {course.cover_image ? (
                      <img
                        src={course.cover_image}
                        alt={course.title}
                        className="w-full h-40 object-cover rounded-t-lg mb-4"
                      />
                    ) : (
                      <div 
                        className="w-full h-40 rounded-t-lg mb-4 flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}20` }}
                      >
                        <BookOpen className="h-16 w-16" style={{ color: primaryColor }} />
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 line-clamp-2">{course.title}</CardTitle>
                        {course.category && (
                          <Badge variant="outline" className="mb-2">{course.category.name}</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {course.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{course.description}</p>
                    )}

                    {/* Course Info */}
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      {course.duration && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{course.duration} heures</span>
                        </div>
                      )}
                      {course.level && (
                        <div className="flex items-center gap-2">
                          <span className="capitalize">Niveau: {course.level}</span>
                        </div>
                      )}
                      {course.language && (
                        <div className="flex items-center gap-2">
                          <span>Langue: {course.language}</span>
                        </div>
                      )}
                      {course.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span>{course.rating.toFixed(1)}</span>
                          {course.reviews_count && (
                            <span className="text-gray-400">({course.reviews_count} avis)</span>
                          )}
                        </div>
                      )}
                      {course.students_count && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{course.students_count} apprenants</span>
                        </div>
                      )}
                    </div>

                    {/* Sessions */}
                    {course.sessions && course.sessions.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Sessions disponibles:</p>
                        <div className="space-y-2">
                          {course.sessions.map((session) => (
                            <div key={session.id} className="p-2 bg-gray-50 rounded text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(session.start_date)} - {formatDate(session.end_date)}</span>
                              </div>
                              <div className="text-gray-600">
                                {session.available_spots} / {session.total_spots} places disponibles
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Instructor */}
                    {course.instructor && (
                      <div className="flex items-center gap-2 mb-4 pt-4 border-t">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {course.instructor.avatar ? (
                            <img src={course.instructor.avatar} alt={course.instructor.name} className="w-full h-full rounded-full" />
                          ) : (
                            <span className="text-xs font-semibold">
                              {course.instructor.name.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">{course.instructor.name}</span>
                      </div>
                    )}

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                        {formatPrice(course.price, course.currency)}
                      </div>
                      <div className="flex items-center gap-2">
                        {course.is_enrolled ? (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Inscrit
                          </Badge>
                        ) : course.is_in_cart ? (
                          <Badge className="bg-blue-500 text-white">
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Dans le panier
                          </Badge>
                        ) : (
                          <Button
                            style={{ backgroundColor: primaryColor }}
                            onClick={() => handleAddToCart(course)}
                            disabled={addingToCart === course.id || !course.has_available_sessions}
                          >
                            {addingToCart === course.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <ShoppingCart className="h-4 w-4 mr-2" />
                            )}
                            Ajouter au panier
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </LearnerLayout>
  );
};

