// Генерация случайного кода события
function generateEventCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Генерация временных слотов с интервалом 30 минут
function generateTimeSlots(startTime, endTime) {
    const slots = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startDate = new Date();
    startDate.setHours(startHour, startMinute, 0);
    
    const endDate = new Date();
    endDate.setHours(endHour, endMinute, 0);
    
    let currentTime = new Date(startDate);
    
    while (currentTime < endDate) {
        const hours = currentTime.getHours().toString().padStart(2, '0');
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        slots.push(`${hours}:${minutes}`);
        
        currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    
    return slots;
}

// Форматирование даты в локальный формат
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

// Основное Vue-приложение
const app = Vue.createApp({
    data() {
        return {
            // Общие данные для всех страниц
            currentPage: window.location.pathname.split('/').pop(),
            
            // Главная страница
            
            // Страница создания события
            event: {
                name: '',
                date: '',
                startTime: '10:00',
                endTime: '18:00',
                organizerName: '',
                participants: []
            },
            showSuccessMessage: false,
            eventCode: '',
            
            // Страница присоединения
            enteredCode: '',
            eventFound: false,
            eventNotFound: false,
            participantName: '',
            timeSlots: [],
            selectedSlots: [],
            
            // Страница просмотра события
            bestTimeSlots: []
        };
    },
    
    mounted() {
        // Проверяем URL на наличие параметров
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');
        
        if (eventId) {
            this.enteredCode = eventId;
            this.findEvent();
        }
        
        // Устанавливаем текущую дату для создания события
        if (this.currentPage === 'create.html' && !this.event.date) {
            this.setTodayDate();
        }
    },
    
    methods: {
        // Методы для страницы создания события
        async createEvent() {
            this.eventCode = generateEventCode();
            
            const newEvent = {
                id: this.eventCode,
                name: this.event.name,
                date: this.event.date,
                startTime: this.event.startTime,
                endTime: this.event.endTime,
                organizerName: this.event.organizerName,
                participants: [{
                    name: this.event.organizerName,
                    availability: []
                }]
            };
            
            try {
                // Загружаем существующие события
                const response = await fetch('events.json');
                const data = await response.json();
                
                // Добавляем новое событие
                data.events.push(newEvent);
                
                // В реальном приложении здесь был бы API-вызов для сохранения
                // Здесь мы симулируем сохранение для демонстрации
                console.log('Событие создано:', newEvent);
                
                // Показываем сообщение об успехе
                this.showSuccessMessage = true;
            } catch (error) {
                console.error('Ошибка при создании события:', error);
                alert('Произошла ошибка при создании события. Пожалуйста, попробуйте снова.');
            }
        },
        
        setTodayDate() {
            const today = new Date();
            this.event.date = today.toISOString().split('T')[0];
        },
        
        setTomorrowDate() {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            this.event.date = tomorrow.toISOString().split('T')[0];
        },
        
        copyEventLink() {
            const eventUrl = `${window.location.origin}/event.html?id=${this.eventCode}`;
            navigator.clipboard.writeText(eventUrl)
                .then(() => alert('Ссылка скопирована в буфер обмена!'))
                .catch(err => console.error('Ошибка при копировании:', err));
        },
        
        // Методы для страницы присоединения
        async findEvent() {
            try {
                // Загружаем события
                const response = await fetch('events.json');
                const data = await response.json();
                
                // Ищем событие по коду
                const foundEvent = data.events.find(e => e.id === this.enteredCode.toUpperCase());
                
                if (foundEvent) {
                    this.event = foundEvent;
                    this.eventFound = true;
                    this.eventNotFound = false;
                    this.eventCode = foundEvent.id;
                    
                    // Генерируем временные слоты
                    this.timeSlots = generateTimeSlots(foundEvent.startTime, foundEvent.endTime);
                    
                    // Инициализируем выбранные слоты
                    this.selectedSlots = Array(this.timeSlots.length).fill(false);
                    
                    // Находим лучшее время
                    this.findBestTimeSlots();
                } else {
                    this.eventNotFound = true;
                    this.eventFound = false;
                }
            } catch (error) {
                console.error('Ошибка при поиске события:', error);
                this.eventNotFound = true;
                this.eventFound = false;
            }
        },
        
        async joinEvent() {
            if (!this.participantName) {
                alert('Пожалуйста, введите ваше имя.');
                return;
            }
            
            try {
                // Создаем нового участника
                const newParticipant = {
                    name: this.participantName,
                    availability: [...this.selectedSlots]
                };
                
                // Загружаем события
                const response = await fetch('events.json');
                const data = await response.json();
                
                // Находим событие и добавляем участника
                const eventIndex = data.events.findIndex(e => e.id === this.eventCode);
                
                if (eventIndex !== -1) {
                    data.events[eventIndex].participants.push(newParticipant);
                    
                    // В реальном приложении здесь был бы API-вызов для сохранения
                    console.log('Участник добавлен:', newParticipant);
                    
                    // Перенаправляем на страницу события
                    window.location.href = `event.html?id=${this.eventCode}`;
                }
            } catch (error) {
                console.error('Ошибка при присоединении к событию:', error);
                alert('Произошла ошибка при сохранении данных. Пожалуйста, попробуйте снова.');
            }
        },
        
        // Методы для страницы просмотра события
        findBestTimeSlots() {
            if (!this.event.participants || this.event.participants.length === 0) {
                this.bestTimeSlots = [];
                return;
            }
            
            const availabilityCounts = [];
            const totalParticipants = this.event.participants.length;
            
            // Генерируем временные слоты, если их еще нет
            if (this.timeSlots.length === 0) {
                this.timeSlots = generateTimeSlots(this.event.startTime, this.event.endTime);
            }
            
            // Подсчитываем доступность для каждого временного слота
            for (let slotIndex = 0; slotIndex < this.timeSlots.length; slotIndex++) {
                let availableCount = 0;
                
                for (const participant of this.event.participants) {
                    if (participant.availability && participant.availability[slotIndex]) {
                        availableCount++;
                    }
                }
                
                availabilityCounts.push({
                    slotIndex,
                    count: availableCount
                });
            }
            
            // Сортируем по количеству доступных участников (по убыванию)
            availabilityCounts.sort((a, b) => b.count - a.count);
            
            // Выбираем слоты с наибольшим количеством доступных участников
            const maxAvailability = availabilityCounts[0]?.count || 0;
            
            // Если никто не доступен, возвращаем пустой массив
            if (maxAvailability === 0) {
                this.bestTimeSlots = [];
                return;
            }
            
            // Выбираем слоты с максимальной доступностью
            this.bestTimeSlots = availabilityCounts
                .filter(slot => slot.count === maxAvailability)
                .map(slot => slot.slotIndex);
        },
        
        countAvailableParticipants(slotIndex) {
            if (!this.event.participants) return 0;
            
            return this.event.participants.reduce((count, participant) => {
                return count + (participant.availability && participant.availability[slotIndex] ? 1 : 0);
            }, 0);
        },
        
        // Общие методы
        formatDate(dateString) {
            return formatDate(dateString);
        }
    }
});

// Монтируем приложение
app.mount('#app');
