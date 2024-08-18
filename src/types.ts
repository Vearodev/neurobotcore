export interface Model {
    "id": number,
    "name": string
    "version": number,
    "type": string
}

export interface TelegramService {
    readonly TriggerRegexp: RegExp
}

export interface ImageStyle {
    name: string
    title: string
    titleEn: string
    image: string
}

export interface FusionBrainConfig {
    API_KEY: string,
    SECRET_KEY: string
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


export type SupportedServices = 'fusion-brain' | 'chatgpt'

export enum Service {
    FusionBrain = 'fusion-brain',
    Chatgpt = 'chatgpt'
}

export type AnalyticsDataScheme = {
    [key in Service]: { [k: string]: number} 
}

