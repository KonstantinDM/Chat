export interface Message {
    text: string;
    sender: string;
    timestamp: number;
}

export interface ChatState {
    messages: Message[];
    connected: boolean;
    error: string | null;
} 