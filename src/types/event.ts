export interface Participant {
  name: string;
  avatarColor: string;
  availability: {
    [date: string]: string[] // ключ - дата, значение - массив временных слотов
  };
}

export interface Event {
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
  participants: Participant[];
  allowedParticipants: string[] | null;
} 