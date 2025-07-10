// ==UserScript==
// @name         WhatsApp AutoResposta Áudio (controle de envio rigoroso)
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Responde 1x por áudio novo, com controle rigoroso para evitar duplicações.
// @match        https://web.whatsapp.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const RESPONDIDOS_AUDIO_KEY = "msgs_audio_respondidas_ids";
    const MENSAGEM_AUDIO = "🔇 Olá! Não consigo ouvir áudios no momento. Por favor, envie sua mensagem por texto. 💬";

    // Histórico de IDs de mensagens já respondidas (armazenados no localStorage)
    function getHistoricoRespondidos() {
        const raw = localStorage.getItem(RESPONDIDOS_AUDIO_KEY);
        return raw ? JSON.parse(raw) : [];
    }

    function salvarHistoricoRespondidos(lista) {
        localStorage.setItem(RESPONDIDOS_AUDIO_KEY, JSON.stringify(lista.slice(-500)));
    }

    // Gera ID único da mensagem com texto + timestamp
    function gerarIdUnico(msgElement) {
        const texto = msgElement.innerText || "";
        const timestamp = msgElement.querySelector("span[data-pre-plain-text]")?.getAttribute("data-pre-plain-text") || "";
        return btoa(texto + timestamp);
    }

    // Função para enviar mensagem via input do WhatsApp
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

    // Detecta se a mensagem contém áudio
    function isAudioMessage(msgDiv) {
        const btns = msgDiv.querySelectorAll('button[aria-label]');
        for (const btn of btns) {
            const label = btn.getAttribute('aria-label').toLowerCase();
            if (label.includes('voz') || label.includes('áudio') || label.includes('audio')) {
                return true;
            }
        }
        const spans = msgDiv.querySelectorAll('span[aria-label]');
        for (const span of spans) {
            const label = span.getAttribute('aria-label').toLowerCase();
            if (label.includes('voz') || label.includes('áudio') || label.includes('audio')) {
                return true;
            }
        }
        return false;
    }

    // Estado interno para controlar envios simultâneos: ID da mensagem -> booleano
    const SESSAO_EM_ANDAMENTO = {};

    // Função principal para checar áudio e responder se necessário
    function verificarUltimaMensagem() {
        const mensagens = Array.from(document.querySelectorAll("div.message-in"));
        if (mensagens.length === 0) return;

        const ultimaMsg = mensagens[mensagens.length - 1];
        if (!isAudioMessage(ultimaMsg)) return;

        const idMsg = gerarIdUnico(ultimaMsg);
        if (!idMsg) return;

        const historico = getHistoricoRespondidos();

        if (historico.includes(idMsg)) {
            // Já respondeu essa mensagem
            return;
        }

        if (SESSAO_EM_ANDAMENTO[idMsg]) {
            // Já está em processo de envio para essa mensagem
            return;
        }

        // Marca que vai enviar para evitar duplicações rápidas
        SESSAO_EM_ANDAMENTO[idMsg] = true;

        // Registra imediatamente para bloquear reenvio
        historico.push(idMsg);
        salvarHistoricoRespondidos(historico);

        console.log(`✅ Áudio novo detectado. Respondendo mensagem com ID: ${idMsg}`);

        enviarMensagem(MENSAGEM_AUDIO, () => {
            // Após enviar, libera o bloqueio após 5 segundos (tempo maior para evitar reenvio)
            setTimeout(() => {
                delete SESSAO_EM_ANDAMENTO[idMsg];
            }, 5000);
        });
    }

    // Intervalo para verificar a cada 2 segundos
    setInterval(verificarUltimaMensagem, 2000);
})();
