export interface Model {
    "id": number,
    "name": string
    "version": number,
    "type": string
}

export interface TelegramService {
    // readonly TriggerRegexp: RegExp
}

export interface ImageStyle {
    name: string
    title: string
    titleEn: string
    image: string
}

export interface FusionBrainConfig {
    API_KEY: string | undefined,
    SECRET_KEY: string | undefined
}

export interface CreateTask {
    status: string
    uuid: string
}

export interface GenerationTaskPollingData {
    "uuid":string
    "status": string
    "images": string[],
    "errorDescription": string
    "censored": boolean
}

export interface FusionBrainAnalytics {
    [key: string]: number
}


export type SupportedServices = 'fusion-brain' | 'chatgpt' | 'gigachat'

export enum Service {
    FusionBrain = 'fusion-brain',
    Chatgpt = 'chatgpt',
    Gigachat = 'gigachat'
}

export type AnalyticsDataScheme = {
    [key in Service]: { [k: string]: number} 
}

