// ==UserScript==
// @name         WhatsApp AutoResposta Áudio
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Detecta mensagem de áudio e responde 1x com aviso que não ouviu o áudio usando mesma lógica do PIX para envio de mensagem.
// @author       ChatGPT
// @match        https://web.whatsapp.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const RESPONDIDOS_AUDIO_KEY = "msgs_audio_respondidas";
    const MENSAGEM_AUDIO = "🔇 Olá! Não consigo ouvir áudios no momento. Por favor, envie sua mensagem por texto.";

    function getHistoricoRespondidos() {
        const raw = localStorage.getItem(RESPONDIDOS_AUDIO_KEY);
        return raw ? JSON.parse(raw) : [];
    }

    function salvarHistoricoRespondidos(lista) {
        localStorage.setItem(RESPONDIDOS_AUDIO_KEY, JSON.stringify(lista.slice(-100)));
    }

    function gerarIdUnico(msgElement) {
        const texto = msgElement.innerText || "";
        const timestamp = msgElement.querySelector("span[data-pre-plain-text]")?.getAttribute("data-pre-plain-text") || "";
        return btoa(texto + timestamp);
    }

    function enviarMensagem(texto, callback) {
        const inputBox = document.querySelector('div[contenteditable="true"][data-tab="10"]');
        if (!inputBox) return;

        inputBox.focus();
        document.execCommand('insertText', false, texto);
        inputBox.dispatchEvent(new InputEvent("input", { bubbles: true }));

        setTimeout(() => {
            const botaoEnviar = document.querySelector('button[data-tab="11"][aria-label="Enviar"]');
            if (botaoEnviar) {
                botaoEnviar.click();
                if (callback) setTimeout(callback, 500);
            }
        }, 300);
    }

    function isAudioMessage(msgDiv) {
        return msgDiv.querySelector('button[aria-label="Reproduzir mensagem de voz"]') !== null
            || msgDiv.querySelector('span[aria-label="Mensagem de voz"]') !== null;
    }

    function verificarMensagens() {
        const mensagens = document.querySelectorAll("div.message-in");
        const historico = getHistoricoRespondidos();

        mensagens.forEach(msg => {
            if (!isAudioMessage(msg)) return;

            const idMsg = gerarIdUnico(msg);
            if (historico.includes(idMsg)) return;

            historico.push(idMsg);
            salvarHistoricoRespondidos(historico);

            console.log("🟢 Mensagem de áudio detectada. Enviando resposta automática...");
            enviarMensagem(MENSAGEM_AUDIO);
        });
    }

    setInterval(verificarMensagens, 2000);

})();
