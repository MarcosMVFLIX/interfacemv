// ==UserScript==
// @name         WhatsApp Web - Auto Resposta Áudio Radar Híbrido
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Responde todos os áudios, sem falha, mesmo se enviados juntos ou o DOM atrasar. Detecta com precisão cada um.
// @match        https://web.whatsapp.com/
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const MESSAGE_TO_SEND = "🔇 *Olá! Não consigo ouvir áudios no momento.* Por favor, envie sua mensagem por texto.";
    const respondedAudiosMap = new Map(); // conversa => Set de ids de áudios processados

    function getConversationName() {
        const span = document.querySelector('#main header span[title]');
        return span?.getAttribute('title') || 'desconhecido';
    }

    function getAudioId(msg) {
        // Usa o data-id se existir
        const dataId = msg.getAttribute('data-id');
        if (dataId) return dataId;

        // Se não tiver, cria um hash simples
        const hora = msg.querySelector('._2-f7')?.innerText || '';
        const trecho = msg.innerHTML.slice(0, 50);
        return hora + '|' + trecho;
    }

    async function sendMessage(message) {
        const textarea = document.querySelector('#main div[contenteditable="true"]');
        if (!textarea) return false;

        textarea.innerHTML = '';
        textarea.focus();
        document.execCommand('insertText', false, message);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 300));

        const sendButton = document.querySelector('#main [aria-label="Enviar"]');
        if (sendButton) {
            sendButton.click();
            return true;
        }

        return false;
    }

    async function checkForNewAudios() {
        const main = document.querySelector('#main');
        if (!main) return;

        const conversation = getConversationName();
        if (!respondedAudiosMap.has(conversation)) {
            respondedAudiosMap.set(conversation, new Set());
        }

        const processed = respondedAudiosMap.get(conversation);
        const messages = main.querySelectorAll('.message-in');

        for (const msg of messages) {
            const isAudio = msg.querySelector('[data-icon="ptt-status"]');
            if (!isAudio) continue;

            const audioId = getAudioId(msg);
            if (processed.has(audioId)) continue;

            processed.add(audioId);

            console.log(`[Auto Áudio] Respondendo áudio em ${conversation} | id: ${audioId}`);
            await new Promise(r => setTimeout(r, 200));
            const sent = await sendMessage(MESSAGE_TO_SEND);

            if (!sent) {
                processed.delete(audioId); // Permitir retry se falhou
                console.warn(`[Auto Áudio] Falha ao enviar resposta para ${conversation}`);
            }
        }
    }

    function startMonitoring() {
        setInterval(checkForNewAudios, 1000); // verifica a cada 1 segundo
        console.log("[Auto Áudio] Radar híbrido ativado.");
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startMonitoring);
    } else {
        startMonitoring();
    }
})();
