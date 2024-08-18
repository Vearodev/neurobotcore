"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateRandomNumber = GenerateRandomNumber;
exports.PrettyJSON = PrettyJSON;
function GenerateRandomNumber() {
}
function PrettyJSON(data) {
    const jsonString = JSON.stringify(data, null, 2);
    return `<pre>${jsonString}</pre>`;
}
//# sourceMappingURL=index.js.map