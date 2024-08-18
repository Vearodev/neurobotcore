import { AnalyticsDataScheme, SupportedServices } from "../../types";
import fs from 'fs/promises'
import path from "path";
import consola from "consola";

export class AnalitycManager {

    private dataDirname = '/storage'
    private dir = __dirname + this.dataDirname

    public data: { [key: string]: AnalyticsDataScheme } = {}


    public async Read(chatId: number | string): Promise<AnalyticsDataScheme> {

        const filePath = path.join(this.dir, `${chatId}.json`);

        const fileData = await fs.readFile(filePath, 'utf-8')

        return JSON.parse(fileData) as AnalyticsDataScheme
    }

    public async Write(service: SupportedServices, chatId: number | string, userName: string) {
        try {

            if(!this.data[chatId]) {
                this.data[chatId] = {
                    'chatgpt': {},
                    'fusion-brain': {}
                }
            }

            if(!this.data[chatId][service][userName])  this.data[chatId][service][userName] = 0;
            this.data[chatId][service][userName] = this.data[chatId][service][userName] + 1

            await fs.mkdir(this.dir, { recursive: true });

            const filePath = path.join(this.dir, `${chatId}.json`);

            await fs.writeFile(filePath, JSON.stringify(this.data[chatId] || {}))
        } catch (error) {
            throw error
        }
    }


    public async Bootstrap() {
        try {

            consola.info(`${AnalitycManager.name} | Иницилизация `)
            consola.info(`${AnalitycManager.name} | Чтение файлов...`)
            // Получаем список файлов в директории
            const files = await fs.readdir(this.dir);

            // Фильтруем файлы, оставляя только JSON файлы
            const jsonFiles = files.filter(file => path.extname(file) === '.json');

            // Читаем и парсим каждый JSON файл
            const jsonDataPromises = jsonFiles.map(async (file) => {
                const filePath = path.join(this.dir, file);
                const fileContent = await fs.readFile(filePath, 'utf8');
                const jsonContent = JSON.parse(fileContent)

                return { [path.parse(file).name]: jsonContent }
            });

            // Ожидаем выполнения всех промисов
            const jsonData = await Promise.all(jsonDataPromises);

            this.data = jsonData.reduce((acc, val) => {
                const [key, value] = Object.entries(val)[0]
                acc[key] = value

                return acc
            }, {})
          
            consola.success(` ${AnalitycManager.name} | Инициализация завершена`)
        } catch (error) {
            console.log('ee', error)
        }
    }
}