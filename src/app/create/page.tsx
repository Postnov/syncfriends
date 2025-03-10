'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateEvent() {
  const router = useRouter();
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [eventId, setEventId] = useState('');
  const [isCreated, setIsCreated] = useState(false);
  
  // Список участников
  const [participantName, setParticipantName] = useState('');
  const [participantsList, setParticipantsList] = useState<string[]>([]);

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

  // Установка текущей даты
  const setTodayDate = () => {
    const today = new Date();
    setEventDate(today.toISOString().split('T')[0]);
  };

  // Установка даты "завтра"
  const setTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setEventDate(tomorrow.toISOString().split('T')[0]);
  };

  const createEvent = () => {
    // Валидация временного диапазона
    if (startTime >= endTime) {
      alert('Время начала должно быть раньше времени окончания');
      return;
    }

    // Генерируем уникальный ID для события
    const newEventId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Создаем объект события
    const eventData = {
      id: newEventId,
      name: eventName,
      description: eventDescription,
      date: eventDate,
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

  // Предопределенные варианты времени
  const timeOptions = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  return (
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
              <label htmlFor="eventDate" className="block mb-2 font-medium">
                Дата
              </label>
              
              <div className="flex flex-wrap gap-2 mb-2">
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
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="date"
                  id="eventDate"
                  className="w-full pl-10 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>
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
                      disabled={time <= startTime}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block mb-2 font-medium">
                Список участников (необязательно)
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Добавьте имена участников, которых хотите пригласить. Если не указать список, любой человек сможет присоединиться.
              </p>
              
              <div className="flex mb-2">
                <input
                  type="text"
                  className="flex-grow px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Имя участника"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                />
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-r-md transition-colors"
                  onClick={addParticipant}
                >
                  Добавить
                </button>
              </div>
              
              {participantsList.length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <p className="font-medium mb-2">Список приглашенных:</p>
                  <div className="flex flex-wrap gap-2">
                    {participantsList.map(name => (
                      <div 
                        key={name} 
                        className="flex items-center bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-sm shadow-sm"
                      >
                        <span>{name}</span>
                        <button 
                          onClick={() => removeParticipant(name)}
                          className="ml-2 text-gray-500 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-center transition-colors"
              onClick={createEvent}
              disabled={!eventName || !eventDate}
            >
              Создать событие
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4 text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h2 className="text-xl font-semibold mb-2 text-center">
                {eventName}
              </h2>
              {eventDescription && (
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
                  {eventDescription}
                </p>
              )}
              <div className="mb-4 text-center">
                <p className="font-medium">Дата: {new Date(eventDate).toLocaleDateString('ru-RU', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                })}</p>
                <p className="mt-1">Время: с {startTime} до {endTime}</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md text-center">
                <p className="font-medium mb-2">Код события:</p>
                <div className="text-2xl font-bold py-2">{eventId}</div>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="mb-2 text-center">Отправьте эту ссылку друзьям:</p>
              <div className="flex">
                <input
                  type="text"
                  className="flex-grow px-4 py-2 border rounded-l-md focus:outline-none dark:bg-gray-700 dark:border-gray-600"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join?id=${eventId}`}
                />
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-r-md transition-colors"
                  onClick={copyToClipboard}
                >
                  Копировать
                </button>
              </div>
              
              {participantsList.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <p className="font-medium mb-2">Приглашенные участники:</p>
                  <div className="flex flex-wrap gap-2">
                    {participantsList.map(name => (
                      <div 
                        key={name} 
                        className="bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-sm shadow-sm"
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <Link
                href={`/event/${eventId}`}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded text-center transition-colors"
              >
                Перейти к событию
              </Link>
              <Link
                href="/"
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 font-medium py-2 px-4 rounded text-center transition-colors"
              >
                На главную
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 