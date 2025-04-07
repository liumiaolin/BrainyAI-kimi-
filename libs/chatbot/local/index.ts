import {
    type BotCompletionParams,
    type BotConstructorParams,
    type ConversationResponseCb,
    type IBot
} from "~libs/chatbot/IBot";
import {BotBase} from "~libs/chatbot/BotBase";
import {customChatFetch} from "~utils/custom-fetch-for-chat";
import {ChatError, ErrorCode} from "~utils/errors";
import {ConversationResponse, ResponseMessageType} from "~libs/open-ai/open-ai-interface";
import {Logger} from "~utils/logger";
import {createUuid} from "~utils";
import type {IBotSessionSingleton} from "~libs/chatbot/BotSessionBase";
import IconLocal from "data-base64:~assets/local.png";
import {Storage} from "@plasmohq/storage";

const LOCAL_MODEL_API_URL_KEY = "localModelApiUrl";
const LOCAL_MODEL_NAME_KEY = "localModelName";
const DEFAULT_API_URL = "http://10.123.1.158:11434/api/chat";
const DEFAULT_MODEL = "llama3.3:latest";

export class LocalBot extends BotBase implements IBot {
    botName = "Local LLM";
    logoSrc = IconLocal;
    model = DEFAULT_MODEL;
    maxTokenLimit = 4096;
    requireLogin = false;
    paidModel = false;
    supportUploadPDF = false;
    supportUploadImage = false;
    newModel = false;
    private apiUrl: string;
    conversationId: string = "";
    supportedUploadTypes: string[] = [];
    private storage: Storage;
    private conversationHistory: Array<{role: string, content: string}> = [];

    constructor(params: BotConstructorParams) {
        super(params);
        this.storage = new Storage();
        // 默认使用Ollama服务器地址，稍后会从存储中加载用户配置
        this.apiUrl = DEFAULT_API_URL;
        // 初始化时加载用户配置的API地址和模型名称
        void this.loadSettings();
    }

    private async loadSettings() {
        try {
            const savedUrl = await this.storage.get(LOCAL_MODEL_API_URL_KEY);
            const savedModel = await this.storage.get(LOCAL_MODEL_NAME_KEY);
            
            if (savedUrl) {
                this.apiUrl = savedUrl;
                Logger.log('LocalBot API URL loaded from storage:', this.apiUrl);
            }
            
            if (savedModel) {
                this.model = savedModel;
                Logger.log('LocalBot model name loaded from storage:', this.model);
            }
        } catch (error) {
            Logger.error('Failed to load LocalBot settings:', error);
        }
    }

    async completion({prompt, rid, cb}: BotCompletionParams): Promise<void> {
        Logger.log('LocalBot completion', prompt);

        try {
            // 确保使用最新的设置
            await this.loadSettings();

            // 添加用户消息到对话历史
            this.conversationHistory.push({role: "user", content: prompt});

            // 构建请求体 - Ollama API格式
            const requestBody = {
                model: this.model,
                messages: this.conversationHistory,
                stream: false
            };

            // 发送请求到Ollama服务器
            const response = await customChatFetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });

            if (response.error) {
                Logger.error('LocalBot error', response.error);
                cb(rid, new ConversationResponse({
                    message_type: ResponseMessageType.ERROR,
                    error: response.error
                }));
                return;
            }

            // 解析响应
            const responseData = await response.response?.json();
            
            if (!responseData || !responseData.message || !responseData.message.content) {
                cb(rid, new ConversationResponse({
                    message_type: ResponseMessageType.ERROR,
                    error: new ChatError(ErrorCode.UNKNOWN_ERROR, "Invalid response format")
                }));
                return;
            }

            // 添加助手回复到对话历史
            this.conversationHistory.push({
                role: "assistant", 
                content: responseData.message.content
            });

            // 发送生成中的状态
            cb(rid, new ConversationResponse({
                message_type: ResponseMessageType.GENERATING,
                message_text: responseData.message.content
            }));

            // 发送完成状态
            cb(rid, new ConversationResponse({
                message_type: ResponseMessageType.DONE,
                message_text: responseData.message.content
            }));

        } catch (error) {
            Logger.error('LocalBot exception', error);
            cb(rid, new ConversationResponse({
                message_type: ResponseMessageType.ERROR,
                error: new ChatError(ErrorCode.UNKNOWN_ERROR, error.toString())
            }));
        }
    }

    // 设置API URL的方法
    setApiUrl(url: string) {
        this.apiUrl = url;
    }

    // 设置模型名称的方法
    setModel(modelName: string) {
        this.model = modelName;
    }

    // 清空对话历史的方法
    clearConversationHistory() {
        this.conversationHistory = [];
    }

    // 实现 IBot 接口的其他必需方法
    async startAuth(): Promise<boolean> {
        // 本地模型不需要认证
        return true;
    }

    async startCaptcha(): Promise<boolean> {
        // 本地模型不需要验证码
        return true;
    }

    async uploadFile(file: File): Promise<string> {
        // 本地模型不支持文件上传
        throw new Error("File upload not supported for local model");
    }

    getBotName(): string {
        return this.botName;
    }

    getRequireLogin(): boolean {
        return this.requireLogin;
    }

    getLogoSrc(): string {
        return this.logoSrc;
    }

    getLoginUrl(): string {
        return "";
    }

    getSupportUploadPDF(): boolean {
        return this.supportUploadPDF;
    }

    getSupportUploadImage(): boolean {
        return this.supportUploadImage;
    }

    getMaxTokenLimit(): number {
        return this.maxTokenLimit;
    }

    getPaidModel(): boolean {
        return this.paidModel;
    }

    getNewModel(): boolean {
        return this.newModel;
    }
} 