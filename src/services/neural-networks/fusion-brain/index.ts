import fetch from 'node-fetch';
import { consola } from "consola";
import FormData from 'form-data';
import { FusionBrainModel, FusionBrainText2ImageCreationResponse, FusionBrainText2ImageCreationTask, FusionBrainText2ImageStyle } from './types';
import { FusionBrainConfig, TelegramService } from '../../../types';
import { AnalitycManager } from '../../analytics/analytic';


const API_URL = 'https://api-key.fusionbrain.ai';
const STYLES_URL = 'https://cdn.fusionbrain.ai/static/styles/api';
const TEXT2IMAGE_URL = API_URL + '/key/api/v1/text2image/run';
const TEXT2IMAGE_CHECK_URL =  API_URL + '/key/api/v1/text2image/status/'
const MODELS_URL = API_URL + '/key/api/v1/models';


export class FusionBrain implements TelegramService {

    // Храним загруженные доступные стили изображений
    private styles: FusionBrainText2ImageStyle[] = [];

    // Храним доступные модели нейронок
    private models: FusionBrainModel[] = [];

    private API_KEY: string;
    private SECRET_KEY: string;
    

    constructor(config: FusionBrainConfig) {
        this.API_KEY = config.API_KEY;
        this.SECRET_KEY = config.SECRET_KEY
    }


    public get TriggerRegexp(): RegExp  {
        return new RegExp(`/f (.+)/`)
    }


    public async Text2Image(prompt: string, negativePrompt?: string, style?: string, modelId?: number) {
        if(this.models.length < 1) throw new Error()

        try {
            const queryParams = {
                type: "GENERATE",
                style: "DEFAULT",
                width: 1024,
                height: 1024,
                num_images: 1,
                negativePromptUnclip: negativePrompt,
                generateParams: {
                    query: prompt,
                }
            }

            const form = new FormData();
            form.append('params', JSON.stringify(queryParams), { contentType: 'application/json' });
            form.append('model_id', String(modelId || this.models[0].id));
            
            const response = await fetch(TEXT2IMAGE_URL, {
                method: 'POST',
                headers: {
                    ...this.CreateHeaders()
                },
                body: form
            })
            const task: FusionBrainText2ImageCreationResponse = await response.json()
            
            if(task.status = 'INITIAL') return await this.Polling(TEXT2IMAGE_CHECK_URL + task.uuid, this.IsText2ImageConfitionFullfiled)
            else throw new Error('')
        } catch (error) {
            consola.error(error)
            return error
        }
    }

    private IsText2ImageConfitionFullfiled(data: FusionBrainText2ImageCreationTask) {
        return data.status === 'DONE' || data.censored
    }


    public async Polling(url: string, condition: (data: FusionBrainText2ImageCreationTask) => boolean) {
        console.log(url)
        while (true) {
            try {
                // Выполняем HTTP-запрос
                const response = await fetch(url, {
                    headers: this.CreateHeaders()
                })
    
                const data: FusionBrainText2ImageCreationTask = await response.json()

                if(condition(data)) return data
            } catch (error) {
                // Обработка ошибок запроса
                console.error("Ошибка запроса:", error);
            }
    
            // Ждём перед следующим запросом
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }

    public async Bootstrap() {
        
        consola.info('Загрузка данных...')

        try {
            await Promise.all([this.LoadModels(), this.LoadImageStyles()])
            //await this.CreateGenerateQuery('Пушистый кот в отчках')
        } catch(error) {
            console.log(error)
        }
    }

    // Метод для генерации заголовков авторизации
    protected CreateHeaders() {
        return {
            'X-Key': 'Key ' + this.API_KEY,
            'X-Secret': 'Secret ' + this.SECRET_KEY
        }
    }

    // Метод загрузки доступных моделей нейронок
    public async LoadModels() {
        try {
            const response = await fetch(MODELS_URL, {
                headers: this.CreateHeaders()
            })
            this.models = await response.json()
            consola.success(`Модели успешно загружены: ${this.models.map(m => `${m.name} | ${m.type}`)}`)
        } catch (error) {
            consola.error(error)
            return error
        }
    }



    // Метод загрузки доступных стилей изображения
    public async LoadImageStyles() {
        try {
            const response = await fetch(STYLES_URL)
            this.styles = await response.json()
            consola.success(`Стили изображений загружены: ${this.styles.map(i => i.name)}`)
        } catch (error) {
            consola.error(error)
            return error
        }
    } 
}


