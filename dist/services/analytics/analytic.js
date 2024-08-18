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
exports.AnalitycManager = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const consola_1 = __importDefault(require("consola"));
class AnalitycManager {
    constructor() {
        this.dataDirname = '/storage';
        this.dir = __dirname + this.dataDirname;
        this.data = {};
    }
    Read(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = path_1.default.join(this.dir, `${chatId}.json`);
            const fileData = yield promises_1.default.readFile(filePath, 'utf-8');
            return JSON.parse(fileData);
        });
    }
    Write(service, chatId, userName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.data[chatId]) {
                    this.data[chatId] = {
                        'chatgpt': {},
                        'fusion-brain': {}
                    };
                }
                if (!this.data[chatId][service][userName])
                    this.data[chatId][service][userName] = 0;
                this.data[chatId][service][userName] = this.data[chatId][service][userName] + 1;
                yield promises_1.default.mkdir(this.dir, { recursive: true });
                const filePath = path_1.default.join(this.dir, `${chatId}.json`);
                yield promises_1.default.writeFile(filePath, JSON.stringify(this.data[chatId] || {}));
            }
            catch (error) {
                throw error;
            }
        });
    }
    Bootstrap() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                consola_1.default.info(`${AnalitycManager.name} | Иницилизация `);
                consola_1.default.info(`${AnalitycManager.name} | Чтение файлов...`);
                // Получаем список файлов в директории
                const files = yield promises_1.default.readdir(this.dir);
                // Фильтруем файлы, оставляя только JSON файлы
                const jsonFiles = files.filter(file => path_1.default.extname(file) === '.json');
                // Читаем и парсим каждый JSON файл
                const jsonDataPromises = jsonFiles.map((file) => __awaiter(this, void 0, void 0, function* () {
                    const filePath = path_1.default.join(this.dir, file);
                    const fileContent = yield promises_1.default.readFile(filePath, 'utf8');
                    const jsonContent = JSON.parse(fileContent);
                    return { [path_1.default.parse(file).name]: jsonContent };
                }));
                // Ожидаем выполнения всех промисов
                const jsonData = yield Promise.all(jsonDataPromises);
                this.data = jsonData.reduce((acc, val) => {
                    const [key, value] = Object.entries(val)[0];
                    acc[key] = value;
                    return acc;
                }, {});
                consola_1.default.success(` ${AnalitycManager.name} | Инициализация завершена`);
            }
            catch (error) {
                console.log('ee', error);
            }
        });
    }
}
exports.AnalitycManager = AnalitycManager;
//# sourceMappingURL=analytic.js.map