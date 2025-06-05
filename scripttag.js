// ==UserScript==
// @name WhatsApp Web - Integração Completa (Tags, Auto Resposta Áudio e PIX)
// @namespace http://tampermonkey.net/
// @version 2.2
// @description Gerencia tags de status de pedidos nas conversas, responde automaticamente a áudios e detecta comprovantes de PIX no WhatsApp Web.
// @author Gemini (com base no original de ChatGPT e usuário)
// @match https://web.whatsapp.com/*
// @grant none
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURAÇÃO GLOBAL ---
    const DEBUG_MODE = true; // Altere para 'false' para desativar os logs de depuração detalhados

    function log(message, type = "info") {
        if (DEBUG_MODE) {
            console.log(`[WhatsAppScript] [${type.toUpperCase()}] ${message}`);
        }
    }

    log('#### SCRIPT COMPLETO WHATSAPP WEB CARREGADO: VERSÃO ' + new Date().toLocaleTimeString('pt-BR') + ' ####');

    // --- Configuração das Tags ---
    const TAGS = {
        "Novo Pedido": "#FFC107",       // Amarelo Mostarda
        "Enviado p/ Cozinha": "#FD7E14",// Laranja Queimado
        "Saiu para Entrega": "#1C7947", // VERDE ESCURO
        "Aguardando buscar": "#6F42C1", // Roxo Suave
        "Dúvida": "#DC3545",            // Vermelho
        "Cancelado": "#6C757D",         // Cinza Escuro
        "Remover Tag": ""               // Para remover a tag existente
    };

    const TAG_BUTTON_CLASS = 'whatsapp-tag-button';
    const TAG_POPUP_CLASS = 'whatsapp-tag-popup';
    const TAG_DISPLAY_CLASS = 'whatsapp-delivery-tag';

    // --- Configuração Auto Resposta Áudio ---
    const MESSAGE_TO_SEND_AUDIO = "Olá! Recebi um áudio seu. No momento, não consigo ouvir áudios. Poderia, por favor, enviar sua mensagem em texto?";
    let lastProcessedAudioMessageId = null; // ID da última mensagem de áudio processada
    let processingAudio = false; // Variável para evitar sobreposição do processamento de áudio

    // --- Configuração Auto Resposta PIX ---
    const CHAVE_PIX = "31996225140"; // SUA CHAVE PIX AQUI
    const MENSAGEM_RESPOSTA_COMPROVANTE = `✅ PIX CONFIRMADO! Muito obrigado(a)!`;

    // Palavras-chave para detectar comprovantes (ignora maiúsculas/minúsculas)
    const PALAVRAS_CHAVE_COMPROVANTE = [
        'comprovante', 'pix', '.pdf', 'sicredi', 'sicoob', 'banco', 'inter',
        'pago', 'pagar', 'transferencia', 'confirmado', 'enviado', 'print',
        'evidencia', 'transação', 'comprovante de pix'
    ];

    // Termos que indicam que NÃO é um comprovante (para evitar falsos positivos)
    const TERMOS_NEGATIVOS = [
        'qual o comprovante', 'me envia o comprovante', 'solicito comprovante',
        'pedir comprovante', 'pedindo comprovante', 'quero comprovante',
        'me passa o comprovante', 'enviar o comprovante'
    ];
    const processedPixMessageIds = new Set(); // Para evitar respostas duplicadas de PIX

    // --- Funções Auxiliares Comuns ---

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Função para aguardar um elemento aparecer no DOM (mais robusta)
    async function waitForElement(selector, timeout = 30000, interval = 500) {
        const startTime = Date.now();
        return new Promise((resolve, reject) => {
            const checkElement = () => {
                const element = document.querySelector(selector);
                if (element) {
                    log(`Elemento "${selector}" encontrado.`);
                    resolve(element);
                } else if (Date.now() - startTime >= timeout) {
                    log(`Elemento "${selector}" NÃO encontrado após ${timeout / 1000} segundos.`, "error");
                    reject(new Error(`Elemento "${selector}" não encontrado.`));
                } else {
                    log(`Aguardando elemento "${selector}"...`, "debug");
                    setTimeout(checkElement, interval);
                }
            };
            checkElement();
        });
    }

    // Função para simular digitação e envio de mensagem
    async function sendMessage(message) {
        log(`Tentando enviar mensagem: "${message}"`);
        try {
            const mainPane = await waitForElement("#main", 10000); 
            let textarea = mainPane.querySelector(`div[contenteditable="true"][role="textbox"]`) ||
                           mainPane.querySelector(`div[contenteditable="true"]`);

            if (!textarea) {
                log("Área de texto da conversa não encontrada.", "error");
                throw new Error("Área de texto da conversa não encontrada.");
            }

            textarea.focus();
            document.execCommand('insertText', false, message);
            textarea.dispatchEvent(new Event('change', { bubbles: true })); 
            await delay(100);

            let sendButton = mainPane.querySelector(`[data-testid="send"]`) ||
                             mainPane.querySelector(`[data-icon="send"]`) ||
                             mainPane.querySelector(`button[aria-label="Send"]`) ||
                             mainPane.querySelector(`button[aria-label="Enviar"]`);

            if (!sendButton) {
                log("Botão de enviar mensagem não encontrado.", "error");
                throw new Error("Botão de enviar mensagem não encontrado.");
            }

            sendButton.click();
            log("Mensagem enviada com sucesso!");
            return true;
        } catch (error) {
            log(`Erro ao enviar mensagem: ${error.message}`, "error");
            return false;
        }
    }

    // --- Funções Auxiliares (Tags) ---
    let savedTags = loadTags();

    function addCss() {
        if (document.getElementById('whatsapp-delivery-tags-style')) {
            return;
        }
        const style = document.createElement('style');
        style.id = 'whatsapp-delivery-tags-style';
        style.textContent = `
            /* Container do nome */
            ._ak8q {
                display: flex !important;
                align-items: center;
                flex-wrap: nowrap;
                min-width: 0;
                position: relative;
                width: 100%;
            }

            /* O span com o nome do contato */
            ._ak8q > span[dir="auto"][title] {
                min-width: 0;
                flex-shrink: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: calc(100% - 90px);
            }

            .${TAG_DISPLAY_CLASS} {
                display: block;
                padding: 4px 8px;
                border-radius: 5px;
                font-size: 12px;
                font-weight: bold;
                color: #FFFFFF;
                white-space: nowrap;
                position: absolute;
                right: 0;
                top: 50%;
                transform: translateY(-50%);
                z-index: 5;
                text-shadow: 0px 0px 2px rgba(0,0,0,0.2);
            }
            .${TAG_DISPLAY_CLASS}[style*="#FFC107"] {
                color: #333;
                text-shadow: none;
            }

            .whatsapp-tag-button {
                background: none;
                border: 1px solid #ccc;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                font-size: 14px;
                line-height: 20px;
                text-align: center;
                cursor: pointer;
                color: #555;
                vertical-align: middle;
                transition: background-color 0.2s;
                position: absolute;
                right: 30px;
                top: 50%;
                transform: translateY(-50%);
                z-index: 10;
                box-sizing: border-box;
            }
            .whatsapp-tag-button:hover {
                background-color: #eee;
            }
            .${TAG_POPUP_CLASS} {
                position: fixed;
                background-color: white;
                border: 1px solid #ddd;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                padding: 5px 0;
                min-width: 120px;
            }
            .${TAG_POPUP_CLASS} button {
                display: block;
                width: 100%;
                padding: 8px 10px;
                text-align: left;
                background: none;
                border: none;
                cursor: pointer;
                font-size: 13px;
                color: #333;
            }
            .${TAG_POPUP_CLASS} button:hover {
                background-color: #f0f0f0;
            }
        `;
        document.head.appendChild(style);
        log("CSS das tags adicionado.");
    }

    function loadTags() {
        try {
            return JSON.parse(localStorage.getItem('whatsappDeliveryTags')) || {};
        } catch (e) {
            log("Erro ao carregar tags do localStorage: " + e.message, "error");
            return {};
        }
    }

    function saveTags(tags) {
        localStorage.setItem('whatsappDeliveryTags', JSON.stringify(tags));
        log("Tags salvas no localStorage.");
    }

    function renderTag(chatElement, contactName, tagText, tagColor) {
        let nameContainer = chatElement.querySelector('._ak8q, [data-testid="chat-tile-header"]'); // Tenta novos seletores
        if (!nameContainer) {
            nameContainer = chatElement.querySelector('span[dir="auto"][title]')?.closest('div');
        }

        if (!nameContainer) {
            log("Elemento container do nome do contato não encontrado para renderizar tag.", "warn");
            return;
        }

        let existingTag = nameContainer.querySelector(`.${TAG_DISPLAY_CLASS}`);
        if (existingTag) {
            existingTag.remove();
        }

        if (tagText) {
            const tagSpan = document.createElement('span');
            tagSpan.className = TAG_DISPLAY_CLASS;
            tagSpan.textContent = tagText;
            tagSpan.style.backgroundColor = tagColor;
            nameContainer.appendChild(tagSpan);
            log(`Tag "${tagText}" renderizada para "${contactName}".`);
        } else {
            log(`Tag removida para "${contactName}".`);
        }
    }

    function createTagButton(chatElement) {
        if (chatElement.querySelector(`.${TAG_BUTTON_CLASS}`)) {
            return;
        }

        const button = document.createElement('button');
        button.className = TAG_BUTTON_CLASS;
        button.textContent = '🏷️';
        button.title = 'Definir Status do Pedido';

        button.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();

            const contactNameElement = chatElement.querySelector('span[dir="auto"][title]');
            if (!contactNameElement || !contactNameElement.title) {
                log("Não foi possível obter o nome do contato para o botão.", "warn");
                return;
            }
            const contactName = contactNameElement.title;

            document.querySelectorAll(`.${TAG_POPUP_CLASS}`).forEach(p => p.remove());

            const popup = document.createElement('div');
            popup.className = TAG_POPUP_CLASS;

            for (const tagText in TAGS) {
                const tagColor = TAGS[tagText];
                const tagOptionButton = document.createElement('button');
                tagOptionButton.textContent = tagText;
                tagOptionButton.style.backgroundColor = tagColor ? tagColor : 'transparent';
                tagOptionButton.style.color = tagText === "Remover Tag" ? '#FF0000' : '#333';
                tagOptionButton.style.fontWeight = tagText === "Remover Tag" ? "bold" : "normal";

                tagOptionButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (tagText === "Remover Tag") {
                        delete savedTags[contactName];
                        renderTag(chatElement, contactName, '', '');
                    } else {
                        savedTags[contactName] = { text: tagText, color: tagColor };
                        renderTag(chatElement, contactName, tagText, tagColor);
                    }
                    saveTags(savedTags);
                    popup.remove();
                });
                popup.appendChild(tagOptionButton);
            }

            const rect = button.getBoundingClientRect();
            popup.style.top = `${rect.top + window.scrollY}px`;
            popup.style.left = `${rect.right + window.scrollX + 5}px`;

            document.body.appendChild(popup);

            const closePopup = (e) => {
                if (!popup.contains(e.target) && e.target !== button) {
                    popup.remove();
                    document.removeEventListener('click', closePopup);
                }
            };
            setTimeout(() => {
                document.addEventListener('click', closePopup);
            }, 100);
        });

        // Tenta encontrar o container da última mensagem ou outro local próximo ao nome.
        // Seletores mais robustos para o local de injeção do botão
        const targetContainer = chatElement.querySelector('div[role="gridcell"] > div > div > div:nth-child(2) > div:nth-child(2), div._ak8j, div[data-testid="last-msg-time-container"]');
        
        if (targetContainer) {
            targetContainer.style.position = 'relative';
            targetContainer.appendChild(button);
            log("Botão de tag injetado no container da conversa.");
        } else {
            // Fallback: Tentar injetar no próprio elemento da conversa
            chatElement.appendChild(button);
            log("Botão de tag injetado diretamente no elemento da conversa (fallback).", "warn");
        }
    }

    function processChatElementForTags(chatElement) {
        if (!chatElement || chatElement.dataset.tagProcessed) {
            return;
        }
        chatElement.dataset.tagProcessed = 'true';

        createTagButton(chatElement);
        const contactNameElement = chatElement.querySelector('span[dir="auto"][title]');
        if (contactNameElement && contactNameElement.title) {
            const contactName = contactNameElement.title;
            const tagInfo = savedTags[contactName];
            if (tagInfo && tagInfo.text) {
                renderTag(chatElement, contactName, tagInfo.text, tagInfo.color);
            }
        }
    }

    // --- Funções Auxiliares (Auto Resposta PIX) ---

    function hasAttachment(msgElement) {
        if (!msgElement) return false;

        const mediaIcons = msgElement.querySelectorAll(
            'img, video, span[data-icon="media-document"], span[data-icon="document"], ' +
            'span[data-icon="clip"], span[data-icon="document-PDF-icon"], ' +
            'div[data-testid*="media-viewer"], div[data-testid*="file-viewer"], ' +
            'div[class*="media-chat-attachment"], div[class*="document-chat-attachment"], ' +
            'div[data-testid="chat-image"], div[data-testid="chat-video"], div[data-testid="chat-document"]' // Novos seletores
        );
        if (mediaIcons.length > 0) {
            log("Anexo detectado por ícone de mídia/documento.");
            return true;
        }

        const documentElements = msgElement.querySelectorAll(
            'div[aria-label*="documento"], div[aria-label*="arquivo"], ' +
            'div[class*="document-thumbnail"], div[class*="downloadable-file-icon"]'
        );
        if (documentElements.length > 0) {
            log("Anexo detectado por elemento de documento.");
            return true;
        }

        const pdfButton = msgElement.querySelector('div[role="button"][title*=".pdf"]');
        if (pdfButton) {
            log("Anexo detectado por botão de PDF.");
            return true;
        }
        log("Nenhum anexo detectado.");
        return false;
    }

    function containsKeywords(text) {
        if (!text) return false;
        const lowerText = text.toLowerCase();

        if (TERMOS_NEGATIVOS.some(term => lowerText.includes(term.toLowerCase()))) {
            log(`Termo negativo "${TERMOS_NEGATIVOS.find(term => lowerText.includes(term.toLowerCase()))}" detectado. Não é comprovante.`);
            return false;
        }

        const foundKeyword = PALAVRAS_CHAVE_COMPROVANTE.find(keyword => lowerText.includes(keyword.toLowerCase()));
        if (foundKeyword) {
            log(`Palavra-chave "${foundKeyword}" detectada.`);
            return true;
        }
        log("Nenhuma palavra-chave de comprovante detectada.");
        return false;
    }

    function containsLink(text) {
        if (!text) return false;
        const hasLink = /(https?:\/\/[^\s]+)/i.test(text);
        if (hasLink) {
            log("Link detectado na mensagem.");
        }
        return hasLink;
    }

    async function processNewMessage(messageElement) {
        const disconnectedIcon = document.querySelector('div[data-testid="disconnected-icon"], [data-icon="disconnected"]'); // Adiciona novo seletor
        if (disconnectedIcon) {
            log("WhatsApp Web desconectado. Não respondendo a mensagens.", "warn");
            return;
        }

        const messageText = messageElement.querySelector('span.selectable-text[dir="ltr"]')?.innerText || '';
        const messageId = messageElement.dataset.id || messageElement.id || messageElement.getAttribute('data-msg-id'); // Tenta mais atributos de ID

        if (messageId && (processedPixMessageIds.has(messageId) || lastProcessedAudioMessageId === messageId)) {
            log(`Mensagem ID "${messageId}" já processada ou em processamento. Ignorando.`);
            return;
        }
        
        log(`Analisando nova mensagem ID "${messageId || 'N/A'}": "${messageText.slice(0, 50)}..."`);

        // Check for audio message first
        const isAudioMessage = messageElement.querySelector('span[data-icon="ptt-play"], [data-testid="audio-playback-label"]'); // Novos seletores
        if (isAudioMessage && !processingAudio) {
            log("Mensagem de áudio detectada. Processando auto-resposta de áudio.");
            processingAudio = true;
            await sendMessage(MESSAGE_TO_SEND_AUDIO);
            lastProcessedAudioMessageId = messageId; // Guarda o ID da mensagem de áudio processada
            processingAudio = false;
            if (messageId) processedPixMessageIds.add(messageId); // Adiciona para evitar re-processamento por PIX
            return; // Já respondemos ao áudio, não precisamos verificar PIX
        } 
        
        // Check for PIX message if not an audio message
        if (hasAttachment(messageElement) || containsKeywords(messageText) || containsLink(messageText)) {
            log("Condições para resposta de PIX atendidas. Preparando para enviar...");
            if (messageId) {
                processedPixMessageIds.add(messageId);
            }
            const sent = await sendMessage(MENSAGEM_RESPOSTA_COMPROVANTE);
            if (sent) {
                log("Resposta de PIX enviada com sucesso.");
            } else {
                log("Falha ao enviar resposta de PIX.", "error");
            }
        } else {
            log("Nenhuma condição para PIX ou áudio atendida para esta mensagem.");
        }
    }

    // --- Observadores Principais ---

    let conversationObserver = null; 
    let chatListObserver = null;

    async function setupConversationObserver() {
        log("Tentando configurar o observador de mensagens...");
        try {
            // Tentando seletores mais específicos e comuns para o painel de mensagens
            const messagesContainer = await waitForElement(
                'div[data-tab="8"][role="application"], ' + // Seletor do layout antigo/específico
                'div[aria-label="Painel de mensagens"], ' + // Seletor mais descritivo
                'div[data-testid="conversation-panel-messages"]', // Outro seletor comum
                30000 
            );

            if (conversationObserver) {
                conversationObserver.disconnect();
                log("Observador de conversa anterior desconectado.");
            }

            conversationObserver = new MutationObserver(async (mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        for (const node of mutation.addedNodes) {
                            // Verifica se o nó adicionado é um elemento de mensagem de entrada (recebida)
                            // A classe 'message-in' ou o data-testid "msg-status-check" são bons indicadores
                            const isIncomingMessage = node.nodeType === 1 && 
                                (node.classList.contains('message-in') || 
                                 node.querySelector('[data-testid="msg-status-check-small"]') || // Para status de mensagem
                                 node.querySelector('[data-testid="msg-dblcheck"]')); // Para status de mensagem (outro estilo)

                            if (isIncomingMessage) {
                                log("Possível nova mensagem recebida detectada, processando...", "debug");
                                await delay(300); // Pequeno delay para garantir que o conteúdo esteja completo
                                processNewMessage(node);
                            }
                        }
                    }
                }
            });

            conversationObserver.observe(messagesContainer, { childList: true, subtree: true });
            log("Observador de conversa (mensagens) configurado e ativo!");

        } catch (error) {
            log(`Falha ao configurar o observador de mensagens: ${error.message}. Tentando novamente em 5s...`, "error");
            setTimeout(setupConversationObserver, 5000); 
        }
    }

    async function initTagObserver() {
        log("Tentando configurar o observador de tags...");
        try {
            // Tenta encontrar a lista de conversas.
            const chatList = await waitForElement(
                'div[data-testid="list-section-main"] div[role="grid"], ' + // Seletor para lista principal
                'div[aria-label="Lista de conversas"][role="grid"], ' + // Outro seletor de lista
                'div[data-testid="chat-list"]', // Mais um seletor comum
                30000 
            );

            if (chatListObserver) {
                chatListObserver.disconnect();
                log("Observador de lista de chats anterior desconectado.");
            }

            log("[Tags] Lista de conversas encontrada. Processando elementos existentes.");
            chatList.querySelectorAll('div[role="listitem"]').forEach(processChatElementForTags);

            chatListObserver = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1 && node.matches('div[role="listitem"]')) {
                                log("Novo item na lista de chats detectado, processando para tags...", "debug");
                                processChatElementForTags(node);
                            }
                        });
                    }
                });
            });

            chatListObserver.observe(chatList, { childList: true, subtree: true });
            log("[Tags] Observador de tags inicializado com sucesso!");

        } catch (error) {
            log(`[Tags] Erro ao configurar o observador de tags: ${error.message}. Tentando novamente em 3s...`, "error");
            setTimeout(initTagObserver, 3000);
        }
    }

    function initializeAllFeatures() {
        addCss(); 
        initTagObserver(); 
        setupConversationObserver(); 
    }

    // --- Início do Script ---
    // Este observador inicial espera que a interface principal do WhatsApp Web esteja carregada.
    const appLoadedObserver = new MutationObserver((mutations, observer) => {
        // Tenta encontrar elementos chave para indicar que o WhatsApp Web está pronto.
        // O chat-list é um bom indicador de que a UI principal foi carregada.
        if (document.querySelector('#app') && (document.querySelector('div[data-testid="chat-list"]') || document.querySelector('div[role="gridcell"]'))) {
            observer.disconnect();
            log("WhatsApp Web principal carregado. Iniciando todas as funcionalidades...");
            initializeAllFeatures();
        } else {
            log("Aguardando carregamento completo do WhatsApp Web para iniciar funcionalidades...", "debug");
        }
    });

    appLoadedObserver.observe(document.body, { childList: true, subtree: true });

})();