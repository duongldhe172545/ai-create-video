import { ConsultantMessage } from '../../entities/models/consultant-message.model';
import { ScriptRequest } from '../../entities/models/script-request.model';

export interface IConsultantService {
    chat(messages: ConsultantMessage[], apiKey: string): Promise<string>;
    generateScript(request: ScriptRequest, apiKey: string): Promise<string>;
}
