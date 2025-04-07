import React, {createContext, useEffect, useRef, useState} from "react";
import {getLatestState} from "~utils";
import {Llavav1634b} from "~libs/chatbot/perplexity/Llavav1634b";
import {KimiBot} from "~libs/chatbot/kimi";
import {CopilotBot} from "~libs/chatbot/copilot";
import ChatGPT35Turbo from "~libs/chatbot/openai/ChatGPT35Turbo";
import {Gemma7bIt} from "~libs/chatbot/perplexity/Gemma7bIt";
import {Mistral822b} from "~libs/chatbot/perplexity/Mistral822b";
import {Llama3SonarLarge32KChat} from "~libs/chatbot/perplexity/Llama3SonarLarge32KChat";
import {Storage} from "@plasmohq/storage";
import {Llama3SonarLarge32kOnline} from "~libs/chatbot/perplexity/Llama3SonarLarge32kOnline";
import {Claude3Haiku} from "~libs/chatbot/perplexity/Claude3Haiku";
import {Llama370bInstruct} from "~libs/chatbot/perplexity/Llama370bInstruct";
import  ChatGPT4Turbo from "~libs/chatbot/openai/ChatGPT4Turbo";
import {Logger} from "~utils/logger";
import ChatGPT4O from "~libs/chatbot/openai/ChatGPT4o";
import ArkoseGlobalSingleton from "~libs/chatbot/openai/Arkose";

export type M = (
    typeof KimiBot
    )

export type Ms = M[]

export interface CMsItem {
    label: string;
    models: M[];
}
export type CMs = CMsItem[]

interface IModelManagementProvider {
    currentBots: Ms;
    setCurrentBots: React.Dispatch<React.SetStateAction<Ms>>;
    allModels: React.MutableRefObject<Ms>;
    categoryModels: React.MutableRefObject<CMs>;
    saveCurrentBotsKeyLocal: () => void;
}

export const ModelManagementContext = createContext({} as IModelManagementProvider);

export default function ModelManagementProvider({children}) {
    const defaultModels: Ms = [KimiBot];
    const [currentBots, setCurrentBots] = useState<IModelManagementProvider['currentBots']>(defaultModels);
    const allModels = useRef<Ms>([KimiBot]);
    const storage = new Storage();
    const [isLoaded, setIsLoaded] = useState(false);
    const categoryModels = useRef<CMs>([
        {
            label: "Moonshot",
            models: [KimiBot]
        }]
    );

    const handleModelStorge = async () => {
        try {
            setCurrentBots(defaultModels);
        } catch (e) {
            // ignore
        }
        finally {
            setIsLoaded(true);
        }
    };

    useEffect(()=>{
        void handleModelStorge();
        // init arkose
        void ArkoseGlobalSingleton.getInstance().loadArkoseScript();
    },[]);

    const getCurrentModelKey = async () => {
        return [KimiBot.botName];
    };

    const saveCurrentBotsKeyLocal = async () => {
        void storage.set("currentModelsKey", await getCurrentModelKey());
    };

    return (
        <ModelManagementContext.Provider value={{currentBots, allModels, categoryModels, setCurrentBots: setCurrentBots, saveCurrentBotsKeyLocal}}>
            {isLoaded && children}
        </ModelManagementContext.Provider>
    );
}