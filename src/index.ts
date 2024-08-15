
import TelegramBot from 'node-telegram-bot-api'
import { FusionBrain } from './services/neural-networks/fusion-brain';
import { Analytics } from './services/storage';



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
bot.onText(/\/fb (.+)/, async (msg, match) => {
    const command = commandExecuter(match)

    if(command === 'stat') {
        const data = Analytics.Read()

    
        bot.sendMessage(msg.chat.id, JSON.stringify(data), {
            reply_to_message_id: msg.message_id
        });
    }
    else {
        await FusionBrainText2ImageHandler(msg, command!)
    }
})


bot.onText(/\/roll/, async (msg, match) => {
    bot.sendMessage(msg.chat.id, String(Math.floor(Math.random() * 100) + 1), {
        reply_to_message_id: msg.message_id
    });
})


 // Обрабатываем callback при нажатии на кнопку
 bot.on('callback_query', async (callbackQuery:any) => {
    const message = callbackQuery.message as TelegramBot.Message;
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const {action} = JSON.parse(callbackQuery.data);

    console.log('message', message)
    console.log('caption', message.caption)
    console.log('data', callbackQuery.data)
    console.log('reply_to_message', message.reply_to_message)

    
    if (action === 'delete') {
        // Удаляем сообщение, если выбрана реакция "дизлайк"
        bot.deleteMessage(chatId, messageId)
            .then(() => {
                
            })
            .catch(err => {
                console.error('Ошибка при удалении сообщения:', err);
            });
    }

    else if(action === 'retry') {
        const reaction = [{ type: 'emoji', emoji: '👍' }]; 

        
        bot.editMessageReplyMarkup({inline_keyboard: []}, {chat_id: chatId, message_id: messageId});
        //@ts-ignore
        bot.setMessageReaction(chatId, messageId, {reaction: JSON.stringify(reaction)})
        await FusionBrainText2ImageHandler(message, message.caption!, false, message?.reply_to_message?.message_id)
        bot.editMessageReplyMarkup({inline_keyboard: [
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
        ]}, {chat_id: chatId, message_id: messageId});
    }

    else if(action === 'stat') {

        const originalKeyboards = message.reply_markup?.inline_keyboard



        bot.editMessageReplyMarkup({inline_keyboard: [
            [
              
            ]
        ]}, {chat_id: chatId, message_id: messageId});

        const data = Analytics.Read()        
    
        if(message.message_thread_id) bot.sendMessage(message.chat.id, JSON.stringify(data), {
            message_thread_id: message.message_thread_id
        });
        else {
            bot.sendMessage(message.chat.id, JSON.stringify(data), {
               
            });
        }

        bot.editMessageReplyMarkup({inline_keyboard: [[ {
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
        }]]}, {chat_id: chatId, message_id: messageId})
    }
});


// Хендлер для команды на генерацию изображения с помощью FusionBrain
async function FusionBrainText2ImageHandler(tgMessage: TelegramBot.Message, prompt: string, reaction: boolean = true, reply_id?: number) {
    try {
        // Идентификатор чата в котором получено сообщение
        const chatId = tgMessage.chat.id;

        // После того как мы проверили что команда существует, и мы ее принимаем
        // Отправляем в чат сообщение о том что процедура начата
        // bot.sendMessage(chatId, `Запрос на генерацию принят. Время генерации примерно 30 секунд`, {
        //     reply_to_message_id: tgMessage.message_id
        // });

        if(reaction) {
            const reaction = [{ type: 'emoji', emoji: '👍' }]; 

            //@ts-ignore
            bot.setMessageReaction(chatId, tgMessage.message_id, {reaction: JSON.stringify(reaction)})
            .then(() => {
                console.log('Reaction added successfully!');
            })
        }
       

        // С помощью нашего сервиса FusionBrain генерируем картинку
        const data: any = await FusionBrainService.Text2Image(prompt)

        const analyticsData = Analytics.Read()

        const userId = tgMessage.reply_to_message?.from?.username || tgMessage.from!.username || 'all'
        if(analyticsData[userId]) analyticsData[userId]++;
        else analyticsData[userId] = 1

        Analytics.Write(analyticsData)

        
        // return bot.sendMessage(chatId, JSON.stringify(tgMessage), {
        //     reply_to_message_id: tgMessage.message_id
        // });

        // Если ответ есть, и он помечен как не прошедший цензуру
        if (data && data.censored)
        {



            bot.sendMessage(chatId, `Запрос не прошёл проверку цензуры`, {
                reply_to_message_id: reply_id || tgMessage.message_id
            });

        }
        // Если ответ есть, и с ним всё ок, в ответе есть картинка в base
        // конвертируем её в буфер и отправляем в телегу
        else if (data && data.images) {
            
            const sendMessage = await bot.sendPhoto(chatId, Buffer.from(data.images[0], 'base64'), {
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


    } catch (error) {
        console.log('ERROR', error)
    }
}
