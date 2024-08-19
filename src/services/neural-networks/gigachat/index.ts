import { TelegramService } from "../../../types";
import fetch from 'node-fetch';
import qs from 'qs';
import { v4 as uuidv4 } from 'uuid';
import { GigachatAuthResponse, GigachatChatCompletionReponse, GigchatModel } from "./types";
import consola from "consola";


export class GigachatService implements TelegramService {
    private accessToken: string | null = null;
    private authToken: string | null = null;
    private systemChatDefaultSettings = [
        {
            "role": "system",
            "content": "Ты опытный научный сотрудник. Отвечай как ученый"
        }
    ]



    constructor(authToken: string | undefined) {
        if (!authToken)
            throw new Error(`${GigachatService.name} отсутствует authToken`)

        else
            this.authToken = authToken
    }


    public async GetGeneratedImageById(id: string): Promise<Buffer> {
        const url = 'https://gigachat.devices.sberbank.ru/api/v1/files/c0f74584-2467-476f-8d9b-406f27d938e8/content';

        // Заголовки для запроса
        const headers = { 
          'Accept': 'image/jpg', 
          'Authorization': 'Bearer asdfasdfasdfasdf'
        };

        const tmp = await fetch(url, { method: 'GET', headers: headers })
        const data = await tmp.buffer()

        return data
    }


    public async ChatCompletion(model: GigchatModel, prompt: string, historyMode: boolean = false) {

        if(!this.accessToken) {
            await this.Auth()
        }

        try {
            let data = JSON.stringify({
                "model": model,
                //"function_call": "auto",
                "messages": [
                    ...this.systemChatDefaultSettings,
                  {
                    "role": "user",
                    "content": prompt
                  }
                ],
                "n": 1,
                "stream": false,
                "update_interval": 0
              });
              
              let url = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';
              let headers = { 
                'Content-Type': 'application/json', 
                'Accept': 'application/json', 
                'Authorization': `Bearer ${this.accessToken}`
              };
            const tmp = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: data
              })

            const response: GigachatChatCompletionReponse = await tmp.json()
            return response
        } catch(error: any) {
            if(error.response && error.response.status === 401) {
                await this.Auth()
                await this.ChatCompletion(model, prompt, historyMode)
            }
        }
    }


    public async Auth() {
        try {

            consola.info(`${GigachatService.name} авторизация в системе`)

            const data = qs.stringify({
                'scope': 'GIGACHAT_API_PERS'
            });

            const config = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'RqUID': uuidv4(),
                    'Authorization': `Basic ${this.authToken}`
                },
                body: data
            };

            const response = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', config)
            const responseData: GigachatAuthResponse = await response.json()

            this.accessToken = responseData.access_token


            consola.success(`${GigachatService.name} авторизация в системе выполнена успешно`)
            return responseData

        } catch (error) {
            console.log('ee', error)
        }
    }
}