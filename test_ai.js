const axios = require("axios");

async function run() {
    try {
        const response = await axios.post(
            "https://seekai.cc/v1/chat/completions",
            {
                model: "deepseek-v4-pro",
                messages: [{role: "user", content: "Hello"}],
                max_tokens: 10
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer sk-9EMNCX4JJAHuErB0XFu4QZkTv5TZdRv5deaDEWmxoQl1Z7iM"
                }
            }
        );
        console.log("SUCCESS");
        console.log(response.data);
    } catch (error) {
        console.log("ERROR CODE:", error.response?.status);
        console.log("ERROR MESSAGE:", error.message);
        console.log("ERROR DATA:", JSON.stringify(error.response?.data, null, 2));
    }
}
run();
