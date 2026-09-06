const axios = require("axios");
async function run() {
    try {
        const response = await axios.get(
            "https://seekai.cc/v1/models",
            {
                headers: {
                    "Authorization": "Bearer sk-9EMNCX4JJAHuErB0XFu4QZkTv5TZdRv5deaDEWmxoQl1Z7iM"
                }
            }
        );
        console.log("MODELS SUCCESS", response.data.data.slice(0,2));
    } catch (error) {
        console.log("MODELS ERROR CODE:", error.response?.status);
        console.log("MODELS ERROR DATA:", JSON.stringify(error.response?.data, null, 2));
    }
}
run();
