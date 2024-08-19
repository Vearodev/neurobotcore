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
exports.GigachatService = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const qs_1 = __importDefault(require("qs"));
const uuid_1 = require("uuid");
const consola_1 = __importDefault(require("consola"));
class GigachatService {
    constructor(authToken) {
        this.accessToken = null;
        this.authToken = null;
        this.systemChatDefaultSettings = [
            {
                "role": "system",
                "content": "Ты опытный научный сотрудник. Отвечай как ученый"
            }
        ];
        if (!authToken)
            throw new Error(`${GigachatService.name} отсутствует authToken`);
        else
            this.authToken = authToken;
    }
    GetGeneratedImageById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = 'https://gigachat.devices.sberbank.ru/api/v1/files/c0f74584-2467-476f-8d9b-406f27d938e8/content';
            // Заголовки для запроса
            const headers = {
                'Accept': 'image/jpg',
                'Authorization': 'Bearer asdfasdfasdfasdf'
            };
            const tmp = yield (0, node_fetch_1.default)(url, { method: 'GET', headers: headers });
            const data = yield tmp.buffer();
            return data;
        });
    }
    ChatCompletion(model_1, prompt_1) {
        return __awaiter(this, arguments, void 0, function* (model, prompt, historyMode = false) {
            if (!this.accessToken) {
                yield this.Auth();
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
                const tmp = yield (0, node_fetch_1.default)(url, {
                    method: 'POST',
                    headers: headers,
                    body: data
                });
                const response = yield tmp.json();
                return response;
            }
            catch (error) {
                if (error && error.status === 401) {
                    yield this.Auth();
                    yield this.ChatCompletion(model, prompt, historyMode);
                }
            }
        });
    }
    Auth() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                consola_1.default.info(`${GigachatService.name} авторизация в системе`);
                const data = qs_1.default.stringify({
                    'scope': 'GIGACHAT_API_PERS'
                });
                const config = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json',
                        'RqUID': (0, uuid_1.v4)(),
                        'Authorization': `Basic ${this.authToken}`
                    },
                    body: data
                };
                const response = yield (0, node_fetch_1.default)('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', config);
                const responseData = yield response.json();
                this.accessToken = responseData.access_token;
                consola_1.default.success(`${GigachatService.name} авторизация в системе выполнена успешно`);
                return responseData;
            }
            catch (error) {
                console.log('ee', error);
            }
        });
    }
}
exports.GigachatService = GigachatService;
//# sourceMappingURL=index.js.map