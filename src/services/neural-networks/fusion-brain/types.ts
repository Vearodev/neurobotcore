export interface FusionBrainModel {
    id: number,
    name: string
    version: number,
    type: string
}

export interface FusionBrainText2ImageStyle {
    name: string
    title: string
    titleEn: string
    image: string
}

export interface FusionBrainConfiguration {
    API_KEY: string,
    SECRET_KEY: string
}

export interface FusionBrainText2ImageCreationResponse {
    status: string
    uuid: string
}

export interface FusionBrainText2ImageCreationTask {
    uuid: string
    status: string
    images: string[],
    errorDescription: string
    censored: boolean
}