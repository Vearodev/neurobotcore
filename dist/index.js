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
const storage_1 = require("./services/storage");
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
bot.onText(/\/fb (.+)/, (msg, match) => __awaiter(void 0, void 0, void 0, function* () {
    const command = commandExecuter(match);
    if (command === 'stat') {
        const data = storage_1.Analytics.Read();
        bot.sendMessage(msg.chat.id, JSON.stringify(data), {
            reply_to_message_id: msg.message_id
        });
    }
    else {
        yield FusionBrainText2ImageHandler(msg, command);
    }
}));
bot.onText(/\/roll/, (msg, match) => __awaiter(void 0, void 0, void 0, function* () {
    bot.sendMessage(msg.chat.id, String(Math.floor(Math.random() * 100) + 1), {
        reply_to_message_id: msg.message_id
    });
}));
// Обрабатываем callback при нажатии на кнопку
bot.on('callback_query', (callbackQuery) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const message = callbackQuery.message;
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const { action } = JSON.parse(callbackQuery.data);
    console.log('message', message);
    console.log('caption', message.caption);
    console.log('data', callbackQuery.data);
    console.log('reply_to_message', message.reply_to_message);
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
        yield FusionBrainText2ImageHandler(message, message.caption, false, (_a = message === null || message === void 0 ? void 0 : message.reply_to_message) === null || _a === void 0 ? void 0 : _a.message_id);
        bot.editMessageReplyMarkup({ inline_keyboard: [
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
            ] }, { chat_id: chatId, message_id: messageId });
    }
    else if (action === 'stat') {
        const originalKeyboards = (_b = message.reply_markup) === null || _b === void 0 ? void 0 : _b.inline_keyboard;
        bot.editMessageReplyMarkup({ inline_keyboard: [
                []
            ] }, { chat_id: chatId, message_id: messageId });
        const data = storage_1.Analytics.Read();
        if (message.message_thread_id)
            bot.sendMessage(message.chat.id, JSON.stringify(data), {
                message_thread_id: message.message_thread_id
            });
        else {
            bot.sendMessage(message.chat.id, JSON.stringify(data), {});
        }
        bot.editMessageReplyMarkup({ inline_keyboard: [[{
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
                    }]] }, { chat_id: chatId, message_id: messageId });
    }
}));
// Хендлер для команды на генерацию изображения с помощью FusionBrain
function FusionBrainText2ImageHandler(tgMessage_1, prompt_1) {
    return __awaiter(this, arguments, void 0, function* (tgMessage, prompt, reaction = true, reply_id) {
        var _a, _b;
        try {
            // Идентификатор чата в котором получено сообщение
            const chatId = tgMessage.chat.id;
            // После того как мы проверили что команда существует, и мы ее принимаем
            // Отправляем в чат сообщение о том что процедура начата
            // bot.sendMessage(chatId, `Запрос на генерацию принят. Время генерации примерно 30 секунд`, {
            //     reply_to_message_id: tgMessage.message_id
            // });
            if (reaction) {
                const reaction = [{ type: 'emoji', emoji: '👍' }];
                //@ts-ignore
                bot.setMessageReaction(chatId, tgMessage.message_id, { reaction: JSON.stringify(reaction) })
                    .then(() => {
                    console.log('Reaction added successfully!');
                });
            }
            // С помощью нашего сервиса FusionBrain генерируем картинку
            const data = yield FusionBrainService.Text2Image(prompt);
            const analyticsData = storage_1.Analytics.Read();
            const userId = ((_b = (_a = tgMessage.reply_to_message) === null || _a === void 0 ? void 0 : _a.from) === null || _b === void 0 ? void 0 : _b.username) || tgMessage.from.username || 'all';
            if (analyticsData[userId])
                analyticsData[userId]++;
            else
                analyticsData[userId] = 1;
            storage_1.Analytics.Write(analyticsData);
            // return bot.sendMessage(chatId, JSON.stringify(tgMessage), {
            //     reply_to_message_id: tgMessage.message_id
            // });
            // Если ответ есть, и он помечен как не прошедший цензуру
            if (data && data.censored) {
                bot.sendMessage(chatId, `Запрос не прошёл проверку цензуры`, {
                    reply_to_message_id: reply_id || tgMessage.message_id
                });
            }
            // Если ответ есть, и с ним всё ок, в ответе есть картинка в base
            // конвертируем её в буфер и отправляем в телегу
            else if (data && data.images) {
                const sendMessage = yield bot.sendPhoto(chatId, Buffer.from(data.images[0], 'base64'), {
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
        }
        catch (error) {
            console.log('ERROR', error);
        }
    });
}
//# sourceMappingURL=index.js.map