'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

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

interface Event {
  id: string;
  name: string;
  description: string;
  dateRange: {
    start: string;
    end: string;
  };
  timeRange: {
    start: string;
    end: string;
  };
  participants: {
    name: string;
    avatarColor: string;
    availability: string[];
  }[];
  allowedParticipants: string[] | null;
}

// Список цветов для аватарок
const AVATAR_COLORS = [
  'bg-red-500', 'bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500',
  'bg-cyan-500', 'bg-teal-500', 'bg-green-500', 'bg-lime-500', 'bg-amber-500'
];

// Объявляем интерфейс, соответствующий структуре данных
interface AvailabilityMap {
  [date: string]: string[];
}

export default function JoinEvent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams?.get('id') || '';
  const isEditMode = searchParams?.get('edit') === 'true';
  const editName = searchParams?.get('name') || '';
  
  const [event, setEvent] = useState<Event | null>(null);
  const [userName, setUserName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [step, setStep] = useState(1); // 1 - ввод имени, 2 - выбор времени
  const [alreadyUsedNames, setAlreadyUsedNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formattedDateRange, setFormattedDateRange] = useState<string>('');
  const [formattedWeekday, setFormattedWeekday] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Загружаем событие при монтировании компонента
  useEffect(() => {
    if (eventId) {
      findEvent();
    }
  }, [eventId]);

  // Форматирование диапазона дат на клиенте для избежания ошибок гидратации
  useEffect(() => {
    if (event?.dateRange) {
      try {
        const startDate = new Date(event.dateRange.start);
        const endDate = new Date(event.dateRange.end);
        
        if (event.dateRange.start === event.dateRange.end) {
          // Если выбрана одна дата
          setFormattedDateRange(startDate.toLocaleDateString('ru-RU', { 
            year: 'numeric', month: 'long', day: 'numeric' 
          }));
          setFormattedWeekday(startDate.toLocaleDateString('ru-RU', { 
            weekday: 'long' 
          }));
        } else {
          // Если выбран диапазон дат
          const startFormatted = startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
          const endFormatted = endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
          setFormattedDateRange(`${startFormatted} - ${endFormatted}`);
          
          // Для диапазона дат не отображаем день недели
          setFormattedWeekday('');
        }
      } catch (error) {
        console.error('Error formatting date range:', error);
        setFormattedDateRange('');
        setFormattedWeekday('');
      }
    }
  }, [event?.dateRange]);

  // Установка данных для режима редактирования
  useEffect(() => {
    if (isEditMode && editName && event) {
      // Находим участника по имени
      const participant = event.participants.find(p => p.name === editName);
      if (participant) {
        // Устанавливаем базовые данные
        setUserName(participant.name);
        setSelectedAvatar(participant.avatarColor);
        
        // Получаем доступные даты из диапазона события
        if (event.dateRange) {
          const availableDates = generateDateRange(event.dateRange.start, event.dateRange.end);
          
          // Создаем новый объект для доступности
          const newAvailability: AvailabilityMap = {};
          
          // Проверяем доступность участника для каждой даты
          availableDates.forEach(date => {
            // Безопасное получение слотов
            try {
              // Первый вариант: использование as unknown as
              const participantAvailability = participant.availability as unknown as AvailabilityMap;
              if (participantAvailability && participantAvailability[date]) {
                const slots = participantAvailability[date];
                if (Array.isArray(slots)) {
                  newAvailability[date] = [...slots];
                }
              }
            } catch (e) {
              console.error(`Error processing date ${date}:`, e);
            }
          });
          
          // Устанавливаем данные о доступности
          setAvailability(newAvailability);
          
          // Выбираем дату для отображения
          const datesWithSlots = Object.keys(newAvailability);
          if (datesWithSlots.length > 0) {
            setSelectedDate(datesWithSlots[0]);
          } else if (availableDates.length > 0) {
            setSelectedDate(availableDates[0]);
          }
        }
        
        // Переходим к шагу выбора времени
        setStep(2);
      }
    }
  }, [isEditMode, editName, event]);

  // Генерируем список доступных дат из диапазона
  useEffect(() => {
    if (event?.dateRange) {
      const dates = generateDateRange(event.dateRange.start, event.dateRange.end);
      setAvailableDates(dates);
      // Если нет выбранной даты, выбираем первую
      if (!selectedDate && dates.length > 0) {
        setSelectedDate(dates[0]);
      }
    }
  }, [event?.dateRange, selectedDate]);

  // Генерируем случайный цвет аватарки при загрузке (только если не в режиме редактирования)
  useEffect(() => {
    if (!isEditMode && !editName) {
      const randomColorIndex = Math.floor(Math.random() * AVATAR_COLORS.length);
      setSelectedAvatar(AVATAR_COLORS[randomColorIndex]);
    }
  }, [isEditMode, editName]);

  // Поиск события по ID
  const findEvent = () => {
    setIsLoading(true);
    
    if (!eventId) {
      setErrorMessage('Пожалуйста, введите код события');
      setIsLoading(false);
      return;
    }

    // В реальном приложении здесь был бы запрос к серверу
    try {
      const eventsData = JSON.parse(localStorage.getItem('events') || '{}');
      const foundEvent = eventsData[eventId.toUpperCase()];
      
      if (foundEvent) {
        setEvent(foundEvent);
        setErrorMessage('');
        
        // Собираем имена, для которых уже указана доступность
        if (foundEvent.participants && foundEvent.participants.length > 0) {
          const usedNames = foundEvent.participants.map((p: { name: string }) => p.name);
          setAlreadyUsedNames(usedNames);
        }
      } else {
        setErrorMessage('Событие не найдено');
      }
    } catch (error) {
      console.error('Error finding event:', error);
      setErrorMessage('Ошибка при загрузке события');
    }
    
    setIsLoading(false);
  };

  // Генерирует временные слоты на основе временного диапазона события
  const generateTimeSlots = () => {
    if (!event) return [];
    
    const { start, end } = event.timeRange;
    const slots = [];
    
    let currentTime = start;
    while (currentTime <= end) {
      slots.push(currentTime);
      
      // Увеличиваем время на 1 час (вместо 30 минут)
      const [hours, minutes] = currentTime.split(':').map(Number);
      let newHours = hours + 1;
      
      currentTime = `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      
      // Если перешли за конечное время, останавливаемся
      if (currentTime > end) break;
    }
    
    return slots;
  };

  // Сгенерированные слоты для текущего события
  const timeSlots = generateTimeSlots();

  // Генерирует инициалы для аватарки
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Генерирует список дат в заданном диапазоне
  const generateDateRange = (startDate: string, endDate: string) => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  // Форматирует дату для отображения
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long'
    });
  };

  // Обновляет доступность для конкретного временного слота
  const toggleTimeSlot = (timeSlot: string) => {
    if (!selectedDate) return;
    
    setAvailability(prev => {
      const newAvailability = { ...prev };
      // Инициализируем массив слотов для выбранной даты, если его еще нет
      if (!newAvailability[selectedDate]) {
        newAvailability[selectedDate] = [];
      }
      
      if (newAvailability[selectedDate].includes(timeSlot)) {
        // Удаляем слот из выбранных
        newAvailability[selectedDate] = newAvailability[selectedDate].filter(slot => slot !== timeSlot);
        // Если массив слотов пустой, удаляем дату из объекта
        if (newAvailability[selectedDate].length === 0) {
          delete newAvailability[selectedDate];
        }
      } else {
        // Добавляем слот к выбранным
        newAvailability[selectedDate] = [...newAvailability[selectedDate], timeSlot];
      }
      
      return newAvailability;
    });
  };

  // Проверяет, выбран ли временной слот для текущей даты
  const isTimeSlotSelected = (timeSlot: string) => {
    if (!selectedDate || !availability[selectedDate]) return false;
    return availability[selectedDate].includes(timeSlot);
  };

  // Проверяет, разрешено ли имя в списке участников
  const isNameAllowed = (name: string) => {
    if (!event || !event.allowedParticipants) return true;
    return event.allowedParticipants.includes(name);
  };

  // Переход к следующему шагу
  const goToNextStep = () => {
    if (!userName) {
      setErrorMessage('Пожалуйста, введите ваше имя');
      return;
    }

    // Проверяем, есть ли имя в списке разрешенных
    if (event?.allowedParticipants && !isNameAllowed(userName)) {
      setErrorMessage('Это имя не находится в списке приглашенных. Пожалуйста, выберите из списка или свяжитесь с организатором.');
      return;
    }

    // В режиме редактирования не проверяем, занято ли имя
    if (!isEditMode) {
      // Проверяем, не занято ли имя другим участником
      const isNameTaken = event?.participants.some(p => p.name === userName);
      if (isNameTaken) {
        setErrorMessage('Это имя уже занято. Пожалуйста, выберите другое имя.');
        return;
      }
    }

    setErrorMessage('');
    setStep(2);
  };

  // Отправка данных о доступности
  const submitAvailability = () => {
    // Проверка, что хотя бы один временной слот выбран
    const totalSlotsSelected = Object.values(availability).reduce((total, slots) => total + slots.length, 0);
    if (totalSlotsSelected === 0) {
      setErrorMessage('Пожалуйста, выберите хотя бы один временной слот');
      return;
    }

    // В реальном приложении здесь был бы запрос к API
    const eventsData = JSON.parse(localStorage.getItem('events') || '{}');
    const currentEvent = eventsData[eventId];
    
    if (currentEvent) {
      // Удаляем предыдущие записи того же участника, если они есть
      const existingParticipantIndex = currentEvent.participants.findIndex(
        (p: any) => p.name === userName
      );
      
      if (existingParticipantIndex >= 0) {
        currentEvent.participants.splice(existingParticipantIndex, 1);
      }
      
      // Добавляем нового участника
      currentEvent.participants.push({
        name: userName,
        avatarColor: selectedAvatar,
        availability
      });
      
      // Сохраняем обновленные данные
      localStorage.setItem('events', JSON.stringify(eventsData));
      
      // Вместо показа экрана подтверждения сразу перенаправляем на страницу события
      router.push(`/event/${eventId}`);
    }
  };

  // Получить доступные имена из списка разрешенных (исключая уже использованные)
  const getAvailableNames = () => {
    if (!event || !event.allowedParticipants) return [];
    
    // В режиме редактирования, добавляем текущее имя в список доступных
    if (isEditMode && editName) {
      const namesExceptCurrent = event.allowedParticipants.filter(
        name => !alreadyUsedNames.includes(name) || name === editName
      );
      return namesExceptCurrent;
    }
    
    return event.allowedParticipants.filter(name => !alreadyUsedNames.includes(name));
  };

  // Заголовок в зависимости от режима
  const getPageTitle = () => {
    if (!event) return 'Присоединиться к событию';
    if (isEditMode) return `Изменить доступность: ${event.name}`;
    return `Присоединиться к событию: ${event.name}`;
  };

  return (
    <ClientOnly>
      <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
        <div className="max-w-3xl w-full">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            &larr; Вернуться на главную
          </Link>
          
          <h1 className="text-3xl font-bold mb-6">
            {getPageTitle()}
          </h1>
          
          {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {errorMessage}
            </div>
          )}
          
          {!event ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="mb-4">
                <label htmlFor="eventId" className="block mb-2 font-medium">
                  Код события
                </label>
                <input
                  type="text"
                  id="eventId"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Введите код события"
                  value={eventId}
                  onChange={(e) => {}}
                  required
                />
              </div>
              
              <button
                type="button"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded text-center transition-colors"
                onClick={findEvent}
              >
                Найти событие
              </button>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-24 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <p className="mt-6 text-gray-500 dark:text-gray-400">Загрузка события...</p>
            </div>
          ) : step === 1 ? (
            // Шаг 1: Ввод имени
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="mb-4">
                <p className="font-medium mb-2">
                  Дата: {formattedWeekday}, {formattedDateRange}
                </p>
                <p>Время: с {event?.timeRange?.start} до {event?.timeRange?.end}</p>
              </div>
              
              {event?.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {event.description}
                </p>
              )}
              
              <div className="mb-6">
                <label htmlFor="userName" className="block mb-2 font-medium">
                  Ваше имя
                </label>
                
                {event?.allowedParticipants && getAvailableNames().length > 0 ? (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Выберите ваше имя из списка приглашенных:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                      {getAvailableNames().map(name => (
                        <button
                          key={name}
                          type="button"
                          className={`p-3 rounded-md text-center transition-colors ${
                            userName === name
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                          }`}
                          onClick={() => setUserName(name)}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                    
                    {!isEditMode && alreadyUsedNames.length > 0 && (
                      <div className="mt-3 mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Эти участники уже указали свою доступность:
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {alreadyUsedNames
                            .filter(name => name !== editName)
                            .map(name => (
                              <span key={name} className="bg-gray-100 dark:bg-gray-700 text-gray-500 px-3 py-1 rounded-full text-sm">
                                {name}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    id="userName"
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Введите ваше имя"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && goToNextStep()}
                    required
                  />
                )}
                
                {userName && (
                  <div className="flex items-center gap-4 p-4 mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold ${selectedAvatar}`}>
                      {getInitials(userName)}
                    </div>
                    <div>
                      <p className="font-medium">{userName}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                type="button"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-center transition-colors"
                onClick={goToNextStep}
                disabled={!userName}
              >
                Продолжить
              </button>
            </div>
          ) : (
            // Шаг 2: Выбор даты и времени
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xl font-bold ${selectedAvatar}`}>
                  {getInitials(userName)}
                </div>
                <div>
                  <p className="font-medium">{userName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formattedDateRange}
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  {isEditMode ? 'Измените ваше доступное время:' : 'Когда вы свободны?'}
                </h2>
                
                {/* Выбор даты */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Выберите дату:</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {availableDates.map(date => (
                      <button
                        key={date}
                        type="button"
                        className={`py-2 px-3 border rounded-lg text-center transition-colors ${
                          selectedDate === date
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
                        } ${
                          availability[date] && availability[date].length > 0
                            ? 'ring-2 ring-green-500 dark:ring-green-400'
                            : ''
                        }`}
                        onClick={() => setSelectedDate(date)}
                      >
                        {formatDate(date)}
                      </button>
                    ))}
                  </div>
                  
                  {selectedDate && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Выбрана дата: <span className="font-medium">{formatDate(selectedDate)}</span>
                    </p>
                  )}
                </div>
                
                {/* Выбор временных слотов */}
                {selectedDate && (
                  <>
                    <h3 className="font-medium mb-3">Выберите доступное время для этой даты:</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                      {timeSlots.map((timeSlot) => (
                        <button
                          key={timeSlot}
                          type="button"
                          className={`py-3 px-2 border rounded-lg text-center transition-colors ${
                            isTimeSlotSelected(timeSlot)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
                          }`}
                          onClick={() => toggleTimeSlot(timeSlot)}
                        >
                          {timeSlot}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                
                {/* Итоговая доступность */}
                {Object.keys(availability).length > 0 && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                    <p className="font-medium mb-2">Ваши выбранные даты и слоты:</p>
                    <div className="space-y-2">
                      {Object.entries(availability).map(([date, slots]) => (
                        <div key={date} className="mb-3">
                          <p className="font-medium">{formatDate(date)}:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {(Array.isArray(slots) ? [...slots].sort() : []).map(slot => (
                              <span key={`${date}-${slot}`} className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-lg text-sm">
                                {slot}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  className="sm:flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 font-medium py-2 px-4 rounded text-center transition-colors"
                  onClick={() => setStep(1)}
                >
                  Назад
                </button>
                <button
                  type="button"
                  className="sm:flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded text-center transition-colors"
                  onClick={submitAvailability}
                  disabled={Object.keys(availability).length === 0}
                >
                  {isEditMode ? 'Сохранить изменения' : 'Отправить'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </ClientOnly>
  );
} 