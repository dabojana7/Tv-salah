
export enum InteractionMode {
  TEXT = 'TEXT',
  VOICE = 'VOICE'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Property {
  id: string;
  title: string;
  price: string;
  location: string;
  image: string;
  description: string;
}

export interface LeadData {
  name?: string;
  phone?: string;
  interest?: string;
  budget?: string;
}
