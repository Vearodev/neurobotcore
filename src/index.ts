
import TelegramBot from 'node-telegram-bot-api'
import { FusionBrain } from './services/neural-networks/fusion-brain';


// Настройки для FusionBrain
const FUSION_BRAIN_API_KEY = '2BE11A47E80F4D4155DF50D074B968B9';
const FUSTION_BRAIN_SECRET_KEY = '76E5AABD2FC5E083B1B8DC106A97E56B';

// Настройки для OpenAI
const OPENAI_API_KEY = '';

// Настройки для телеграм бота
const TELEGRAM_API_KEY = '6876087001:AAGby6Pf8LiyZT0HEiv9Hm18BEh4gBrAtFg';


const FusionBrainService = new FusionBrain({
    API_KEY: FUSION_BRAIN_API_KEY,
    SECRET_KEY: FUSTION_BRAIN_SECRET_KEY
})


const bot = new TelegramBot(TELEGRAM_API_KEY, { polling: true });
const commandExecuter = (msg: RegExpExecArray | null) => msg?.length ? msg[1] : null


// Создаём триггер для реагирования бота на сообщения в чате
// В данном случае бот реагирует на сообщения которые начинаются с /fb
bot.onText(/\/fb (.+)/, async (msg, match) => await FusionBrainText2ImageHandler(msg, match))


// Хендлер для команды на генерацию изображения с помощью FusionBrain
async function FusionBrainText2ImageHandler(tgMessage: TelegramBot.Message, tgMessageCommand: RegExpExecArray | null) {
    try {
        // Идентификатор чата в котором получено сообщение
        const chatId = tgMessage.chat.id;

        // Извлекаем команду в сообщении после нашего триггера
        // /fb .... <- наша команда
        const command = commandExecuter(tgMessageCommand)

        if (!command) return;

        // После того как мы проверили что команда существует, и мы ее принимаем
        // Отправляем в чат сообщение о том что процедура начата
        bot.sendMessage(chatId, `Запрос на генерацию принят. Время генерации примерно 30 секунд`, {
            reply_to_message_id: tgMessage.message_id
        });

        // С помощью нашего сервиса FusionBrain генерируем картинку
        const data: any = await FusionBrainService.Text2Image(command)

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
            })


    } catch (error) {
        console.log('ERROR', error)
    }
}
