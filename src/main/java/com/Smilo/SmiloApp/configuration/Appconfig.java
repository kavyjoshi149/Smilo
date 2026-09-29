package com.Smilo.SmiloApp.configuration;

import org.modelmapper.ModelMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.ui.ModelMap;

@Configuration
public class Appconfig {

    @Bean
    public ModelMapper getmapper(){
        return new ModelMapper();
    }


    @Bean
    public ChatClient getclientGen(GoogleGenAiChatModel model){
        return ChatClient.builder(model).build();
    }
}
