import React, { useEffect } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { Storage } from "@plasmohq/storage";

const LOCAL_MODEL_API_URL_KEY = "localModelApiUrl";
const LOCAL_MODEL_NAME_KEY = "localModelName";
const DEFAULT_API_URL = "http://10.123.1.158:11434/api/chat";
const DEFAULT_MODEL = "llama3.3:latest";

const LocalModelSettings: React.FC = () => {
  const [form] = Form.useForm();
  const storage = new Storage();

  useEffect(() => {
    // 加载保存的API地址和模型名称
    const loadSettings = async () => {
      try {
        const savedUrl = await storage.get(LOCAL_MODEL_API_URL_KEY);
        const savedModel = await storage.get(LOCAL_MODEL_NAME_KEY);
        
        if (savedUrl) {
          form.setFieldsValue({ apiUrl: savedUrl });
        } else {
          // 如果没有保存的地址，使用默认地址
          form.setFieldsValue({ apiUrl: DEFAULT_API_URL });
        }
        
        if (savedModel) {
          form.setFieldsValue({ modelName: savedModel });
        } else {
          // 如果没有保存的模型名称，使用默认模型
          form.setFieldsValue({ modelName: DEFAULT_MODEL });
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        message.error("加载设置失败");
      }
    };

    void loadSettings();
  }, [form]);

  const onFinish = async (values: { apiUrl: string, modelName: string }) => {
    try {
      await storage.set(LOCAL_MODEL_API_URL_KEY, values.apiUrl);
      await storage.set(LOCAL_MODEL_NAME_KEY, values.modelName);
      message.success("设置保存成功");
    } catch (error) {
      console.error("Failed to save settings:", error);
      message.error("保存设置失败");
    }
  };

  return (
    <Card title="本地模型设置" style={{ marginBottom: 16 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          label="API地址"
          name="apiUrl"
          rules={[
            { required: true, message: "请输入API地址" },
            { type: "url", message: "请输入有效的URL地址" }
          ]}
          extra="输入Ollama服务器的API地址，例如：http://10.123.1.158:11434/api/chat"
        >
          <Input placeholder="请输入API地址" />
        </Form.Item>
        
        <Form.Item
          label="模型名称"
          name="modelName"
          rules={[
            { required: true, message: "请输入模型名称" }
          ]}
          extra="输入Ollama服务器上的模型名称，例如：llama3.3:latest"
        >
          <Input placeholder="请输入模型名称" />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit">
            保存设置
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default LocalModelSettings; 