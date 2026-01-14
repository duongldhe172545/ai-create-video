export interface ConsultantMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
