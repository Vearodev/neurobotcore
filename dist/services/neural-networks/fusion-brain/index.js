"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FusionBrain = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const consola_1 = require("consola");
const form_data_1 = __importDefault(require("form-data"));
const API_URL = 'https://api-key.fusionbrain.ai';
const STYLES_URL = 'https://cdn.fusionbrain.ai/static/styles/api';
const TEXT2IMAGE_URL = API_URL + '/key/api/v1/text2image/run';
const TEXT2IMAGE_CHECK_URL = API_URL + '/key/api/v1/text2image/status/';
const MODELS_URL = API_URL + '/key/api/v1/models';
class FusionBrain {
    constructor(config) {
        // Храним загруженные доступные стили изображений
        this.styles = [];
        // Храним доступные модели нейронок
        this.models = [];
        this.API_KEY = config.API_KEY;
        this.SECRET_KEY = config.SECRET_KEY;
        this.Bootstrap();
    }
    Text2Image(prompt, negativePrompt, style, modelId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.models.length < 1)
                throw new Error();
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
                };
                const form = new form_data_1.default();
                form.append('params', JSON.stringify(queryParams), { contentType: 'application/json' });
                form.append('model_id', String(modelId || this.models[0].id));
                const response = yield (0, node_fetch_1.default)(TEXT2IMAGE_URL, {
                    method: 'POST',
                    headers: Object.assign({}, this.CreateHeaders()),
                    body: form
                });
                const task = yield response.json();
                if (task.status = 'INITIAL')
                    return yield this.Polling(TEXT2IMAGE_CHECK_URL + task.uuid, this.IsText2ImageConfitionFullfiled);
                else
                    throw new Error('');
            }
            catch (error) {
                consola_1.consola.error(error);
                return error;
            }
        });
    }
    IsText2ImageConfitionFullfiled(data) {
        return data.status === 'DONE' || data.censored;
    }
    Polling(url, condition) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(url);
            while (true) {
                try {
                    // Выполняем HTTP-запрос
                    const response = yield (0, node_fetch_1.default)(url, {
                        headers: this.CreateHeaders()
                    });
                    const data = yield response.json();
                    if (condition(data))
                        return data;
                }
                catch (error) {
                    // Обработка ошибок запроса
                    console.error("Ошибка запроса:", error);
                }
                // Ждём перед следующим запросом
                yield new Promise(resolve => setTimeout(resolve, 3000));
            }
        });
    }
    Bootstrap() {
        return __awaiter(this, void 0, void 0, function* () {
            consola_1.consola.info('Загрузка данных...');
            try {
                yield Promise.all([this.LoadModels(), this.LoadImageStyles()]);
                //await this.CreateGenerateQuery('Пушистый кот в отчках')
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    // Метод для генерации заголовков авторизации
    CreateHeaders() {
        return {
            'X-Key': 'Key ' + this.API_KEY,
            'X-Secret': 'Secret ' + this.SECRET_KEY
        };
    }
    // Метод загрузки доступных моделей нейронок
    LoadModels() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield (0, node_fetch_1.default)(MODELS_URL, {
                    headers: this.CreateHeaders()
                });
                this.models = yield response.json();
                consola_1.consola.success(`Модели успешно загружены: ${this.models.map(m => `${m.name} | ${m.type}`)}`);
            }
            catch (error) {
                consola_1.consola.error(error);
                return error;
            }
        });
    }
    // Метод загрузки доступных стилей изображения
    LoadImageStyles() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield (0, node_fetch_1.default)(STYLES_URL);
                this.styles = yield response.json();
                consola_1.consola.success(`Стили изображений загружены: ${this.styles.map(i => i.name)}`);
            }
            catch (error) {
                consola_1.consola.error(error);
                return error;
            }
        });
    }
}
exports.FusionBrain = FusionBrain;
//# sourceMappingURL=index.js.map