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
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const fusion_brain_1 = require("./services/neural-networks/fusion-brain");
// Настройки для FusionBrain
const FUSION_BRAIN_API_KEY = '2BE11A47E80F4D4155DF50D074B968B9';
const FUSTION_BRAIN_SECRET_KEY = '76E5AABD2FC5E083B1B8DC106A97E56B';
// Настройки для OpenAI
const OPENAI_API_KEY = '';
// Настройки для телеграм бота
const TELEGRAM_API_KEY = '6876087001:AAGby6Pf8LiyZT0HEiv9Hm18BEh4gBrAtFg';
const FusionBrainService = new fusion_brain_1.FusionBrain({
    API_KEY: FUSION_BRAIN_API_KEY,
    SECRET_KEY: FUSTION_BRAIN_SECRET_KEY
});
const bot = new node_telegram_bot_api_1.default(TELEGRAM_API_KEY, { polling: true });
const commandExecuter = (msg) => (msg === null || msg === void 0 ? void 0 : msg.length) ? msg[1] : null;
// Создаём триггер для реагирования бота на сообщения в чате
// В данном случае бот реагирует на сообщения которые начинаются с /fb
bot.onText(/\/fb (.+)/, (msg, match) => __awaiter(void 0, void 0, void 0, function* () { return yield FusionBrainText2ImageHandler(msg, match); }));
// Хендлер для команды на генерацию изображения с помощью FusionBrain
function FusionBrainText2ImageHandler(tgMessage, tgMessageCommand) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Идентификатор чата в котором получено сообщение
            const chatId = tgMessage.chat.id;
            // Извлекаем команду в сообщении после нашего триггера
            // /fb .... <- наша команда
            const command = commandExecuter(tgMessageCommand);
            if (!command)
                return;
            // После того как мы проверили что команда существует, и мы ее принимаем
            // Отправляем в чат сообщение о том что процедура начата
            bot.sendMessage(chatId, `Запрос на генерацию принят. Время генерации примерно 30 секунд`, {
                reply_to_message_id: tgMessage.message_id
            });
            // С помощью нашего сервиса FusionBrain генерируем картинку
            const data = yield FusionBrainService.Text2Image(command);
            // Если ответ есть, и он помечен как не прошедший цензуру
            if (data && data.censored)
                bot.sendMessage(chatId, `Запрос не прошёл проверку цензуры`, {
                    reply_to_message_id: tgMessage.message_id
                });
            // Если ответ есть, и с ним всё ок, в ответе есть картинка в base
            // конвертируем её в буфер и отправляем в телегу
            else if (data && data.images)
                bot.sendPhoto(chatId, Buffer.from(data.images[0], 'base64'), {
                    caption: command,
                    reply_to_message_id: tgMessage.message_id
                });
        }
        catch (error) {
            console.log('ERROR', error);
        }
    });
}
//# sourceMappingURL=index.js.map