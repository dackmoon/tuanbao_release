在index页面的近期行程提醒下边，设计一个AI对话助手吧，设计风格与首页保持统一；
1、对话助手需要有头像和昵称，昵称使用当前登录用户的昵称，头像使用当前登录用户的头像；
2、对话助手需要有输入框，输入框需要有placeholder，placeholder为“您好，我是团宝儿的AI助手，有什么可以帮您的吗？”；
3、对话助手需要有发送按钮，发送按钮需要有点击事件，点击事件需要调用api接口，接口信息我稍后填写进去，接口的实例如下：
import OpenAI from "openai";

const openai = new OpenAI(
    {
        // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx",
        apiKey: process.env.DASHSCOPE_API_KEY,
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
    }
);

async function main() {
    const completion = await openai.chat.completions.create({
        model: "qwen-plus",  //此处以qwen-plus为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "你是谁？" }
        ],
    });
    console.log(JSON.stringify(completion))
}

main();

