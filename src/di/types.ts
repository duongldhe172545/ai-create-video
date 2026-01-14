export const TYPES = {
    // Service
    AIService: Symbol.for('AIService'),

    // Use Cases
    ParseScriptUseCase: Symbol.for('ParseScriptUseCase'),
    GenerateFrameImageUseCase: Symbol.for('GenerateFrameImageUseCase'),
    GenerateVideoUseCase: Symbol.for('GenerateVideoUseCase'),

    // Controllers
    CampaignController: Symbol.for('CampaignController'),
    FrameController: Symbol.for('FrameController'),

    // Presenters
    FramePresenter: Symbol.for('FramePresenter'),
    ErrorPresenter: Symbol.for('ErrorPresenter'),
};
