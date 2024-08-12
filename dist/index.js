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
const FusionBrain_1 = require("./FusionBrain");
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
// Настройки для FusionBrain
const FUSION_BRAIN_API_KEY = '2BE11A47E80F4D4155DF50D074B968B9';
const FUSTION_BRAIN_SECRET_KEY = '76E5AABD2FC5E083B1B8DC106A97E56B';
// Настройки для OpenAI
const OPENAI_API_KEY = '';
// Настройки для телеграм бота
const TELEGRAM_API_KEY = '6876087001:AAGby6Pf8LiyZT0HEiv9Hm18BEh4gBrAtFg';
const Brain1 = new FusionBrain_1.FusionBrain({
    API_KEY: FUSION_BRAIN_API_KEY,
    SECRET_KEY: FUSTION_BRAIN_SECRET_KEY
});
const bot = new node_telegram_bot_api_1.default(TELEGRAM_API_KEY, { polling: true });
bot.onText(/\/fb (.+)/, (msg, match) => __awaiter(void 0, void 0, void 0, function* () {
    const chatId = msg.chat.id;
    const command = (match === null || match === void 0 ? void 0 : match.length) ? match[1] : null;
    if (!command)
        return;
    try {
        bot.sendMessage(chatId, `Запрос на генерацию принят. Время генерации примерно 30 секунд`, {
            reply_to_message_id: msg.message_id
        });
        const data = yield Brain1.CreateGenerateQuery(command);
        if (data && data.censored) {
            bot.sendMessage(chatId, `Запрос не прошёл проверку цензуры`, {
                reply_to_message_id: msg.message_id
            });
        }
        else if (data && data.images) {
            bot.sendPhoto(chatId, Buffer.from(data.images[0], 'base64'), {
                caption: command,
                reply_to_message_id: msg.message_id
            });
            // bot.sendMediaGroup(chatId, data.images.map((i: any) => ({type: 'photo', media: data.images[0]})), {
            //     reply_to_message_id: msg.message_id
            // })
            // bot.sendMediaGroup(chatId, response.data.data.map(i =>{
            //     return {type: 'photo', media: i.url}
            // }));
        }
    }
    catch (error) {
        console.log('ERROR', error);
    }
}));
//# sourceMappingURL=index.js.map