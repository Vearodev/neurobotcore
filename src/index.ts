
import TelegramBot from 'node-telegram-bot-api'
import { FusionBrain } from './services/neural-networks/fusion-brain';
import { AnalitycManager } from './services/analytics/analytic';
import { Service } from './types';
import { PrettyJSON } from './utils';



// Настройки для FusionBrain
const FUSION_BRAIN_API_KEY = '2BE11A47E80F4D4155DF50D074B968B9';
const FUSTION_BRAIN_SECRET_KEY = '76E5AABD2FC5E083B1B8DC106A97E56B';

// Настройки для OpenAI
const OPENAI_API_KEY = '';

// Настройки для телеграм бота
const TELEGRAM_API_KEY = '6876087001:AAGby6Pf8LiyZT0HEiv9Hm18BEh4gBrAtFg';


// Сервис для ведения базовой аналитики
// на данный момент считает количество запросов от конкретного пользователя в каждом из сервисов
const Analytics = new AnalitycManager();

// Сервис для генерации изображений на основе текстовых запросов 
// с помощью нейросети FUSION BRAIN
const FusionBrainService = new FusionBrain({
    API_KEY: FUSION_BRAIN_API_KEY,
    SECRET_KEY: FUSTION_BRAIN_SECRET_KEY
})


const bot = new TelegramBot(TELEGRAM_API_KEY, { polling: true });
const commandExecuter = (msg: RegExpExecArray | null) => msg?.length ? msg[1] : null



bot.getMe()
    .then((me) => {
        SetListeners()
        Bootstrap()
    })
    .catch((err) => {
        console.error('Не пашет')
    })


// Хендлер для команды на генерацию изображения с помощью FusionBrain
async function FusionBrainText2ImageHandler(tgMessage: TelegramBot.Message, prompt: string, reaction: boolean = true, reply_id?: number, queryUser?: string) {
    try {
        const reaction = [{ type: 'emoji', emoji: '👍' }];
        // Идентификатор чата в котором получено сообщение
        const chatId = tgMessage.chat.id;
        const messageId = tgMessage.message_id;
        const isBot = tgMessage.from?.is_bot || false;
        const userName = isBot ? tgMessage.reply_to_message?.from?.username : tgMessage.from?.username;

        if(!userName) return


        if (reaction)
            //@ts-ignore
            bot.setMessageReaction(chatId, tgMessage.message_id, { reaction: JSON.stringify(reaction) })

        
            // С помощью нашего сервиса FusionBrain генерируем картинку
        const data: any = await FusionBrainService.Text2Image(prompt)


        

        // Если ответ есть, и он помечен как не прошедший цензуру
        if (data && data.censored)
            bot.sendMessage(chatId, `Запрос не прошёл проверку цензуры`, {
                reply_to_message_id: reply_id || tgMessage.message_id
            });
        

        // Если ответ есть, и с ним всё ок, в ответе есть картинка в base
        // конвертируем её в буфер и отправляем в телегу
        else if (data && data.images) {

            await bot.sendPhoto(chatId, Buffer.from(data.images[0], 'base64'), {
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
            })
        }



        await Analytics.Write(Service.FusionBrain, chatId, queryUser || userName)
    } catch (error) {
        console.log('ERROR', error)
    }
}



async function SetListeners() {
    

    // Триггер для нейросети FusionBrain
    bot.onText(/\/f (.+)/, async (msg, match) => {
        const command = commandExecuter(match)

        if (command === 'stat')
            return bot.sendMessage(msg.chat.id, PrettyJSON(Analytics.data[String(msg.chat.id)]), {
                reply_to_message_id: msg?.reply_to_message?.message_id,
                parse_mode: 'HTML'
            });
        

        await FusionBrainText2ImageHandler(msg, command!)
    })



    bot.onText(/\/roll/, async (msg, match) => {
        bot.sendMessage(msg.chat.id, String(Math.floor(Math.random() * 100) + 1), {
            reply_to_message_id: msg.message_id
        });
    })


    // Обрабатываем callback при нажатии на кнопку
    bot.on('callback_query', async (callbackQuery: any) => {
        const userName = callbackQuery.from.username;
        const message = callbackQuery.message as TelegramBot.Message;
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
            bot.setMessageReaction(chatId, messageId, { reaction: JSON.stringify(reaction) })
            await FusionBrainText2ImageHandler(message, message.caption!, false, message?.reply_to_message?.message_id, userName)
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



            bot.sendMessage(message.chat.id, PrettyJSON(Analytics.data[String(message.chat.id)]), {
                reply_to_message_id: message?.reply_to_message?.message_id,
                parse_mode: 'HTML'
            });
        }
    }); 
}


async function Bootstrap() {
    try {
        await Analytics.Bootstrap()
        await FusionBrainService.Bootstrap()

    } catch (error) {

    } finally {

    }
}