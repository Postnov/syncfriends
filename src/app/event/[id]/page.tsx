'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Компонент для рендеринга только на клиенте
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
        <div className="max-w-3xl w-full text-center py-12">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-24 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <p className="mt-6 text-gray-500 dark:text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

interface Participant {
  name: string;
  avatarColor: string;
  availability: string[];
}

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  timeRange: {
    start: string;
    end: string;
  };
  participants: Participant[];
  allowedParticipants: string[] | null;
}

export default function EventPage() {
  const params = useParams();
  const eventId = params?.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [commonSlots, setCommonSlots] = useState<string[]>([]);
  const [popularSlots, setPopularSlots] = useState<{slot: string, count: number}[]>([]);
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  // Форматирование даты на клиенте для избежания ошибок гидратации
  useEffect(() => {
    if (event?.date) {
      try {
        const date = new Date(event.date);
        setFormattedDate(date.toLocaleDateString('ru-RU', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        }));
      } catch (error) {
        console.error('Error formatting date:', error);
        setFormattedDate('');
      }
    }
  }, [event?.date]);

  // Загрузка данных события
  const loadEvent = () => {
    setLoading(true);
    
    try {
      // В реальном приложении здесь был бы запрос к API
      const eventsData = JSON.parse(localStorage.getItem('events') || '{}');
      const foundEvent = eventsData[eventId];
      
      if (foundEvent) {
        setEvent(foundEvent);
        // Генерируем временные слоты
        const slots = generateTimeSlots(foundEvent.timeRange.start, foundEvent.timeRange.end);
        setTimeSlots(slots);
        // Находим общие слоты для всех участников
        findCommonAndPopularSlots(slots, foundEvent.participants);
      } else {
        setError('Событие не найдено');
      }
    } catch (err) {
      setError('Произошла ошибка при загрузке события');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Генерирует временные слоты на основе временного диапазона (часовые интервалы)
  const generateTimeSlots = (start: string, end: string) => {
    const slots = [];
    
    let currentTime = start;
    while (currentTime <= end) {
      slots.push(currentTime);
      
      // Увеличиваем время на 1 час
      const [hours, minutes] = currentTime.split(':').map(Number);
      let newHours = hours + 1;
      
      currentTime = `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      
      // Если перешли за конечное время, останавливаемся
      if (currentTime > end) break;
    }
    
    return slots;
  };

  // Находит общие слоты для всех участников и популярные слоты для большинства
  const findCommonAndPopularSlots = (slots: string[], participants: Participant[]) => {
    if (!participants || participants.length === 0) {
      setCommonSlots([]);
      setPopularSlots([]);
      return;
    }

    // Создаем счетчик для каждого временного слота
    const slotCounts: Record<string, number> = {};
    slots.forEach(slot => {
      slotCounts[slot] = 0;
    });

    // Подсчитываем количество участников, доступных в каждый слот
    participants.forEach(participant => {
      const availableSlots = participant.availability || [];
      availableSlots.forEach(slot => {
        if (slotCounts[slot] !== undefined) {
          slotCounts[slot]++;
        }
      });
    });

    // Находим слоты, доступные для всех участников
    const common = slots.filter(slot => slotCounts[slot] === participants.length);
    setCommonSlots(common);

    // Находим популярные слоты (где большинство участников свободны)
    const popularSlotsArray = slots
      .map(slot => ({ slot, count: slotCounts[slot] }))
      .filter(item => item.count > 0 && item.count < participants.length)
      .sort((a, b) => b.count - a.count); // Сортируем по количеству участников (от большего к меньшему)
    
    // Берем только слоты, где доступно более 50% участников
    const threshold = Math.ceil(participants.length / 2);
    const popularSlotsFiltered = popularSlotsArray.filter(item => item.count >= threshold);
    
    setPopularSlots(popularSlotsFiltered);
  };

  // Проверяет, доступен ли участник в указанный слот
  const isParticipantAvailable = (participant: Participant, slot: string) => {
    return participant.availability?.includes(slot) || false;
  };

  // Генерирует инициалы для аватарки
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Возвращает количество участников, доступных в данном слоте
  const getAvailableCount = (slot: string) => {
    if (!event) return 0;
    return event.participants.filter(p => isParticipantAvailable(p, slot)).length;
  };

  // Форматирует дату для отображения
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Получить доступные слоты для участника в отсортированном виде
  const getParticipantAvailableSlots = (participant: Participant) => {
    return [...(participant.availability || [])].sort();
  };

  // Получить недоступные популярные слоты для участника
  const getUnavailablePopularSlots = (participant: Participant) => {
    return popularSlots
      .filter(item => !isParticipantAvailable(participant, item.slot))
      .sort((a, b) => b.count - a.count);
  };

  // Получить рекомендации для участника
  const getRecommendationsForParticipant = (participant: Participant) => {
    const unavailablePopularSlots = getUnavailablePopularSlots(participant);
    if (unavailablePopularSlots.length === 0) return null;
    
    // Получаем слот с наибольшим количеством доступных участников
    return unavailablePopularSlots[0];
  };

  if (loading) {
    return (
      <ClientOnly>
        <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
          <div className="max-w-5xl w-full text-center py-12">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-8"></div>
              <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <p className="mt-8 text-gray-500 dark:text-gray-400">Загрузка данных события...</p>
          </div>
        </main>
      </ClientOnly>
    );
  }

  if (error || !event) {
    return (
      <ClientOnly>
        <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
          <div className="max-w-5xl w-full">
            <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
              &larr; Вернуться на главную
            </Link>
            
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error || 'Событие не найдено'}
            </div>
          </div>
        </main>
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
        <div className="max-w-5xl w-full">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            &larr; Вернуться на главную
          </Link>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{event.name}</h1>
            
            {event.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {event.description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{event.timeRange.start} — {event.timeRange.end}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Участников: {event.participants.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span>Код: {event.id}</span>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4 mb-6">
              <div>
                <h2 className="text-lg font-medium">Результаты опроса</h2>
                {event.participants.length === 0 && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Пока никто не присоединился к событию</p>
                )}
              </div>
              
              <Link
                href={`/join?id=${event.id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 md:px-4 rounded text-center transition-colors flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Присоединиться</span>
              </Link>
            </div>
            
            {event.participants.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Пока никто не указал свою доступность
                </p>
                <Link
                  href={`/join?id=${event.id}`}
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-center transition-colors"
                >
                  Присоединиться первым
                </Link>
              </div>
            ) : (
              <>
                {commonSlots.length > 0 && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/40 border border-green-100 dark:border-green-900 rounded-lg">
                    <h3 className="font-bold mb-2">🎉 Оптимальное время для встречи:</h3>
                    <p className="text-lg font-medium text-green-800 dark:text-green-300">
                      {commonSlots.sort().join(', ')}
                    </p>
                    <p className="mt-2 text-sm text-green-800 dark:text-green-200">
                      В это время свободны все {event.participants.length} участников
                    </p>
                  </div>
                )}

                {commonSlots.length === 0 && popularSlots.length > 0 && (
                  <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/40 border border-yellow-100 dark:border-yellow-900 rounded-lg">
                    <h3 className="font-bold mb-2">⚠️ Нет времени, удобного для всех участников</h3>
                    <p className="mb-2">Наиболее популярные варианты:</p>
                    <div className="space-y-2">
                      {popularSlots.slice(0, 3).map(slot => (
                        <div key={slot.slot} className="flex justify-between items-center">
                          <span className="font-medium text-yellow-800 dark:text-yellow-300">{slot.slot}</span>
                          <span className="bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-lg text-sm">
                            {slot.count} из {event.participants.length} участников
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 font-medium border-b border-gray-200 dark:border-gray-700">
                      Время / Участники
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {event.participants.map(participant => {
                        const recommendation = getRecommendationsForParticipant(participant);
                        
                        return (
                          <div key={participant.name} className="p-4">
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${participant.avatarColor}`}>
                                  {getInitials(participant.name)}
                                </div>
                                <div className="font-medium">{participant.name}</div>
                              </div>
                              
                              <Link 
                                href={`/join?id=${event.id}&edit=true&name=${encodeURIComponent(participant.name)}`}
                                className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>Изменить</span>
                              </Link>
                            </div>
                            
                            {getParticipantAvailableSlots(participant).length > 0 ? (
                              <div className="ml-12">
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {getParticipantAvailableSlots(participant).map(slot => (
                                    <span key={slot} className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-1 rounded-lg text-sm">
                                      {slot}
                                    </span>
                                  ))}
                                </div>
                                
                                {recommendation && (
                                  <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-md border border-yellow-100 dark:border-yellow-900/40">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-center gap-1">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Рекомендация: слот <strong>{recommendation.slot}</strong> удобен для {recommendation.count} из {event.participants.length} участников
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500 dark:text-gray-400 ml-12 text-sm italic">
                                Не указаны слоты доступности
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </ClientOnly>
  );
} 