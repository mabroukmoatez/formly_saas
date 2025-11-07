import { useState, useEffect, useCallback } from 'react';
import { eventsService } from '../services/events';
import {
  Event,
  EventDetails,
  EventsListParams,
  CreateEventData,
  UpdateEventData,
  EventStatistics,
  CategoriesResponse
} from '../services/events.types';

/**
 * Hook pour gérer la liste des événements
 */
export const useEvents = (initialParams?: EventsListParams) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 20
  });

  const fetchEvents = useCallback(async (params?: EventsListParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await eventsService.getEvents(params || initialParams);
      
      // L'API retourne directement {events: [...], pagination: {...}}
      // Pas de wrapper {success: true, data: {...}}
      if (response.events) {
        setEvents(response.events);
        setPagination(response.pagination);
      } else {
        setError('Format de réponse API inattendu');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des événements');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, [initialParams]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    pagination,
    refetch: fetchEvents
  };
};

/**
 * Hook pour gérer un événement spécifique
 */
export const useEvent = (eventId: string | null) => {
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!eventId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await eventsService.getEventById(eventId);
      
      if (response.success) {
        setEvent(response.data);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement de l\'événement');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  return {
    event,
    loading,
    error,
    refetch: fetchEvent
  };
};

/**
 * Hook pour récupérer les catégories d'événements
 */
export const useEventCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [eventTypes, setEventTypes] = useState<{key: string, value: string}[]>([]);
  const [statuses, setStatuses] = useState<{key: string, value: string}[]>([]);
  const [locationTypes, setLocationTypes] = useState<{key: string, value: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await eventsService.getCategories();
      
      // La réponse contient success, data, message
      if (response && response.success && response.data) {
        setCategories(response.data.categories);
        
        // Convertir les objets en tableaux pour event_types
        if (response.data.event_types) {
          const eventTypesArray = Object.entries(response.data.event_types).map(([key, value]) => ({
            key,
            value: value as string
          }));
          setEventTypes(eventTypesArray);
        }
        
        // Convertir les objets en tableaux pour statuses
        if (response.data.statuses) {
          const statusesArray = Object.entries(response.data.statuses).map(([key, value]) => ({
            key,
            value: value as string
          }));
          setStatuses(statusesArray);
        }
        
        // Convertir les objets en tableaux pour location_types
        if (response.data.location_types) {
          const locationTypesArray = Object.entries(response.data.location_types).map(([key, value]) => ({
            key,
            value: value as string
          }));
          setLocationTypes(locationTypesArray);
        }
      } else {
        setError('Erreur lors du chargement des catégories');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du chargement des catégories';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    eventTypes,
    statuses,
    locationTypes,
    loading,
    error,
    refetch: fetchCategories
  };
};

/**
 * Hook pour gérer les actions sur les événements
 */
export const useEventActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEvent = async (data: CreateEventData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Hook: Calling createEvent service...'); // Debug
      const response = await eventsService.createEvent(data);
      console.log('🔍 Hook: Got response from service:', response); // Debug
      
      // Vérifier si la création a réussi (code 201 ou success: true)
      if (response.success || response.data) {
        console.log('🔍 Hook: Event created successfully!'); // Debug
        return true;
      } else {
        console.log('🔍 Hook: Response indicates failure:', response); // Debug
        setError(response.message || 'Erreur lors de la création de l\'événement');
        return false;
      }
    } catch (err: any) {
      console.log('🔍 Hook: Error occurred:', err); // Debug
      console.log('🔍 Hook: Error response status:', err.response?.status); // Debug
      console.log('🔍 Hook: Error response data:', err.response?.data); // Debug
      
      // Si c'est un code 201, c'est un succès même si axios le traite comme une erreur
      if (err.response?.status === 201) {
        console.log('🔍 Hook: Status 201 detected, treating as success!'); // Debug
        return true;
      }
      
      const errorMessage = err.response?.data?.message || 'Erreur lors de la création de l\'événement';
      setError(errorMessage);
      
      // Gérer les erreurs de validation
      if (err.response?.data?.errors) {
        const validationErrors = Object.values(err.response.data.errors).flat().join(', ');
        setError(validationErrors);
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (eventId: string, data: UpdateEventData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await eventsService.updateEvent(eventId, data);
      
      // Vérifier si la modification a réussi (code 200/201 ou success: true)
      if (response.success || response.data) {
        return true;
      } else {
        setError(response.message || 'Erreur lors de la modification de l\'événement');
        return false;
      }
    } catch (err: any) {
      // Si c'est un code 200 ou 201, c'est un succès
      if (err.response?.status === 200 || err.response?.status === 201) {
        return true;
      }
      
      const errorMessage = err.response?.data?.message || 'Erreur lors de la modification de l\'événement';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await eventsService.deleteEvent(eventId);
      
      // Vérifier si la suppression a réussi (code 200/204 ou success: true)
      if (response.success || response.data) {
        return true;
      } else {
        setError(response.message || 'Erreur lors de la suppression de l\'événement');
        return false;
      }
    } catch (err: any) {
      // Si c'est un code 200, 201 ou 204, c'est un succès
      if (err.response?.status === 200 || err.response?.status === 201 || err.response?.status === 204) {
        return true;
      }
      
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression de l\'événement';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const registerToEvent = async (eventId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await eventsService.registerToEvent(eventId);
      
      if (response.success) {
        return true;
      } else {
        setError(response.message);
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'inscription';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unregisterFromEvent = async (eventId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await eventsService.unregisterFromEvent(eventId);
      
      if (response.success) {
        return true;
      } else {
        setError(response.message);
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la désinscription';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (image: File): Promise<string | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await eventsService.uploadImage(image);
      
      if (response.success) {
        return response.data.url;
      } else {
        setError(response.message);
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'upload de l\'image';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getEventById = async (eventId: string): Promise<Event | null> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 useEventActions: Calling getEventById with ID:', eventId);
      const response = await eventsService.getEventById(eventId);
      console.log('🔍 useEventActions: Got response:', response);
      
      // Si la réponse contient directement les données de l'événement (pas de structure success/data)
      if (response && response.id) {
        console.log('🔍 useEventActions: Direct event data, returning:', response);
        return response;
      }
      
      // Si c'est une structure avec success/data
      if (response.success) {
        console.log('🔍 useEventActions: Success structure, returning data:', response.data);
        return response.data;
      } else {
        console.log('🔍 useEventActions: Response indicates failure:', response.message);
        setError(response.message);
        return null;
      }
    } catch (err: any) {
      console.log('🔍 useEventActions: Error occurred:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors du chargement de l\'événement';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    registerToEvent,
    unregisterFromEvent,
    uploadImage,
    getEventById
  };
};

/**
 * Hook pour gérer les statistiques d'un événement
 */
export const useEventStatistics = (eventId: string | null) => {
  const [statistics, setStatistics] = useState<EventStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    if (!eventId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await eventsService.getEventStatistics(eventId);
      
      if (response.success) {
        setStatistics(response.data);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics
  };
};

