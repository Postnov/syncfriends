export interface Participant {
  name: string;
  avatarColor: string;
  availability: string[];
}

export interface Event {
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