import { ConsultantMessage } from '../../entities/models/consultant-message.model';

export interface IConsultantService {
    chat(messages: ConsultantMessage[], apiKey: string): Promise<string>;
}
