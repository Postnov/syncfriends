'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function CreateEvent() {
  const router = useRouter();
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [eventId, setEventId] = useState('');
  const [isCreated, setIsCreated] = useState(false);
  
  // Список участников
  const [participantName, setParticipantName] = useState('');
  const [participantsList, setParticipantsList] = useState<string[]>([]);

  // Предопределенные варианты времени
  const timeOptions = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  // Добавление нового участника в список
  const addParticipant = () => {
    if (!participantName.trim()) return;
    
    if (!participantsList.includes(participantName.trim())) {
      setParticipantsList([...participantsList, participantName.trim()]);
      setParticipantName('');
    } else {
      alert('Этот человек уже добавлен в список');
    }
  };

  // Удаление участника из списка
  const removeParticipant = (name: string) => {
    setParticipantsList(participantsList.filter(p => p !== name));
  };

  // Установка диапазона "сегодня"
  const setTodayDate = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateRange({
      startDate: today,
      endDate: today
    });
  };

  // Установка диапазона "завтра"
  const setTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    setDateRange({
      startDate: tomorrowDate,
      endDate: tomorrowDate
    });
  };

  // Установка диапазона "эта неделя"
  const setThisWeekRange = () => {
    const today = new Date();
    const endOfWeek = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilEndOfWeek = 6 - dayOfWeek; // 6 = суббота (последний день недели)
    
    endOfWeek.setDate(today.getDate() + daysUntilEndOfWeek);
    
    setDateRange({
      startDate: today.toISOString().split('T')[0],
      endDate: endOfWeek.toISOString().split('T')[0]
    });
  };

  // Обработка изменения начальной даты
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    
    setDateRange(prev => {
      // Если конечная дата не задана или меньше начальной, устанавливаем её равной начальной
      if (!prev.endDate || new Date(prev.endDate) < new Date(newStartDate)) {
        return {
          startDate: newStartDate,
          endDate: newStartDate
        };
      }
      
      return {
        ...prev,
        startDate: newStartDate
      };
    });
  };

  // Обработка изменения конечной даты
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    
    setDateRange(prev => {
      // Если начальная дата не задана, устанавливаем её равной конечной
      if (!prev.startDate) {
        return {
          startDate: newEndDate,
          endDate: newEndDate
        };
      }
      
      // Если новая конечная дата меньше начальной, устанавливаем обе даты равными конечной
      if (new Date(newEndDate) < new Date(prev.startDate)) {
        return {
          startDate: newEndDate,
          endDate: newEndDate
        };
      }
      
      return {
        ...prev,
        endDate: newEndDate
      };
    });
  };

  const createEvent = () => {
    // Валидация временного диапазона
    if (startTime >= endTime) {
      alert('Время начала должно быть раньше времени окончания');
      return;
    }

    // Валидация диапазона дат
    if (!dateRange.startDate || !dateRange.endDate) {
      alert('Необходимо указать начальную и конечную дату');
      return;
    }

    // Генерируем уникальный ID для события
    const newEventId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Создаем объект события
    const eventData = {
      id: newEventId,
      name: eventName,
      description: eventDescription,
      dateRange: {
        start: dateRange.startDate,
        end: dateRange.endDate
      },
      timeRange: {
        start: startTime,
        end: endTime
      },
      participants: [],
      allowedParticipants: participantsList.length > 0 ? participantsList : null
    };
    
    // Сохраняем в localStorage
    const existingEvents = JSON.parse(localStorage.getItem('events') || '{}');
    existingEvents[newEventId] = eventData;
    localStorage.setItem('events', JSON.stringify(existingEvents));
    
    // Устанавливаем ID события и показываем результат
    setEventId(newEventId);
    setIsCreated(true);
  };

  const copyToClipboard = () => {
    // Копируем ссылку в буфер обмена
    const joinUrl = `${window.location.origin}/join?id=${eventId}`;
    navigator.clipboard.writeText(joinUrl);
  };

  return (
    <ClientOnly>
      <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
        <div className="max-w-3xl w-full">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            &larr; Вернуться на главную
          </Link>
          
          <h1 className="text-3xl font-bold mb-6">
            {isCreated ? 'Событие создано!' : 'Создать новое событие'}
          </h1>
          
          {!isCreated ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
              <div className="mb-4">
                <label htmlFor="eventName" className="block mb-2 font-medium">
                  Название события
                </label>
                <input
                  type="text"
                  id="eventName"  
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Например: Встреча команды"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="eventDescription" className="block mb-2 font-medium">
                  Описание события (необязательно)
                </label>
                <textarea
                  id="eventDescription"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Опишите событие..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={2}
                />
              </div>
              
              <div className="mb-6">
                <label className="block mb-2 font-medium">
                  Диапазон дат
                </label>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    onClick={setTodayDate}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-md transition-colors text-sm"
                  >
                    Сегодня
                  </button>
                  <button
                    type="button"
                    onClick={setTomorrowDate}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-md transition-colors text-sm"
                  >
                    Завтра
                  </button>
                  <button
                    type="button"
                    onClick={setThisWeekRange}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-md transition-colors text-sm"
                  >
                    Эта неделя
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block mb-1 text-sm text-gray-600 dark:text-gray-400">
                      Начальная дата
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="date"
                        id="startDate"
                        className="w-full pl-10 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        value={dateRange.startDate}
                        onChange={handleStartDateChange}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block mb-1 text-sm text-gray-600 dark:text-gray-400">
                      Конечная дата
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="date"
                        id="endDate"
                        className="w-full pl-10 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        value={dateRange.endDate}
                        onChange={handleEndDateChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {dateRange.startDate && dateRange.endDate && dateRange.startDate !== dateRange.endDate && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Выбран диапазон: {' '}
                    <span className="font-medium">
                      {new Date(dateRange.startDate).toLocaleDateString('ru-RU')} - {new Date(dateRange.endDate).toLocaleDateString('ru-RU')}
                    </span>
                    {' '} ({Math.round((new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1)} дн.)
                  </p>
                )}
              </div>
              
              <div className="mb-6">
                <span className="block mb-2 font-medium">Временной диапазон встречи</span>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-600 dark:text-gray-400 text-sm w-16">Начало:</span>
                  <div className="flex-1 flex flex-wrap gap-2">
                    {timeOptions.slice(0, 10).map(time => (
                      <button
                        key={`start-${time}`}
                        type="button"
                        className={`py-2 px-2 text-sm rounded-lg transition-colors ${
                          startTime === time 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                        }`}
                        onClick={() => setStartTime(time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400 text-sm w-16">Конец:</span>
                  <div className="flex-1 flex flex-wrap gap-2">
                    {timeOptions.slice(5).map(time => (
                      <button
                        key={`end-${time}`}
                        type="button"
                        className={`py-2 px-2 text-sm rounded-lg transition-colors ${
                          endTime === time 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                        }`}
                        onClick={() => setEndTime(time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <span className="block mb-2 font-medium">Список участников (необязательно)</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Добавьте имена людей, которых вы хотите пригласить. Только они смогут указать свою доступность.
                </p>
                
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Имя участника"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                  />
                  <button
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                    onClick={addParticipant}
                  >
                    Добавить
                  </button>
                </div>
                
                {participantsList.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    <p className="font-medium mb-2">Список приглашенных:</p>
                    <div className="flex flex-wrap gap-2">
                      {participantsList.map(name => (
                        <div key={name} className="bg-white dark:bg-gray-600 px-3 py-1 rounded-full flex items-center gap-2">
                          <span>{name}</span>
                          <button
                            type="button"
                            className="text-gray-500 hover:text-red-500 transition-colors"
                            onClick={() => removeParticipant(name)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                type="button"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md text-center transition-colors"
                onClick={createEvent}
                disabled={!eventName || !dateRange.startDate || !dateRange.endDate}
              >
                Создать событие
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Событие успешно создано!</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Теперь вы можете поделиться ссылкой с участниками
                </p>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Код события:</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{eventId}</span>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{eventName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {dateRange.startDate === dateRange.endDate 
                          ? new Date(dateRange.startDate).toLocaleDateString('ru-RU', { 
                              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                            })
                          : `${new Date(dateRange.startDate).toLocaleDateString('ru-RU')} - ${new Date(dateRange.endDate).toLocaleDateString('ru-RU')}`
                        }
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {startTime} - {endTime}
                      </p>
                    </div>
                    <Link href={`/event/${eventId}`} className="text-blue-600 hover:underline">
                      Просмотр
                    </Link>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block mb-2 font-medium">
                    Ссылка для приглашения:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none"
                      value={`${window.location.origin}/join?id=${eventId}`}
                      readOnly
                    />
                    <button
                      type="button"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                      onClick={copyToClipboard}
                    >
                      Копировать
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Link 
                  href="/"
                  className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 font-medium py-2 px-4 rounded-md text-center transition-colors"
                >
                  На главную
                </Link>
                <Link 
                  href={`/event/${eventId}`}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-center transition-colors"
                >
                  Перейти к событию
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </ClientOnly>
  );
} 