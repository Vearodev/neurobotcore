import { FusionBrain } from "./FusionBrain";
import TelegramBot from 'node-telegram-bot-api'
import { GenerationTaskPollingData } from "./types";


// Настройки для FusionBrain
const FUSION_BRAIN_API_KEY = '2BE11A47E80F4D4155DF50D074B968B9';
const FUSTION_BRAIN_SECRET_KEY = '76E5AABD2FC5E083B1B8DC106A97E56B';

// Настройки для OpenAI
const OPENAI_API_KEY = '';

// Настройки для телеграм бота
const TELEGRAM_API_KEY = '6876087001:AAGby6Pf8LiyZT0HEiv9Hm18BEh4gBrAtFg';



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

