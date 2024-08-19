export interface GigachatAuthResponse {
    access_token: string;
    expires_at: number;
}


export interface GigachatChatCompletionReponse {
    "choices": GigachatChatCompletionChoice[],
    "created": number,
    "model": string,
    "object": string,
    "usage": {
      "prompt_tokens": number,
      "completion_tokens": number,
      "total_tokens": number
    }
}

export interface GigachatChatCompletionChoice {
    "message": {
      "content": string
      "role": string
    },
    "index": number,
    "finish_reason": string
}


export enum GigchatModel {
    GigaChat = "GigaChat",
    GigaChatPlus = "GigaChat-Plus",
    GigaChatPro = "GigaChat-Pro",
    Embeddings = "Embeddings"
}