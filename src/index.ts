import 'dotenv/config';

import TelegramBot from 'node-telegram-bot-api'
import { FusionBrain } from './services/neural-networks/fusion-brain';
import { AnalitycManager } from './services/analytics/analytic';
import { Service } from './types';
import { PrettyJSON } from './utils';
import { GigachatService } from './services/neural-networks/gigachat';
import path from 'path';
import consola from 'consola';
import { GigchatModel } from './services/neural-networks/gigachat/types';


// Сервис для ведения базовой аналитики
// на данный момент считает количество запросов от конкретного пользователя в каждом из сервисов
const Analytics = new AnalitycManager();

// Сервис для генерации изображений на основе текстовых запросов 
// с помощью нейросети FUSION BRAIN
const FusionBrainService = new FusionBrain({
    API_KEY: process.env.FUSION_BRAIN_API_KEY,
    SECRET_KEY: process.env.FUSTION_BRAIN_SECRET_KEY
})


const Gigachat = new GigachatService(process.env.GIGACHAT_TOKEN)


const botToken = process.env.TELEGRAM_BOT_TOKEN
if(!botToken) throw new Error('Нет токена для бота')

const bot = new TelegramBot(botToken, { polling: true });

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

        if (!userName) return


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


    bot.onText(/\/news (.+)/, async (msg, match) => {
        const command = commandExecuter(match)

        const chatIds = Object.keys(Analytics.data).filter(i => parseInt(i) < 0)
        console.log(chatIds)

        chatIds.forEach(id => bot.sendMessage(id, command!, {
            parse_mode: 'HTML'
        }))
    })


    bot.onText(/\/g (.+)/, async (msg, match) => {
        const command = commandExecuter(match)

        if (command === 'auth') {
            const r = await Gigachat.Auth()
            return bot.sendMessage(msg.chat.id, PrettyJSON(r), {
                reply_to_message_id: msg?.reply_to_message?.message_id,
                parse_mode: 'HTML'
            });
        }


        else if (command === 'help') {
           
            return bot.sendMessage(msg.chat.id, `Тут будет список команд`, {
                reply_to_message_id:msg.message_id
            });
        }


        const reaction = [{ type: 'emoji', emoji: '👍' }];
         //@ts-ignore
         bot.setMessageReaction(chatId, msg.message_id, { reaction: JSON.stringify(reaction) })


        const response = await Gigachat.ChatCompletion(GigchatModel.GigaChat, command!)
        const choice = response?.choices[0]?.message.content
        
        await Analytics.Write(Service.Gigachat, msg.chat.id, msg.from?.username!, response?.usage.total_tokens)


        bot.sendMessage(msg.chat.id, choice!, {
            reply_to_message_id:msg.message_id,
            parse_mode: 'Markdown'
        });

        //  await FusionBrainText2ImageHandler(msg, command!)
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
        TLSCertsInit()
        await Analytics.Bootstrap()
        await FusionBrainService.Bootstrap()

    } catch (error) {

    } finally {

    }
}


function TLSCertsInit() {

    const test = path.resolve('certs')
    process.env.NODE_EXTRA_CA_CERTS = test
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}