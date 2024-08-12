import { FusionBrain } from "./FusionBrain";
import TelegramBot from 'node-telegram-bot-api'
import { GenerationTaskPollingData } from "./types";


// Настройки для FusionBrain
const FUSION_BRAIN_API_KEY = '';
const FUSTION_BRAIN_SECRET_KEY = '';

// Настройки для OpenAI
const OPENAI_API_KEY = '';

// Настройки для телеграм бота
const TELEGRAM_API_KEY = '';



const Brain1 = new FusionBrain({
    API_KEY: FUSION_BRAIN_API_KEY,
    SECRET_KEY: FUSTION_BRAIN_SECRET_KEY
})



const bot = new TelegramBot(TELEGRAM_API_KEY, { polling: true });



bot.onText(/\/fb (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const command = match?.length ? match[1] : null;


    if (!command) return;

    try {
        bot.sendMessage(chatId, `Запрос на генерацию принят. Время генерации примерно 30 секунд`, {
            reply_to_message_id: msg.message_id
        });


        const data: any = await Brain1.CreateGenerateQuery(command)
        

        if(data && data.censored) {
            bot.sendMessage(chatId, `Запрос не прошёл проверку цензуры`, {
                reply_to_message_id: msg.message_id
            });
        }

        else if(data && data.images) {

            bot.sendPhoto(chatId, Buffer.from(data.images[0], 'base64'), {
                caption: command,
                reply_to_message_id: msg.message_id
            })

            // bot.sendMediaGroup(chatId, data.images.map((i: any) => ({type: 'photo', media: data.images[0]})), {
            //     reply_to_message_id: msg.message_id
            // })

            // bot.sendMediaGroup(chatId, response.data.data.map(i =>{
            //     return {type: 'photo', media: i.url}
            // }));
        }



    } catch (error) {
        console.log('ERROR', error)



    }
})

