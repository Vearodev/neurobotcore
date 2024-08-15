"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analytics = void 0;
const fs = require('fs');
const path = require('path');
class Analytics {
    static Write(data) {
        const filePath = path.join(__dirname, 'storage.json');
        const jsonData = JSON.stringify(data, null, 2); // null и 2 для форматирования JSON
        fs.writeFileSync(filePath, jsonData, 'utf-8');
    }
    static Read() {
        const filePath = path.join(__dirname, 'storage.json');
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(rawData);
        return jsonData;
    }
}
exports.Analytics = Analytics;
//# sourceMappingURL=storage.js.map