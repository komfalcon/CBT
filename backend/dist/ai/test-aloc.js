"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const TOKEN = 'aloc_4v1oVQKLcCciYczCaxozjk8fam8DIUleDLPJOk2R';
const BASE_URL = 'https://questions.aloc.com.ng/api/v2/q/5?subject=chemistry';
async function test() {
    try {
        const res = await axios_1.default.get(BASE_URL, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'AccessToken': TOKEN
            }
        });
        console.log(JSON.stringify(res.data, null, 2));
    }
    catch (err) {
        if (err.response) {
            console.error(err.response.status, err.response.data);
        }
        else {
            console.error(err.message);
        }
    }
}
test();
//# sourceMappingURL=test-aloc.js.map