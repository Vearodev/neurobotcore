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
const analytic_1 = require("./services/analytics/analytic");
const types_1 = require("./types");
const utils_1 = require("./utils");
// Настройки для FusionBrain
const FUSION_BRAIN_API_KEY = '2BE11A47E80F4D4155DF50D074B968B9';
const FUSTION_BRAIN_SECRET_KEY = '76E5AABD2FC5E083B1B8DC106A97E56B';
// Настройки для OpenAI
const OPENAI_API_KEY = '';
// Настройки для телеграм бота
const TELEGRAM_API_KEY = '6876087001:AAGby6Pf8LiyZT0HEiv9Hm18BEh4gBrAtFg';
// Сервис для ведения базовой аналитики
// на данный момент считает количество запросов от конкретного пользователя в каждом из сервисов
const Analytics = new analytic_1.AnalitycManager();
// Сервис для генерации изображений на основе текстовых запросов 
// с помощью нейросети FUSION BRAIN
const FusionBrainService = new fusion_brain_1.FusionBrain({
    API_KEY: FUSION_BRAIN_API_KEY,
    SECRET_KEY: FUSTION_BRAIN_SECRET_KEY
});
const bot = new node_telegram_bot_api_1.default(TELEGRAM_API_KEY, { polling: true });
const commandExecuter = (msg) => (msg === null || msg === void 0 ? void 0 : msg.length) ? msg[1] : null;
bot.getMe()
    .then((me) => {
    SetListeners();
    Bootstrap();
})
    .catch((err) => {
    console.error('Не пашет');
});
// Хендлер для команды на генерацию изображения с помощью FusionBrain
function FusionBrainText2ImageHandler(tgMessage_1, prompt_1) {
    return __awaiter(this, arguments, void 0, function* (tgMessage, prompt, reaction = true, reply_id, queryUser) {
        var _a, _b, _c, _d;
        try {
            const reaction = [{ type: 'emoji', emoji: '👍' }];
            // Идентификатор чата в котором получено сообщение
            const chatId = tgMessage.chat.id;
            const messageId = tgMessage.message_id;
            const isBot = ((_a = tgMessage.from) === null || _a === void 0 ? void 0 : _a.is_bot) || false;
            const userName = isBot ? (_c = (_b = tgMessage.reply_to_message) === null || _b === void 0 ? void 0 : _b.from) === null || _c === void 0 ? void 0 : _c.username : (_d = tgMessage.from) === null || _d === void 0 ? void 0 : _d.username;
            if (!userName)
                return;
            if (reaction)
                //@ts-ignore
                bot.setMessageReaction(chatId, tgMessage.message_id, { reaction: JSON.stringify(reaction) });
            // С помощью нашего сервиса FusionBrain генерируем картинку
            const data = yield FusionBrainService.Text2Image(prompt);
            // Если ответ есть, и он помечен как не прошедший цензуру
            if (data && data.censored)
                bot.sendMessage(chatId, `Запрос не прошёл проверку цензуры`, {
                    reply_to_message_id: reply_id || tgMessage.message_id
                });
            // Если ответ есть, и с ним всё ок, в ответе есть картинка в base
            // конвертируем её в буфер и отправляем в телегу
            else if (data && data.images) {
                yield bot.sendPhoto(chatId, Buffer.from(data.images[0], 'base64'), {
                    caption: prompt,
                    reply_to_message_id: reply_id || tgMessage.message_id,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: '🗑',
                                    callback_data: JSON.stringify({
                                        action: 'delete'
                                    })
                                },
                                {
                                    text: '🔄',
                                    callback_data: JSON.stringify({
                                        action: 'retry',
                                    })
                                },
                                {
                                    text: '🏆',
                                    callback_data: JSON.stringify({
                                        action: 'stat',
                                    })
                                }
                            ]
                        ]
                    }
                });
            }
            yield Analytics.Write(types_1.Service.FusionBrain, chatId, queryUser || userName);
        }
        catch (error) {
            console.log('ERROR', error);
        }
    });
}
function SetListeners() {
    return __awaiter(this, void 0, void 0, function* () {
        // Триггер для нейросети FusionBrain
        bot.onText(/\/f (.+)/, (msg, match) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const command = commandExecuter(match);
            if (command === 'stat')
                return bot.sendMessage(msg.chat.id, (0, utils_1.PrettyJSON)(Analytics.data[String(msg.chat.id)]), {
                    reply_to_message_id: (_a = msg === null || msg === void 0 ? void 0 : msg.reply_to_message) === null || _a === void 0 ? void 0 : _a.message_id,
                    parse_mode: 'HTML'
                });
            yield FusionBrainText2ImageHandler(msg, command);
        }));
        bot.onText(/\/roll/, (msg, match) => __awaiter(this, void 0, void 0, function* () {
            bot.sendMessage(msg.chat.id, String(Math.floor(Math.random() * 100) + 1), {
                reply_to_message_id: msg.message_id
            });
        }));
        // Обрабатываем callback при нажатии на кнопку
        bot.on('callback_query', (callbackQuery) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userName = callbackQuery.from.username;
            const message = callbackQuery.message;
            const chatId = callbackQuery.message.chat.id;
            const messageId = callbackQuery.message.message_id;
            const { action } = JSON.parse(callbackQuery.data);
            // console.log('query', callbackQuery)
            // console.log('message', message)
            // console.log('caption', message.caption)
            // console.log('data', callbackQuery.data)
            // console.log('reply_to_message', message.reply_to_message)
            if (action === 'delete') {
                // Удаляем сообщение, если выбрана реакция "дизлайк"
                bot.deleteMessage(chatId, messageId)
                    .then(() => {
                })
                    .catch(err => {
                    console.error('Ошибка при удалении сообщения:', err);
                });
            }
            else if (action === 'retry') {
                const reaction = [{ type: 'emoji', emoji: '👍' }];
                bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
                //@ts-ignore
                bot.setMessageReaction(chatId, messageId, { reaction: JSON.stringify(reaction) });
                yield FusionBrainText2ImageHandler(message, message.caption, false, (_a = message === null || message === void 0 ? void 0 : message.reply_to_message) === null || _a === void 0 ? void 0 : _a.message_id, userName);
                bot.editMessageReplyMarkup({
                    inline_keyboard: [
                        [
                            {
                                text: '🗑',
                                callback_data: JSON.stringify({
                                    action: 'delete'
                                })
                            },
                            {
                                text: '🔄',
                                callback_data: JSON.stringify({
                                    action: 'retry',
                                })
                            }
                        ]
                    ]
                }, { chat_id: chatId, message_id: messageId });
            }
            else if (action === 'stat') {
                bot.sendMessage(message.chat.id, (0, utils_1.PrettyJSON)(Analytics.data[String(message.chat.id)]), {
                    reply_to_message_id: (_b = message === null || message === void 0 ? void 0 : message.reply_to_message) === null || _b === void 0 ? void 0 : _b.message_id,
                    parse_mode: 'HTML'
                });
            }
        }));
    });
}
function Bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield Analytics.Bootstrap();
            yield FusionBrainService.Bootstrap();
        }
        catch (error) {
        }
        finally {
        }
    });
}
//# sourceMappingURL=index.js.map