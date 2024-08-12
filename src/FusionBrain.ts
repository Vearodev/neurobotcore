import fetch from 'node-fetch';
import { consola } from "consola";
import { CreateTask, FusionBrainConfig, GenerationTaskPollingData, ImageStyle, Model } from './types';
import FormData from 'form-data';


const API_URL = 'https://api-key.fusionbrain.ai';
const STYLES_URL = 'https://cdn.fusionbrain.ai/static/styles/api';
const TEXT2IMAGE_URL = API_URL + '/key/api/v1/text2image/run';
const TEXT2IMAGE_CHECK_URL =  API_URL + '/key/api/v1/text2image/status/'
const MODELS_URL = API_URL + '/key/api/v1/models';


export class FusionBrain {
    // Храним список задач на генерацию
    private tasksPool: CreateTask[] = []

    // Храним загруженные доступные стили изображений
    private styles: ImageStyle[] = [];

    // Храним доступные модели нейронок
    private models: Model[] = [];

    private API_KEY: string;
    private SECRET_KEY: string;
    
    constructor(config: FusionBrainConfig) {
        this.API_KEY = config.API_KEY;
        this.SECRET_KEY = config.SECRET_KEY


        this.Bootstrap()
    }


    public async CreateGenerateQuery(query: string, negativeQuery?: string, style?: string, modelId?: number) {
        if(this.models.length < 1) throw new Error()

        try {
            const queryParams = {
                type: "GENERATE",
                style: "DEFAULT",
                width: 1024,
                height: 1024,
                num_images: 1,
                negativePromptUnclip: negativeQuery,
                generateParams: {
                    query,
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
            const task: CreateTask = await response.json()
            
            if(task.status = 'INITIAL') {
                console.log('tetetetetetet')
                const data = await this.Polling(task)
                return data
            }
            else {
                throw new Error('')
            }
    
        } catch (error) {
            consola.error(error)
            return error
        }
    }


    public async Polling(task: CreateTask) {
        while (true) {
            try {
                // Выполняем HTTP-запрос
                const response = await fetch(TEXT2IMAGE_CHECK_URL + task.uuid, {
                    headers: this.CreateHeaders()
                })
    
                const data: GenerationTaskPollingData = await response.json()
    
                // Проверяем, удовлетворяет ли ответ условию
                if (data.status === 'DONE' || data.censored) {
                    // Условие выполнено, выходим из цикла
                    console.log("Условие выполнено, завершение Polling");
                    return data;
                }
            } catch (error) {
                // Обработка ошибок запроса
                console.error("Ошибка запроса:", error);
            }
    
            // Ждём перед следующим запросом
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }


    public async GetInfoAboutTask() {
        
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


