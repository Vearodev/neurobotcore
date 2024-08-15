const fs = require('fs');
const path = require('path');
import TelegramBot from 'node-telegram-bot-api';
import { FusionBrainAnalytics } from '../types';


export class Analytics {

    public static Write(data: any) {
        const filePath = path.join(__dirname, 'storage.json');
        const jsonData = JSON.stringify(data, null, 2); // null и 2 для форматирования JSON
        fs.writeFileSync(filePath, jsonData, 'utf-8');
    }

    public static Read(): Record<string, number> {
        const filePath = path.join(__dirname, 'storage.json');
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(rawData);

        return jsonData
    }
}