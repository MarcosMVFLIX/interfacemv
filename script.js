// ==UserScript==
let stored_pedidoSaiuButton = ``;
let stored_sendGoodNightButton = ``;
let stored_sendDrinksButton = ``;
let stored_sendOrderConfirmedButton = ``;
let stored_sendAddressButton = ``;
// @name WhatsApp Automation: Cardápio, Pedido Saiu, Pagamento, Tempo de Espera, Boa Noite e Reanimar Cliente
// @namespace http://tampermonkey.net/
// @version 3.3
// @description Adiciona botões para enviar Pix, enviar cardápio, configurar o cardápio, informar que o "Pedido Saiu para Entrega", enviar informações de pagamento, botões de tempo de espera customizáveis, "Bebidas", "Pedido Anotado", "Endereço", "Boa Noite" e "Reanimar Cliente" no WhatsApp Web. Inclui botão para ativar/desativar a funcionalidade.
// @author Você
// @match https://web.whatsapp.com/*
// @grant none
// ==/UserScript==

(function() {
    'use strict';

    // ******************************************************
    // SUA CHAVE PIX AQUI (será configurável no modal também)
    // ******************************************************
    const LOCAL_STORAGE_KEY_IMAGES = 'whatsappMenuImages';
    const LOCAL_STORAGE_KEY_MENU_MESSAGE = 'whatsappMenuText';
    const LOCAL_STORAGE_KEY_PIX_KEY = 'whatsappPixKey';
    const LOCAL_STORAGE_KEY_PAYMENT_MESSAGE = 'whatsappPaymentMessage';
    const LOCAL_STORAGE_KEY_WAIT_TIMES = 'whatsappWaitTimes';
    const LOCAL_STORAGE_KEY_SCRIPT_ENABLED = 'whatsappScriptEnabled';
    const LOCAL_STORAGE_KEY_REVIVE_CONTENT = 'whatsappReviveContent';
const LOCAL_STORAGE_KEY_PEDIDOSAIUBUTTON = 'whatsappMsg_pedidoSaiuButton';
const LOCAL_STORAGE_KEY_SENDGOODNIGHTBUTTON = 'whatsappMsg_sendGoodNightButton';
const LOCAL_STORAGE_KEY_SENDDRINKSBUTTON = 'whatsappMsg_sendDrinksButton';
const LOCAL_STORAGE_KEY_SENDORDERCONFIRMEDBUTTON = 'whatsappMsg_sendOrderConfirmedButton';
const LOCAL_STORAGE_KEY_SENDADDRESSBUTTON = 'whatsappMsg_sendAddressButton';
    const MAX_IMAGES = 5;

    let storedImages = [];
    let storedMenuText = '';
    let storedPixKey = '';
    let storedPaymentMessage = '';
    let storedWaitTimes = [];
    let storedReviveContent = [];
    let lastKnownJid = null;
    let scriptEnabled = true;

    // --- Estilos para os Botões e o Modal ---
    const globalStyle = `
        /* Estilos base para todos os botões flutuantes */
        .float-button {
            position: fixed;
            right: 20px;
            z-index: 10000;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 15px;
            font-weight: bold;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            transition: background-color 0.2s ease, transform 0.2s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 170px;
            justify-content: center;
        }
        .float-button:hover {
            transform: translateY(-2px);
        }
        .float-button:active {
            transform: translateY(0);
        }

        /* Cores específicas para cada botão */
        #sendPixButton {
            bottom: 20px;
            background-color: #32cd32;
        }
        #sendPixButton:hover { background-color: #28a745; }

        #sendMenuButton {
            bottom: 80px;
            background-color: #008069;
        }
        #sendMenuButton:hover { background-color: #006b5a; }

        /* Botão de Configuração */
        #configureMenuButton {
            top: 20px;
            left: 140px;
            right: unset;
            bottom: unset;
            background-color: #6a0dad;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            padding: 0;
            min-width: unset;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 24px;
        }
        #configureMenuButton:hover { background-color: #4b0082; }

        /* Botão de Ativar/Desativar */
        #toggleScriptButton {
            top: 20px;
            left: 80px;
            right: unset;
            bottom: unset;
            background-color: #6a0dad;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            padding: 0;
            min-width: unset;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 24px;
        }
        #toggleScriptButton:hover { background-color: #4b0082; }
        #toggleScriptButton.enabled { background-color: #4CAF50; }
        #toggleScriptButton.enabled:hover { background-color: #3e8e41; }
        #toggleScriptButton.disabled { background-color: #f44336; }
        #toggleScriptButton.disabled:hover { background-color: #d32f2f; }

        #pedidoSaiuButton {
            bottom: 140px;
            background-color: #FFC107;
            color: #333;
        }
        #pedidoSaiuButton:hover { background-color: #e0a800; }

        #sendPaymentButton {
            bottom: 200px;
            background-color: #1a73e8;
        }
        #sendPaymentButton:hover { background-color: #0d47a1; }

        #sendGoodNightButton {
            bottom: 260px;
            background-color: #8b0000;
        }
        #sendGoodNightButton:hover { background-color: #5a0000; }

        /* NOVOS BOTÕES DE MENSAGEM */
        #sendDrinksButton {
            bottom: 320px;
            background-color: #A0522D;
        }
        #sendDrinksButton:hover { background-color: #8B4513; }

        #sendOrderConfirmedButton {
            bottom: 380px;
            background-color: #4682B4;
        }
        #sendOrderConfirmedButton:hover { background-color: #3A6691; }

        #sendAddressButton {
            bottom: 440px;
            background-color: #7B68EE;
        }
        #sendAddressButton:hover { background-color: #6A5ACD; }

        /* Estilos para os novos botões de tempo de espera */
        #waitTimesContainer {
            position: fixed;
            bottom: 500px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            max-width: 250px;
            gap: 8px;
            padding-bottom: 10px;
        }

        .wait-time-button {
            background-color: #6c757d;
            color: white;
            border: none;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            font-size: 14px;
            font-weight: bold;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            transition: background-color 0.2s ease, transform 0.2s ease;
            flex-shrink: 0;
        }
        .wait-time-button:hover {
            background-color: #5a6268;
            transform: translateY(-2px);
        }
        .wait-time-button:active {
            transform: translateY(0);
        }

       /* Estilos do Botão Reanimar Cliente - Versão Animada */
.revive-button-container {
    position: fixed;
    top: 17px; /* Distância do topo da tela */
    left: 200px; /* Distância da esquerda da tela */
    /* Remova 'bottom' e 'right' */
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    animation: float 3s ease-in-out infinite;
}

.revive-button-label {
    font-size: 12px;
    font-weight: bold;
    color: #333;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 2px 10px;
    border-radius: 15px;
    white-space: nowrap;
    transform: translateY(0);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.revive-button {
    background: linear-gradient(145deg, #e74c3c, #ff6b5b);
    color: white;
    border: none;
    border-radius: 50%;
    width: 56px;
    height: 56px;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    position: relative;
    overflow: hidden;
}

.revive-button::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.2);
    top: -100%;
    left: 0;
    transition: all 0.3s ease;
    border-radius: 50%;
}

.revive-button:hover {
    background: linear-gradient(145deg, #c0392b, #e74c3c);
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 6px 20px rgba(231, 76, 60, 0.6);
}

.revive-button:hover::after {
    top: 100%;
}

.revive-button:active {
    transform: scale(0.95);
}

.revive-button-container:hover .revive-button-label {
    transform: translateY(-3px);
    background-color: rgba(255, 255, 255, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@keyframes float {
    0%, 100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-5px);
    }
}

/* 🔧 Estilos do Modal de Configuração */
#configModal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #2a3942;
    color: #e9edef;
    border: 1px solid #005c4b;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
    z-index: 100001;
    width: 990px;
    max-width: 95%;
    max-height: 90vh;
    overflow-y: auto;
    font-family: 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    display: none;
    flex-direction: column;
    gap: 1.5rem;
}

@media (max-width: 768px) {
    #configModal {
        width: 95%;
        padding: 1rem;
    }
}

#configModal h3 {
    color: #00a884;
    margin: 0;
    font-size: 1.8rem;
    text-align: center;
    border-bottom: 1px solid #54656f;
    padding-bottom: 0.5rem;
}

/* Campos de entrada */
#configModal label {
    display: block;
    font-weight: bold;
    margin-bottom: 6px;
    font-size: 0.95rem;
}

#configModal textarea,
#configModal input[type="text"] {
    width: 100%;
    padding: 0.75rem;
    margin-bottom: 1rem;
    border: 1px solid #54656f;
    border-radius: 6px;
    background-color: #3b4a54;
    color: #e9edef;
    font-size: 1rem;
    box-sizing: border-box;
}

#configModal textarea {
    resize: vertical;
    min-height: 80px;
    max-height: 200px;
}

/* Upload de arquivos */
#configModal input[type="file"] {
    display: none;
}

.custom-file-upload {
    display: inline-block;
    background-color: #5cb85c;
    color: white;
    padding: 0.6rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95rem;
    margin-top: 5px;
    transition: background-color 0.2s ease;
}
.custom-file-upload:hover {
    background-color: #4cae4c;
}

/* Pré-visualização de imagens */
#imagePreviews,
#reviveImagePreviews {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 10px;
    max-height: 120px;
    overflow-y: auto;
    padding: 0.5rem;
    border: 1px dashed #54656f;
    border-radius: 6px;
}

.image-preview-item {
    position: relative;
    width: 80px;
    height: 80px;
    border: 1px solid #005c4b;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.image-preview-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.remove-image-btn {
    position: absolute;
    top: 0px;
    right: 0px;
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0.8;
    transition: opacity 0.2s ease;
}
.remove-image-btn:hover {
    opacity: 1;
}

        /* Container para os inputs de tempo de espera */
        #waitTimesContainerConfig {
            display: flex;
            flex-direction: column;
            gap: 10px;
            border: 1px dashed #54656f;
            padding: 10px;
            border-radius: 4px;
            max-height: 150px;
            overflow-y: auto;
        }

        .wait-time-input-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .wait-time-input-group input {
            flex-grow: 1;
            margin-bottom: 0;
        }

        .wait-time-input-group .remove-time-btn {
            background-color: #dc3545;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 5px 8px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s ease;
        }
        .wait-time-input-group .remove-time-btn:hover {
            background-color: #c82333;
        }

        #addWaitTimeButton {
            background-color: #007bff;
            color: white;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s ease;
            margin-top: 10px;
            width: fit-content;
        }
        #addWaitTimeButton:hover {
            background-color: #0056b3;
        }

        #configModal .button-group {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 15px;
        }

        #configModal button {
            background-color: #00a884;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 15px;
            font-weight: bold;
            transition: background-color 0.2s ease;
        }

        #configModal button:hover {
            background-color: #008f72;
        }

        #configModal #closeConfigModalBtn {
            background-color: #6c757d;
        }

        #configModal #closeConfigModalBtn:hover {
            background-color: #5a6268;
        }

        #configModal #statusMessage {
            text-align: center;
            margin-top: 10px;
            font-size: 13px;
            color: #8c8c8c;
        }

        #modalBackdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 100000;
            display: none;
        }

        /* 🔄 Abas de Configuração - Reformuladas */
.tab-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
    justify-content: center;
    padding: 0.5rem;
    border-bottom: 2px solid #3b4a54;
    background-color: #1f2c33;
    border-radius: 8px 8px 0 0;
}
/* Layout responsivo para grupos de entrada */
.tab-content .input-group-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
}

.tab-button {
    flex: 1 1 150px;
    max-width: 200px;
    padding: 0.75rem 1rem;
    background-color: #2a3942;
    color: #e9edef;
    font-size: 1rem;
    font-weight: 600;
    text-align: center;
    border: none;
    border-radius: 6px 6px 0 0;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
    border-bottom: 3px solid transparent;
}

.tab-button:hover {
    background-color: #34444e;
    transform: translateY(-2px);
}

.tab-button.active {
    background-color: #1f2c33;
    border-bottom: 3px solid #00a884;
    color: #00e0b5;
}


.tab-content {
    display: none;
    padding: 1.5rem 1rem;
    background-color: #202c33;
    border-radius: 0 0 12px 12px;
    box-shadow: inset 0 1px 0 #3b4a54;
    transition: all 0.3s ease;
}



.tab-content.active {
    display: block;
    animation: fadeIn 0.4s ease;
}


/* Responsividade extra para abas */
@media (max-width: 600px) {
    .tab-button {
        flex: 1 1 100%;
        max-width: none;
    }
}
/* --- Melhorias para a Aba de Mensagens --- */
#mensagensTab h4 {
    color: #00a884; /* Cor do título */
    text-align: center;
    margin-bottom: 10px;
    font-size: 20px;
}

#mensagensTab .description-text {
    text-align: center;
    color: #b0b3b4;
    font-size: 14px;
    margin-bottom: 25px; /* Mais espaço antes dos campos */
}

.message-inputs-grid {
    display: grid;
    /* Por padrão, uma coluna para telas menores, ou se a largura for insuficiente */
    grid-template-columns: 1fr;
    gap: 20px; /* Espaço maior entre os grupos de mensagem */
}

/* Para telas maiores que 600px, tenta 2 colunas */
@media (min-width: 600px) {
    .message-inputs-grid {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* 2 colunas adaptáveis */
        gap: 25px 20px; /* Espaço vertical e horizontal */
    }
}

.input-group-message {
    background-color: #3b4a54; /* Fundo levemente diferente para cada grupo */
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #54656f;
    display: flex;
    flex-direction: column;
    gap: 8px; /* Espaço entre label e textarea */
}

.input-group-message label {
    font-size: 15px;
    color: #e9edef;
    margin-bottom: 0; /* Remove a margin-bottom padrão */
}

.input-group-message textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #54656f;
    border-radius: 6px;
    background-color: #2a3942; /* Fundo mais escuro para o textarea */
    color: #e9edef;
    font-size: 14px;
    resize: vertical;
    min-height: 80px; /* Garante uma altura mínima confortável */
    max-height: 150px;
    box-sizing: border-box; /* Essencial para o padding não 'estourar' a largura */
}

.input-group-message textarea::placeholder {
    color: #8c8c8c;
}
    `;



    // --- HTML dos Botões e do Modal ---
    const buttonsHtml = `
        <button id="configureMenuButton" class="float-button">⚙️</button>
        <button id="toggleScriptButton" class="float-button enabled">🔛</button>
        <div id="waitTimesContainer"></div>
        <div class="revive-button-container">
            <span class="revive-button-label">Reanimar Cliente</span>
            <button id="reviveClientButton" class="revive-button">🚨</button>
        </div>
        <button id="sendAddressButton" class="float-button">🏡 Endereço</button>
        <button id="sendOrderConfirmedButton" class="float-button">📝 Pedido Anotado</button>
        <button id="sendDrinksButton" class="float-button">🥤 Bebidas</button>
        <button id="sendGoodNightButton" class="float-button">👋 Boa Noite</button>
        <button id="sendPaymentButton" class="float-button">💰 Pagamento</button>
        <button id="pedidoSaiuButton" class="float-button">🚀 Pedido Saiu</button>
        <button id="sendMenuButton" class="float-button">📋 Cardápio</button>
        <button id="sendPixButton" class="float-button">🔑 PIX</button>
    `;

    const configModalHtml = `
        <div id="modalBackdrop"></div>
        <div id="configModal">
            <h3>Configurar Mensagens Automáticas</h3>
             <h4>Sistema desenvolvido por Marcos V.R.P (MV ELETRÔNICOS)</h4>

            <div class="tab-container">
                <button class="tab-button" data-tab="mensagens">Mensagens</button>
                <button class="tab-button active" data-tab="menu">Cardápio</button>
                <button class="tab-button" data-tab="pix">PIX/Pagamento</button>
                <button class="tab-button" data-tab="wait">Tempos</button>
                <button class="tab-button" data-tab="revive">Reanimar</button>

            <div id="mensagensTab" class="tab-content active">
    <h4>Configuração de Mensagens Rápidas</h4>
    <p class="description-text">Edite o conteúdo das mensagens que serão enviadas pelos botões rápidos. Personalize cada campo para agilizar sua comunicação!</p>

    <div class="message-inputs-grid">
        <div class="input-group-message">
            <label for="pedidoSaiuButtonInput">Mensagem - Pedido Saiu:</label>
            <textarea id="pedidoSaiuButtonInput" rows="10" placeholder="Ex: Olá! Seu pedido saiu para entrega. Em breve chega aí! 🚀"></textarea>
        </div>

        <div class="input-group-message">
            <label for="sendGoodNightButtonInput">Mensagem - Boa Noite:</label>
            <textarea id="sendGoodNightButtonInput" rows="10" placeholder="Ex: Boa noite! Agradecemos a preferência e até a próxima! 😊"></textarea>
        </div>

        <div class="input-group-message">
            <label for="sendDrinksButtonInput">Mensagem - Bebidas:</label>
            <textarea id="sendDrinksButtonInput" rows="10" placeholder="Ex: Não se esqueça de pedir suas bebidas! Temos água, suco, refri... 🥤"></textarea>
        </div>

        <div class="input-group-message">
            <label for="sendOrderConfirmedButtonInput">Mensagem - Pedido Anotado:</label>
            <textarea id="sendOrderConfirmedButtonInput" rows="4" placeholder="Ex: Pedido anotado! Estamos preparando tudo com carinho. Tempo estimado: 30-40 min. ⏳"></textarea>
        </div>

        <div class="input-group-message">
            <label for="sendAddressButtonInput">Mensagem - Endereço:</label>
            <textarea id="sendAddressButtonInput" rows="4" placeholder="Ex: Poderia confirmar seu endereço completo para entrega, por favor?"></textarea>
        </div>
    </div>
</div>

            </div>

            <div id="menuTab"  class="tab-content">
                <div>
                    <label for="menuMessageInput">Mensagem do Cardápio:</label>
                    <textarea id="menuMessageInput" placeholder="Olá! Confira nosso cardápio de hoje:\n[Item 1] - R$XX,XX\n[Item 2] - R$YY,YY"></textarea>
                </div>

                <div>
                    <label>Imagens do Cardápio (até ${MAX_IMAGES}):</label>
                    <input type="file" id="imageFileInput" accept="image/*" multiple>
                    <label for="imageFileInput" class="custom-file-upload">Adicionar Imagens</label>
                    <div id="imagePreviews"></div>
                    <p style="font-size: 11px; color: #8c8c8c; margin-top: 5px;">
                        * As imagens são salvas no seu navegador.
                    </p>
                </div>
            </div>

            <div id="pixTab" class="tab-content">
                <div>
                    <label for="pixKeyInput">Chave Pix:</label>
                    <input type="text" id="pixKeyInput" placeholder="Ex: 31996215140 (telefone), seuemail@pix.com (email), etc.">
                </div>

                <div>
                    <label for="paymentMessageInput">Mensagem de Pagamento:</label>
                    <textarea id="paymentMessageInput" rows="6" placeholder="Ex:
*Forma de Pagamento*💰
Precisa de troco?
💳 Cartão
💳 Cartão *CABAL*
📲 PIX *31996215140*
Favorecido: REPLAY PIZZARIA
Gentileza encaminhar o comprovante."></textarea>
                    <p style="font-size: 11px; color: #8c8c8c; margin-top: 5px;">
                        * Use emojis e quebras de linha (Enter) para formatar.
                    </p>
                </div>
            </div>

            <div id="waitTab" class="tab-content">
                <div>
                    <label>Configurar Botões de Tempo de Espera (ex: 40m, 1HR, 1h20):</label>
                    <div id="waitTimesContainerConfig"></div>
                    <button id="addWaitTimeButton">Adicionar Tempo</button>
                </div>
            </div>

            <div id="reviveTab" class="tab-content">
                <div>
                    <label for="reviveMessageInput">Mensagem para Reanimar Cliente:</label>
                    <textarea id="reviveMessageInput" placeholder="Olá! 👋 Percebi que você estava interessado em nosso cardápio..."></textarea>
                </div>

                <div>
                    <label>Imagens/Vídeos para Reanimar (até ${MAX_IMAGES}):</label>
                    <input type="file" id="reviveFileInput" accept="image/*,video/*" multiple>
                    <label for="reviveFileInput" class="custom-file-upload">Adicionar Mídias</label>
                    <div id="reviveImagePreviews"></div>
                    <p style="font-size: 11px; color: #8c8c8c; margin-top: 5px;">
                        * As mídias são salvas no seu navegador.
                    </p>
                </div>
            </div>

            <div class="button-group">
                <button id="closeConfigModalBtn">Fechar</button>
            </div>

            <div id="statusMessage"></div>
        </div>
    `;

    // --- Funções Auxiliares ---

    // Função de atraso assíncrono
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Função para aguardar um elemento aparecer no DOM (mais robusta)
    async function waitForElement(selector, timeout = 15000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) return resolve(element);

            const observer = new MutationObserver((mutations, obs) => {
                const foundElement = document.querySelector(selector);
                if (foundElement) { obs.disconnect(); resolve(foundElement); }
            });

            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Elemento "${selector}" não encontrado após ${timeout / 1000} segundos.`));
            }, timeout);
        });
    }

    // FUNÇÃO MELHORADA PARA ENVIAR TEXTO COM QUEBRAS DE LINHA
    async function sendMessageToCurrentChat(message) {
        try {
            const mainPane = await waitForElement("#main", 10000);
            let textarea = document.querySelector('div[contenteditable="true"][data-tab="10"]');
if (!textarea) {
    textarea = document.querySelector('div[contenteditable="true"].selectable-text');
}
if (!textarea) {
    throw new Error("Caixa de mensagem não encontrada. Abra uma conversa.");
}


            if (!textarea) throw new Error("Área de texto da conversa não encontrada. Abra uma conversa.");

            textarea.focus();

            const lines = message.split('\n');

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Simula a digitação da linha
                document.execCommand('insertText', false, line);
                textarea.dispatchEvent(new Event('change', { bubbles: true })); // Dispara evento de mudança
                await delay(50); // Pequeno atraso para simular digitação

                if (i < lines.length - 1) { // Se não for a última linha, insere uma quebra de linha (Shift + Enter)
                    textarea.dispatchEvent(new KeyboardEvent('keydown', {
                        key: 'Enter',
                        keyCode: 13,
                        shiftKey: true,
                        bubbles: true
                    }));
                    textarea.dispatchEvent(new KeyboardEvent('keyup', {
                        key: 'Enter',
                        keyCode: 13,
                        shiftKey: true,
                        bubbles: true
                    }));
                    await delay(100); // Atraso após a quebra de linha
                }
            }

            // Agora, simula o Enter para enviar a mensagem completa
            textarea.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter',
                keyCode: 13,
                bubbles: true
            }));
            textarea.dispatchEvent(new KeyboardEvent('keyup', {
                key: 'Enter',
                keyCode: 13,
                bubbles: true
            }));

            await delay(500); // Aguarda o envio
            return true;
        } catch (error) {
            console.error("Falha ao enviar texto com quebra de linha:", error);
            throw error;
        }
    }

    // Função: Cola a imagem Base64 NO CAMPO DE ANEXO E CLICA PARA ENVIAR
    async function pasteAndSendImageBase64(base64Image) {
        try {
            const mainPane = await waitForElement("#main", 50000);
            let textarea = document.querySelector('div[contenteditable="true"][data-tab="10"]');
if (!textarea) {
    textarea = document.querySelector('div[contenteditable="true"].selectable-text');
}
if (!textarea) {
    throw new Error("Caixa de mensagem não encontrada. Abra uma conversa.");
}


            if (!textarea) throw new Error("Área de texto da conversa não encontrada.");

            const byteString = atob(base64Image.split(',')[1]);
            const mimeString = base64Image.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });

            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(new File([blob], "image.png", { type: mimeString }));

            textarea.focus();
            textarea.dispatchEvent(new ClipboardEvent('paste', {
                clipboardData: dataTransfer,
                bubbles: true
            }));

            await delay(1500);

            const imageSendButton = await waitForElement(
                `div[aria-disabled="false"][role="button"][aria-label="Enviar"],` +
                `[data-testid="send-image"]`,
                5000
            );
            if (imageSendButton) {
                imageSendButton.click();
                console.log("Imagem enviada automaticamente.");
                await delay(1000);
                return true;
            } else {
                throw new Error("Botão de enviar imagem não encontrado após colar.");
            }

        } catch (error) {
            console.error("Falha ao colar e enviar imagem Base64:", error);
            throw error;
        }
    }

    // Função para obter o JID da conversa atual
    async function getCurrentChatJidFromMainPane() {
        try {
            // Tenta obter o JID do cabeçalho da conversa (método padrão)
            const chatHeader = await waitForElement('header[data-testid="conversation-header"]', 3000);
            const chatHeaderTitle = chatHeader.querySelector('[data-testid="conversation-title"]');
            if (chatHeaderTitle && chatHeaderTitle.dataset.id) {
                console.log("JID obtido do cabeçalho (data-id):", chatHeaderTitle.dataset.id);
                return chatHeaderTitle.dataset.id;
            }
            // Se o data-id no título não funcionar, tenta o data-testid="chat-pane"
            const chatPane = document.querySelector('[data-testid="chat-pane"]');
            if (chatPane && chatPane.dataset.id) {
                console.log("JID obtido do chat-pane (data-id):", chatPane.dataset.id);
                return chatPane.dataset.id;
            }

            // Fallback: Tenta obter o JID da URL (funciona para conversas 1-1)
            const urlMatch = window.location.href.match(/chat\/(\d{10,20}@c\.us|\d{10,20}@g\.us)/);
            if (urlMatch && urlMatch[1]) {
                console.log("JID obtido da URL:", urlMatch[1]);
                return urlMatch[1];
            }

            // Fallback: Tenta obter o JID da última mensagem enviada por VOCÊ
            const messagesContainer = await waitForElement('[data-testid="conversation-panel-messages"]', 3000);
            const myMessages = messagesContainer.querySelectorAll('.message-out[data-id]');
            if (myMessages.length > 0) {
                const lastMyMessage = myMessages[myMessages.length - 1];
                const fullJid = lastMyMessage.dataset.id;
                // Exemplo de fullJid: "true_120363048446057080@g.us_3EB0659D8FC5B884215046_553196707795@c.us"
                // Uma heurística mais segura é pegar a que contém '@c.us' ou '@g.us'
                const parts = fullJid.split('_');
                const extractedJid = parts.find(part => part.includes('@c.us') || part.includes('@g.us'));
                if (extractedJid) {
                    console.log("JID obtido da última mensagem enviada:", extractedJid);
                    return extractedJid;
                }
            }

            throw new Error("Não foi possível identificar o JID da conversa atual.");
        } catch (error) {
            console.error("Erro ao tentar obter JID da conversa:", error);
            // lastKnownJid = null; // Limpa o JID se não conseguir identificar
            throw error;
        }
    }

    // --- Funções de Gerenciamento de Dados Locais ---

    function loadSavedData() {
stored_pedidoSaiuButton = localStorage.getItem(LOCAL_STORAGE_KEY_PEDIDOSAIUBUTTON) || `Olá! 👋 Seu pedido acabou de sair para entrega! 🏍️💨 Chegará em breve! 😊`;
stored_sendGoodNightButton = localStorage.getItem(LOCAL_STORAGE_KEY_SENDGOODNIGHTBUTTON) || `👋 Olá, boa noite, tudo bem?
🚀 *Para agilizar seu pedido*
- Nom*:
- Endereço com referência:
- Sabor e tamanho:
- Bebida?:
- Forma de pagamento: (Pix, Cartão *ou* _precisa de troco para quantos?_)
🚨 *Muito importante você me repassar tudo de uma só vez, isso agiliza seu pedido ainda mais*`;
stored_sendDrinksButton = localStorage.getItem(LOCAL_STORAGE_KEY_SENDDRINKSBUTTON) || `*Deseja alguma bebida?*🥤
🥤Coca Cola 2L: 15,00
🥤Coca Cola *ZERO* 2L: 15,00
🥤Guaraná, Fanta 2L, Guarapan, Sprite: 13,00
🥤Guaraná 1L: 9,00
🥤Coca Cola, Fanta 600ml: 7,00
🥤Lata Coca, Fanta, Guaraná, Kuat, Sprite 350ml: 6,00
🧃 Suco 1L Tial% Uva e Abacaxi: 12,00
🍺 Brahma, Skol latão: 7,00
🍻 Brahma, Skol 600ml: 10,00
🍻 Original 600ml: 12,00
🍻 Stella, Spaten 600ml: 15,00
🍻 Heineken 600ml: 17,00
🥃 Skol Beats Sense ou GT 269ml: 10,00
🫧 Água s/ gás: 2,50
🫧 Água c/ gás: 3,50`;
stored_sendOrderConfirmedButton = localStorage.getItem(LOCAL_STORAGE_KEY_SENDORDERCONFIRMEDBUTTON) || `🙏Agradecemos a preferência, já anotei seu pedido 📝⏰Seu tempo de espera, será contado a partir deste momento. 🏍️ Te avisaremos quando seu pedido sair.`;
stored_sendAddressButton = localStorage.getItem(LOCAL_STORAGE_KEY_SENDADDRESSBUTTON) || `🏡 Me informe seu endereço com referência para facilitar sua entrega 🚀`;
        const savedImagesJson = localStorage.getItem(LOCAL_STORAGE_KEY_IMAGES);
        if (savedImagesJson) {
            storedImages = JSON.parse(savedImagesJson);
        } else {
            storedImages = [];
        }

        storedMenuText = localStorage.getItem(LOCAL_STORAGE_KEY_MENU_MESSAGE) || '';
        storedPixKey = localStorage.getItem(LOCAL_STORAGE_KEY_PIX_KEY) || '';
        storedPaymentMessage = localStorage.getItem(LOCAL_STORAGE_KEY_PAYMENT_MESSAGE) || '';

        const savedWaitTimesJson = localStorage.getItem(LOCAL_STORAGE_KEY_WAIT_TIMES);
        if (savedWaitTimesJson) {
            storedWaitTimes = JSON.parse(savedWaitTimesJson);
        } else {
            storedWaitTimes = [];
        }

        const savedReviveContentJson = localStorage.getItem(LOCAL_STORAGE_KEY_REVIVE_CONTENT);
        if (savedReviveContentJson) {
            storedReviveContent = JSON.parse(savedReviveContentJson);
        } else {
            storedReviveContent = [];
        }

        // Carrega o estado do script (ativado/desativado)
        const savedScriptState = localStorage.getItem(LOCAL_STORAGE_KEY_SCRIPT_ENABLED);
        scriptEnabled = savedScriptState === null ? true : savedScriptState === 'true';
    }

    function saveImages() {
        localStorage.setItem(LOCAL_STORAGE_KEY_IMAGES, JSON.stringify(storedImages));
    }

    function saveMenuText(text) {
        localStorage.setItem(LOCAL_STORAGE_KEY_MENU_MESSAGE, text);
    }

    function savePixKey(key) {
        localStorage.setItem(LOCAL_STORAGE_KEY_PIX_KEY, key);
    }

    function savePaymentMessage(message) {
        localStorage.setItem(LOCAL_STORAGE_KEY_PAYMENT_MESSAGE, message);
    }

    function saveWaitTimes() {
        localStorage.setItem(LOCAL_STORAGE_KEY_WAIT_TIMES, JSON.stringify(storedWaitTimes));
    }

    function saveReviveContent(content) {
        localStorage.setItem(LOCAL_STORAGE_KEY_REVIVE_CONTENT, JSON.stringify(content));
    }

    function saveScriptState(enabled) {
        localStorage.setItem(LOCAL_STORAGE_KEY_SCRIPT_ENABLED, enabled.toString());
    }

    function save_pedidoSaiuButton(text) {
    localStorage.setItem(LOCAL_STORAGE_KEY_PEDIDOSAIUBUTTON, text);
}
function save_sendGoodNightButton(text) {
    localStorage.setItem(LOCAL_STORAGE_KEY_SENDGOODNIGHTBUTTON, text);
}
function save_sendDrinksButton(text) {
    localStorage.setItem(LOCAL_STORAGE_KEY_SENDDRINKSBUTTON, text);
}
function save_sendOrderConfirmedButton(text) {
    localStorage.setItem(LOCAL_STORAGE_KEY_SENDORDERCONFIRMEDBUTTON, text);
}
function save_sendAddressButton(text) {
    localStorage.setItem(LOCAL_STORAGE_KEY_SENDADDRESSBUTTON, text);
}

// --- Funções para Ativar/Desativar o Script ---

    function toggleScript() {
        scriptEnabled = !scriptEnabled;
        saveScriptState(scriptEnabled);
        updateUIState();
    }

    function updateUIState() {
        const toggleButton = document.getElementById('toggleScriptButton');
        if (!toggleButton) return;

        // Atualiza o botão de toggle
        toggleButton.className = scriptEnabled ? 'float-button enabled' : 'float-button disabled';
        toggleButton.textContent = scriptEnabled ? '⏱️' : '❌';

        // Mostra ou esconde todos os botões exceto configuração e toggle
        const buttonsToToggle = [
            'sendPixButton', 'sendMenuButton', 'pedidoSaiuButton', 'sendPaymentButton',
            'sendGoodNightButton', 'sendDrinksButton', 'sendOrderConfirmedButton',
            'sendAddressButton', 'waitTimesContainer', 'reviveClientButton'
        ];

        buttonsToToggle.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (id === 'reviveClientButton') {
                    element.parentElement.style.display = scriptEnabled ? '' : 'none';
                } else {
                    element.style.display = scriptEnabled ? '' : 'none';
                }
            }
        });
    }

    // --- Funções de Renderização de UI (Modal) ---

    function renderImagePreviews() {
        const imagePreviewsDiv = document.getElementById('imagePreviews');
        if (!imagePreviewsDiv) return;

        imagePreviewsDiv.innerHTML = '';

        if (storedImages.length === 0) {
            imagePreviewsDiv.textContent = 'Nenhuma imagem selecionada.';
            imagePreviewsDiv.style.color = '#8c8c8c';
            return;
        }
        imagePreviewsDiv.style.color = '';

        storedImages.forEach((base64Image, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'image-preview-item';

            const img = document.createElement('img');
            img.src = base64Image;
            img.alt = `Imagem ${index + 1}`;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-image-btn';
            removeBtn.textContent = 'X';
            removeBtn.title = 'Remover imagem';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                storedImages.splice(index, 1);
                saveImages();
                renderImagePreviews();
            };

            itemDiv.appendChild(img);
            itemDiv.appendChild(removeBtn);
            imagePreviewsDiv.appendChild(itemDiv);
        });
    }

    function renderReviveImagePreviews() {
        const reviveImagePreviewsDiv = document.getElementById('reviveImagePreviews');
        if (!reviveImagePreviewsDiv) return;

        reviveImagePreviewsDiv.innerHTML = '';

        if (storedReviveContent.length === 0) {
            reviveImagePreviewsDiv.textContent = 'Nenhuma mídia selecionada.';
            reviveImagePreviewsDiv.style.color = '#8c8c8c';
            return;
        }
        reviveImagePreviewsDiv.style.color = '';

        storedReviveContent.forEach((item, index) => {
            if (item.type === 'image') {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'image-preview-item';

                const img = document.createElement('img');
                img.src = item.data;
                img.alt = `Imagem ${index + 1}`;

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-image-btn';
                removeBtn.textContent = 'X';
                removeBtn.title = 'Remover mídia';
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    storedReviveContent.splice(index, 1);
                    saveReviveContent(storedReviveContent);
                    renderReviveImagePreviews();
                };

                itemDiv.appendChild(img);
                itemDiv.appendChild(removeBtn);
                reviveImagePreviewsDiv.appendChild(itemDiv);
            } else if (item.type === 'video') {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'image-preview-item';
                itemDiv.style.position = 'relative';

                const video = document.createElement('video');
                video.src = item.data;
                video.alt = `Vídeo ${index + 1}`;
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.objectFit = 'cover';
                video.muted = true;
                video.loop = true;
                video.autoplay = true;

                const videoType = document.createElement('div');
                videoType.style.position = 'absolute';
                videoType.style.top = '5px';
                videoType.style.left = '5px';
                videoType.style.backgroundColor = 'rgba(0,0,0,0.5)';
                videoType.style.color = 'white';
                videoType.style.padding = '2px 5px';
                videoType.style.borderRadius = '3px';
                videoType.style.fontSize = '10px';
                videoType.textContent = 'VÍDEO';

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-image-btn';
                removeBtn.textContent = 'X';
                removeBtn.title = 'Remover mídia';
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    storedReviveContent.splice(index, 1);
                    saveReviveContent(storedReviveContent);
                    renderReviveImagePreviews();
                };

                itemDiv.appendChild(video);
                itemDiv.appendChild(videoType);
                itemDiv.appendChild(removeBtn);
                reviveImagePreviewsDiv.appendChild(itemDiv);
            }
        });
    }

    function renderWaitTimesConfig() {
        const waitTimesContainerConfig = document.getElementById('waitTimesContainerConfig');
        if (!waitTimesContainerConfig) return;

        waitTimesContainerConfig.innerHTML = '';

        if (storedWaitTimes.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'Nenhum tempo de espera configurado.';
            p.style.color = '#8c8c8c';
            waitTimesContainerConfig.appendChild(p);
        }

        storedWaitTimes.forEach((time, index) => {
            const div = document.createElement('div');
            div.className = 'wait-time-input-group';

            const input = document.createElement('input');
            input.type = 'text';
            input.value = time;
            input.placeholder = 'Ex: 40m, 1HR, 1h20';
            input.oninput = (e) => {
                storedWaitTimes[index] = e.target.value;
                saveWaitTimes();
                renderWaitTimeButtons(); // Atualiza os botões na tela principal
            };

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-time-btn';
            removeBtn.textContent = 'Remover';
            removeBtn.onclick = () => {
                storedWaitTimes.splice(index, 1);
                saveWaitTimes();
                renderWaitTimesConfig(); // Re-renderiza a lista de inputs
                renderWaitTimeButtons(); // Atualiza os botões na tela principal
            };

            div.appendChild(input);
            div.appendChild(removeBtn);
            waitTimesContainerConfig.appendChild(div);
        });
    }

    function renderWaitTimeButtons() {
        const waitTimesContainer = document.getElementById('waitTimesContainer');
        if (!waitTimesContainer) return;

        waitTimesContainer.innerHTML = '';

        // Garante que os dados estejam carregados antes de renderizar
        loadSavedData();

        storedWaitTimes.forEach(time => {
            const button = document.createElement('button');
            button.className = 'wait-time-button';
            button.textContent = time;
            button.title = `Clique para enviar tempo de espera: ${time}`;
            button.onclick = async () => {
                const message = `Olá! 👋 O tempo de espera estimado para o seu pedido é de aproximadamente *${time}*. Agradecemos a sua paciência! 😊`;
                try {
                    await sendMessageToCurrentChat(message);
                    console.log(`Mensagem de tempo de espera (${time}) enviada.`);
                } catch (error) {
                    alert(`Erro ao enviar mensagem de tempo de espera (${time}): ` + error.message);
                }
            };
            waitTimesContainer.appendChild(button);
        });

        // Atualiza a visibilidade de acordo com o estado do script
        waitTimesContainer.style.display = scriptEnabled ? '' : 'none';
    }

    // --- Injeção de Estilos e HTML ---

    function injectStyles() {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(globalStyle));
        document.head.appendChild(style);
    }

    function injectButtons() {
        const app = document.querySelector('#app');
        if (app && !document.getElementById('sendPixButton')) { // Verifica se os botões já foram injetados
            const div = document.createElement('div');
            div.innerHTML = buttonsHtml;
            app.appendChild(div);
        }
    }

    function injectModal() {
        if (!document.getElementById('configModal')) { // Verifica se o modal já foi injetado
            const div = document.createElement('div');
            div.innerHTML = configModalHtml;
            document.body.appendChild(div);
        }
    }

    // --- Configuração do Modal ---

    function setupConfigModal() {
        const modal = document.getElementById('configModal');
        const backdrop = document.getElementById('modalBackdrop');
        const closeBtn = document.getElementById('closeConfigModalBtn');
        const menuMessageInput = document.getElementById('menuMessageInput');
        const imageFileInput = document.getElementById('imageFileInput');
        const pixKeyInput = document.getElementById('pixKeyInput');
        const paymentMessageInput = document.getElementById('paymentMessageInput');
        const reviveMessageInput = document.getElementById('reviveMessageInput');
        const reviveFileInput = document.getElementById('reviveFileInput');
        const addWaitTimeButton = document.getElementById('addWaitTimeButton');
        const statusMessageDiv = document.getElementById('statusMessage');

        // Configura as abas
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');

                // Remove a classe active de todos os botões e conteúdos
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Adiciona a classe active ao botão e conteúdo clicado
                button.classList.add('active');
                document.getElementById(`${tabId}Tab`).classList.add('active');
            });
        });

        // Carregar dados salvos ao abrir o modal
        loadSavedData();
        menuMessageInput.value = storedMenuText;
        pixKeyInput.value = storedPixKey;
        paymentMessageInput.value = storedPaymentMessage;
        reviveMessageInput.value = storedReviveContent.find(item => item.type === 'text')?.data || '';
        renderImagePreviews();
        renderReviveImagePreviews();
        renderWaitTimesConfig();

        document.getElementById('configureMenuButton').onclick = () => {
            modal.style.display = 'flex';
            backdrop.style.display = 'block';
            // Recarrega os dados ao abrir para garantir que estejam atualizados
            loadSavedData();
            menuMessageInput.value = storedMenuText;
            pixKeyInput.value = storedPixKey;
            paymentMessageInput.value = storedPaymentMessage;
            reviveMessageInput.value = storedReviveContent.find(item => item.type === 'text')?.data || '';
            renderImagePreviews();
            renderReviveImagePreviews();
            renderWaitTimesConfig();
            statusMessageDiv.textContent = ''; // Limpa qualquer mensagem de status anterior
        };


        const pedidoSaiuButtonInput = document.getElementById('pedidoSaiuButtonInput');
        pedidoSaiuButtonInput.value = stored_pedidoSaiuButton;
        pedidoSaiuButtonInput.oninput = () => {
            save_pedidoSaiuButton(pedidoSaiuButtonInput.value);
            stored_pedidoSaiuButton = pedidoSaiuButtonInput.value;
            statusMessageDiv.textContent = 'Mensagem de pedidoSaiuButton salva.';
            clearStatusMessage();
        };


        const sendGoodNightButtonInput = document.getElementById('sendGoodNightButtonInput');
        sendGoodNightButtonInput.value = stored_sendGoodNightButton;
        sendGoodNightButtonInput.oninput = () => {
            save_sendGoodNightButton(sendGoodNightButtonInput.value);
            stored_sendGoodNightButton = sendGoodNightButtonInput.value;
            statusMessageDiv.textContent = 'Mensagem de sendGoodNightButton salva.';
            clearStatusMessage();
        };


        const sendDrinksButtonInput = document.getElementById('sendDrinksButtonInput');
        sendDrinksButtonInput.value = stored_sendDrinksButton;
        sendDrinksButtonInput.oninput = () => {
            save_sendDrinksButton(sendDrinksButtonInput.value);
            stored_sendDrinksButton = sendDrinksButtonInput.value;
            statusMessageDiv.textContent = 'Mensagem de sendDrinksButton salva.';
            clearStatusMessage();
        };


        const sendOrderConfirmedButtonInput = document.getElementById('sendOrderConfirmedButtonInput');
        sendOrderConfirmedButtonInput.value = stored_sendOrderConfirmedButton;
        sendOrderConfirmedButtonInput.oninput = () => {
            save_sendOrderConfirmedButton(sendOrderConfirmedButtonInput.value);
            stored_sendOrderConfirmedButton = sendOrderConfirmedButtonInput.value;
            statusMessageDiv.textContent = 'Mensagem de sendOrderConfirmedButton salva.';
            clearStatusMessage();
        };


        const sendAddressButtonInput = document.getElementById('sendAddressButtonInput');
        sendAddressButtonInput.value = stored_sendAddressButton;
        sendAddressButtonInput.oninput = () => {
            save_sendAddressButton(sendAddressButtonInput.value);
            stored_sendAddressButton = sendAddressButtonInput.value;
            statusMessageDiv.textContent = 'Mensagem de sendAddressButton salva.';
            clearStatusMessage();
        };

        closeBtn.onclick = () => {
            modal.style.display = 'none';
            backdrop.style.display = 'none';
            saveSettings(); // Salva as configurações ao fechar
        };

        backdrop.onclick = () => { // Fechar modal ao clicar no backdrop
            modal.style.display = 'none';
            backdrop.style.display = 'none';
            saveSettings(); // Salva as configurações ao fechar
        };

        // Salvar automaticamente ao digitar/alterar
        menuMessageInput.oninput = () => {
            saveMenuText(menuMessageInput.value);
            statusMessageDiv.textContent = 'Mensagem do cardápio salva automaticamente.';
            clearStatusMessage();
        };
        pixKeyInput.oninput = () => {
            savePixKey(pixKeyInput.value);
            statusMessageDiv.textContent = 'Chave Pix salva automaticamente.';
            clearStatusMessage();
        };
        paymentMessageInput.oninput = () => {
            savePaymentMessage(paymentMessageInput.value);
            statusMessageDiv.textContent = 'Mensagem de pagamento salva automaticamente.';
            clearStatusMessage();
        };
        reviveMessageInput.oninput = () => {
            // Encontra ou cria o item de texto no array de conteúdo de reanimação
            const textItemIndex = storedReviveContent.findIndex(item => item.type === 'text');
            if (textItemIndex >= 0) {
                storedReviveContent[textItemIndex].data = reviveMessageInput.value;
            } else {
                storedReviveContent.push({ type: 'text', data: reviveMessageInput.value });
            }
            saveReviveContent(storedReviveContent);
            statusMessageDiv.textContent = 'Mensagem de reanimação salva automaticamente.';
            clearStatusMessage();
        };

        imageFileInput.onchange = (event) => {
            const files = event.target.files;
            if (files.length + storedImages.length > MAX_IMAGES) {
                alert(`Você pode adicionar no máximo ${MAX_IMAGES} imagens.`);
                return;
            }

            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    storedImages.push(e.target.result);
                    saveImages();
                    renderImagePreviews();
                    statusMessageDiv.textContent = 'Imagens adicionadas e salvas.';
                    clearStatusMessage();
                };
                reader.readAsDataURL(file);
            });
            imageFileInput.value = ''; // Limpa o input para permitir selecionar os mesmos arquivos novamente
        };

        reviveFileInput.onchange = (event) => {
            const files = event.target.files;
            if (files.length + storedReviveContent.filter(item => item.type !== 'text').length > MAX_IMAGES) {
                alert(`Você pode adicionar no máximo ${MAX_IMAGES} mídias.`);
                return;
            }

            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const type = file.type.startsWith('video/') ? 'video' : 'image';
                    storedReviveContent.push({ type, data: e.target.result });
                    saveReviveContent(storedReviveContent);
                    renderReviveImagePreviews();
                    statusMessageDiv.textContent = 'Mídia adicionada e salva.';
                    clearStatusMessage();
                };
                if (file.type.startsWith('video/')) {
                    reader.readAsDataURL(file);
                } else {
                    reader.readAsDataURL(file);
                }
            });
            reviveFileInput.value = ''; // Limpa o input para permitir selecionar os mesmos arquivos novamente
        };

        addWaitTimeButton.onclick = () => {
            storedWaitTimes.push(''); // Adiciona um campo vazio
            saveWaitTimes();
            renderWaitTimesConfig();
            statusMessageDiv.textContent = 'Novo campo de tempo de espera adicionado.';
            clearStatusMessage();
        };

        function saveSettings() {
            saveMenuText(menuMessageInput.value);
            savePixKey(pixKeyInput.value);
            savePaymentMessage(paymentMessageInput.value);

            // Salva a mensagem de reanimação se existir
            if (reviveMessageInput.value) {
                const textItemIndex = storedReviveContent.findIndex(item => item.type === 'text');
                if (textItemIndex >= 0) {
                    storedReviveContent[textItemIndex].data = reviveMessageInput.value;
                } else {
                    storedReviveContent.push({ type: 'text', data: reviveMessageInput.value });
                }
                saveReviveContent(storedReviveContent);
            }

            saveImages(); // Garante que as imagens sejam salvas (já é feito ao adicionar/remover)
            saveWaitTimes(); // Garante que os tempos sejam salvos (já é feito ao digitar/remover)
            renderWaitTimeButtons(); // Atualiza os botões na tela principal após salvar
            statusMessageDiv.textContent = 'Configurações salvas!';
            clearStatusMessage();
        }

        let statusTimeout;
        function clearStatusMessage() {
            if (statusTimeout) clearTimeout(statusTimeout);
            statusTimeout = setTimeout(() => {
                statusMessageDiv.textContent = '';
            }, 3000); // Mensagem some após 3 segundos
        }
    }

    // --- Event Listeners para os Botões Principais ---

    async function setupButtonListeners() {
        const sendPixButton = document.getElementById('sendPixButton');
        const sendMenuButton = document.getElementById('sendMenuButton');
        const pedidoSaiuButton = document.getElementById('pedidoSaiuButton');
        const sendPaymentButton = document.getElementById('sendPaymentButton');
        const sendGoodNightButton = document.getElementById('sendGoodNightButton');
        const sendDrinksButton = document.getElementById('sendDrinksButton');
        const sendOrderConfirmedButton = document.getElementById('sendOrderConfirmedButton');
        const sendAddressButton = document.getElementById('sendAddressButton');
        const toggleScriptButton = document.getElementById('toggleScriptButton');
        const reviveClientButton = document.getElementById('reviveClientButton');

        // Configura o botão de toggle
        if (toggleScriptButton) {
    toggleScriptButton.onclick = () => {
        const modal = document.getElementById('timeConfigModal');
        modal.style.display = 'block';
    };
        }

        // Carregar dados salvos uma vez ao iniciar
        loadSavedData();
        renderWaitTimeButtons(); // Renderiza os botões de tempo de espera logo no início
        updateUIState(); // Atualiza a UI de acordo com o estado salvo

        if (reviveClientButton) {
            reviveClientButton.onclick = async () => {
                if (!scriptEnabled) return;
                try {
                    loadSavedData(); // Recarrega o conteúdo de reanimação mais recente

                    // Verifica se há conteúdo configurado
                    if (storedReviveContent.length === 0) {
                        alert('Por favor, configure o conteúdo para reanimar clientes no menu de configurações (aba "Reanimar").');
                        return;
                    }

                    // Envia primeiro a mensagem de texto, se existir
                    const textItem = storedReviveContent.find(item => item.type === 'text');
                    if (textItem && textItem.data) {
                        await sendMessageToCurrentChat(textItem.data);
                        console.log("Mensagem de reanimação enviada.");
                        await delay(500); // Pequeno delay antes de enviar mídias
                    }

                    // Envia as mídias (imagens/vídeos)
                    const mediaItems = storedReviveContent.filter(item => item.type !== 'text');
                    for (const item of mediaItems) {
                        if (item.type === 'image') {
                            await pasteAndSendImageBase64(item.data);
                        } else if (item.type === 'video') {
                            // WhatsApp Web não suporta envio de vídeos via clipboard, então envia como mensagem
                            await sendMessageToCurrentChat("Confira este vídeo: " + item.data);
                        }
                        await delay(500); // Pequeno delay entre o envio de múltiplas mídias
                    }

                    console.log(`${mediaItems.length} mídias de reanimação enviadas.`);
                } catch (error) {
                    alert('Erro ao enviar conteúdo para reanimar cliente: ' + error.message);
                }
            };
        }

        if (sendPixButton) {
            sendPixButton.onclick = async () => {
                if (!scriptEnabled) return;
                try {
                    loadSavedData(); // Recarrega a chave Pix mais recente
                    if (!storedPixKey) {
                        alert('Por favor, configure sua chave Pix no menu de configurações (botão ⚙️ no canto superior esquerdo).');
                        return;
                    }
                    const pixMessage = `*CHAVE PIX:*\n${storedPixKey}\n\nGentileza encaminhar o comprovante.`;
                    await sendMessageToCurrentChat(pixMessage);
                    console.log("Mensagem Pix enviada.");
                } catch (error) {
                    alert('Erro ao enviar mensagem Pix: ' + error.message);
                }
            };
        }

        if (sendMenuButton) {
            sendMenuButton.onclick = async () => {
                if (!scriptEnabled) return;
                try {
                    loadSavedData(); // Recarrega o texto e imagens mais recentes
                    if (!storedMenuText && storedImages.length === 0) {
                        alert('Por favor, configure o texto e/ou adicione imagens do cardápio no menu de configurações (botão ⚙️ no canto superior esquerdo).');
                        return;
                    }

                    if (storedMenuText) {
                        await sendMessageToCurrentChat(storedMenuText);
                        console.log("Mensagem do cardápio enviada.");
                    }

                    if (storedImages.length > 0) {
                        for (const imgBase64 of storedImages) {
                            await pasteAndSendImageBase64(imgBase64);
                            await delay(500); // Pequeno delay entre o envio de múltiplas imagens
                        }
                        console.log(`${storedImages.length} imagens do cardápio enviadas.`);
                    }
                } catch (error) {
                    alert('Erro ao enviar cardápio: ' + error.message);
                }
            };
        }

        if (pedidoSaiuButton) {
            pedidoSaiuButton.onclick = async () => {
                if (!scriptEnabled) return;
                const message = `Olá! 👋 Seu pedido acabou de sair para entrega! 🏍️💨 Chegará em breve! 😊`;
                try {
                    await sendMessageToCurrentChat(message);
                    console.log("Mensagem 'Pedido Saiu' enviada.");
                } catch (error) {
                    alert('Erro ao enviar mensagem "Pedido Saiu": ' + error.message);
                }
            };
        }

        if (sendPaymentButton) {
            sendPaymentButton.onclick = async () => {
                if (!scriptEnabled) return;
                try {
                    loadSavedData(); // Recarrega a mensagem de pagamento mais recente
                    if (!storedPaymentMessage) {
                        alert('Por favor, configure a mensagem de pagamento no menu de configurações (botão ⚙️ no canto superior esquerdo).');
                        return;
                    }
                    await sendMessageToCurrentChat(storedPaymentMessage);
                    console.log("Mensagem de Pagamento enviada.");
                } catch (error) {
                    alert('Erro ao enviar mensagem de Pagamento: ' + error.message);
                }
            };
        }

        if (sendGoodNightButton) {
            sendGoodNightButton.onclick = async () => {
                if (!scriptEnabled) return;
                const message = `👋 Olá, boa noite, tudo bem?
🚀 *Para agilizar seu pedido*
- Nom*:
- Endereço com referência:
- Sabor e tamanho:
- Bebida?:
- Forma de pagamento: (Pix, Cartão *ou* _precisa de troco para quantos?_)
🚨 *Muito importante você me repassar tudo de uma só vez, isso agiliza seu pedido ainda mais*`;
                try {
                    await sendMessageToCurrentChat(message);
                    console.log("Mensagem 'Boa Noite' enviada.");
                } catch (error) {
                    alert('Erro ao enviar mensagem "Boa Noite": ' + error.message);
                }
            };
        }

        // NOVOS BOTÕES DE MENSAGEM
        if (sendDrinksButton) {
            sendDrinksButton.onclick = async () => {
                if (!scriptEnabled) return;
                const message = `*Deseja alguma bebida?*🥤
🥤Coca Cola 2L: 15,00
🥤Coca Cola *ZERO* 2L: 15,00
🥤Guaraná, Fanta 2L, Guarapan, Sprite: 13,00
🥤Guaraná 1L: 9,00
🥤Coca Cola, Fanta 600ml: 7,00
🥤Lata Coca, Fanta, Guaraná, Kuat, Sprite 350ml: 6,00
🧃 Suco 1L Tial% Uva e Abacaxi: 12,00
🍺 Brahma, Skol latão: 7,00
🍻 Brahma, Skol 600ml: 10,00
🍻 Original 600ml: 12,00
🍻 Stella, Spaten 600ml: 15,00
🍻 Heineken 600ml: 17,00
🥃 Skol Beats Sense ou GT 269ml: 10,00
🫧 Água s/ gás: 2,50
🫧 Água c/ gás: 3,50`;
                try {
                    await sendMessageToCurrentChat(message);
                    console.log("Mensagem de Bebidas enviada.");
                } catch (error) {
                    alert('Erro ao enviar mensagem de Bebidas: ' + error.message);
                }
            };
        }

        if (sendOrderConfirmedButton) {
            sendOrderConfirmedButton.onclick = async () => {
                if (!scriptEnabled) return;
                const message = `🙏Agradecemos a preferência, já anotei seu pedido 📝⏰Seu tempo de espera, será contado a partir deste momento. 🏍️ Te avisaremos quando seu pedido sair.`;
                try {
                    await sendMessageToCurrentChat(message);
                    console.log("Mensagem 'Pedido Anotado' enviada.");
                } catch (error) {
                    alert('Erro ao enviar mensagem "Pedido Anotado": ' + error.message);
                }
            };
        }


        if (pedidoSaiuButton) {
            pedidoSaiuButton.onclick = async () => {
                if (!scriptEnabled) return;
                const message = stored_pedidoSaiuButton || `Olá! 👋 Seu pedido acabou de sair para entrega! 🏍️💨 Chegará em breve! 😊`;
                try {
                    await sendMessageToCurrentChat(message);
                    console.log("Mensagem 'pedidoSaiuButton' enviada.");
                } catch (error) {
                    alert('Erro ao enviar mensagem de pedidoSaiuButton: ' + error.message);
                }
            };
        }


        if (sendGoodNightButton) {
            sendGoodNightButton.onclick = async () => {
                if (!scriptEnabled) return;
                const message = stored_sendGoodNightButton || `👋 Olá, boa noite, tudo bem?
🚀 *Para agilizar seu pedido*
- Nom*:
- Endereço com referência:
- Sabor e tamanho:
- Bebida?:
- Forma de pagamento: (Pix, Cartão *ou* _precisa de troco para quantos?_)
🚨 *Muito importante você me repassar tudo de uma só vez, isso agiliza seu pedido ainda mais*`;
                try {
                    await sendMessageToCurrentChat(message);
                    console.log("Mensagem 'sendGoodNightButton' enviada.");
                } catch (error) {
                    alert('Erro ao enviar mensagem de sendGoodNightButton: ' + error.message);
                }
            };
        }


        if (sendDrinksButton) {
            sendDrinksButton.onclick = async () => {
                if (!scriptEnabled) return;
                const message = stored_sendDrinksButton || `*Deseja alguma bebida?*🥤
🥤Coca Cola 2L: 15,00
🥤Coca Cola *ZERO* 2L: 15,00
🥤Guaraná, Fanta 2L, Guarapan, Sprite: 13,00
🥤Guaraná 1L: 9,00
🥤Coca Cola, Fanta 600ml: 7,00
🥤Lata Coca, Fanta, Guaraná, Kuat, Sprite 350ml: 6,00
🧃 Suco 1L Tial% Uva e Abacaxi: 12,00
🍺 Brahma, Skol latão: 7,00
🍻 Brahma, Skol 600ml: 10,00
🍻 Original 600ml: 12,00
🍻 Stella, Spaten 600ml: 15,00
🍻 Heineken 600ml: 17,00
🥃 Skol Beats Sense ou GT 269ml: 10,00
🫧 Água s/ gás: 2,50
🫧 Água c/ gás: 3,50`;
                try {
                    await sendMessageToCurrentChat(message);
                    console.log("Mensagem 'sendDrinksButton' enviada.");
                } catch (error) {
                    alert('Erro ao enviar mensagem de sendDrinksButton: ' + error.message);
                }
            };
        }


        if (sendOrderConfirmedButton) {
            sendOrderConfirmedButton.onclick = async () => {
                if (!scriptEnabled) return;
                const message = stored_sendOrderConfirmedButton || `🙏Agradecemos a preferência, já anotei seu pedido 📝⏰Seu tempo de espera, será contado a partir deste momento. 🏍️ Te avisaremos quando seu pedido sair.`;
                try {
                    await sendMessageToCurrentChat(message);
                    console.log("Mensagem 'sendOrderConfirmedButton' enviada.");
                } catch (error) {
                    alert('Erro ao enviar mensagem de sendOrderConfirmedButton: ' + error.message);
                }
            };
        }


        if (sendAddressButton) {
            sendAddressButton.onclick = async () => {
                if (!scriptEnabled) return;
                const message = stored_sendAddressButton || `🏡 Me informe seu endereço com referência para facilitar sua entrega 🚀`;
                try {
                    await sendMessageToCurrentChat(message);
                    console.log("Mensagem 'sendAddressButton' enviada.");
                } catch (error) {
                    alert('Erro ao enviar mensagem de sendAddressButton: ' + error.message);
                }
            };
        }


        if (sendAddressButton) {
            sendAddressButton.onclick = async () => {
                if (!scriptEnabled) return;
                const message = `🏡 Me informe seu endereço com referência para facilitar sua entrega 🚀`;
                try {
                    await sendMessageToCurrentChat(message);
                    console.log("Mensagem de Endereço enviada.");
                } catch (error) {
                    alert('Erro ao enviar mensagem de Endereço: ' + error.message);
                }
            };
        }
    }

    // --- Inicialização do Script ---
    function initialize() {
        injectStyles();
        injectButtons();
        injectModal();
        setupConfigModal();
        injectTimeConfigModal();
        setupEdgeHover();
        showButtonsTemporarily();
        setupButtonListeners(); // Configura os listeners dos botões principais
        loadSavedData(); // Garante que os dados estejam carregados para a primeira renderização dos botões de tempo
        renderWaitTimeButtons(); // Renderiza os botões de tempo de espera ao carregar
        updateUIState(); // Atualiza a UI de acordo com o estado salvo
    }

    // Observa o DOM para garantir que os elementos do WhatsApp Web estejam carregados
    const observer = new MutationObserver((mutations, obs) => {
        if (document.querySelector('#app')) {
            initialize();
            obs.disconnect(); // Desconecta o observador após a inicialização
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });




// --- Extensão: Temporizador de botões ---

// Adicionar no topo do script
const LOCAL_STORAGE_KEY_BUTTON_VISIBILITY_TIME = 'whatsappButtonVisibilityTime';
let buttonVisibleDuration = parseInt(localStorage.getItem(LOCAL_STORAGE_KEY_BUTTON_VISIBILITY_TIME)) || 5;
let hideTimeout = null;

// Adicionar ao injectModal()
function injectTimeConfigModal() {
    const modal = document.createElement('div');
    modal.id = 'timeConfigModal';
    modal.style = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #2a3942;
        padding: 20px;
        border-radius: 10px;
        z-index: 100002;
        display: none;
        color: white;
        width: 300px;
        box-shadow: 0 0 15px rgba(0,0,0,0.6);
    `;
 modal.innerHTML = `
    <div style="
        background-color: #202c33;
        padding: 20px;
        border-radius: 12px;
        font-family: 'Segoe UI', sans-serif;
        color: #f0f0f0;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    ">
        <h2 style="
            margin: 0 0 15px;
            font-size: 20px;
            text-align: center;
            color: #00a884;
        ">
            ⏱️ Configurar Tempo de Visibilidade
        </h2>

        <p style="
            font-size: 14px;
            margin-bottom: 8px;
            text-align: center;
            line-height: 1.5;
        ">
            Defina abaixo por quantos segundos os botões devem permanecer visíveis na tela.
            Após esse tempo, eles desaparecerão automaticamente.<br>
            Para reexibi-los, basta passar o mouse no canto direito da tela.
        </p>

        <div style="margin-bottom: 20px;">
            <label for="buttonTimeInput" style="
                display: block;
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 6px;
            ">
                Tempo em segundos:
            </label>
            <input
                id="buttonTimeInput"
                type="number"
                min="1"
                value="${buttonVisibleDuration}"
                style="
                    width: 100%;
                    padding: 10px;
                    font-size: 14px;
                    border-radius: 8px;
                    border: none;
                    outline: none;
                    background-color: #2a3942;
                    color: #ffffff;
                    box-sizing: border-box;
                "
            >
        </div>

        <div style="text-align: right;">
            <button
                id="saveTimeBtn"
                style="
                    padding: 10px 20px;
                    background: #00a884;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                    cursor: pointer;
                    transition: background 0.3s, transform 0.2s;
                "
                onmouseover="this.style.background='#01976f'"
                onmouseout="this.style.background='#00a884'"
                onmousedown="this.style.transform='scale(0.95)'"
                onmouseup="this.style.transform='scale(1)'"
            >
                💾 Salvar
            </button>
        </div>
    </div>
`;

    document.body.appendChild(modal);

    document.getElementById('saveTimeBtn').onclick = () => {
        const time = parseInt(document.getElementById('buttonTimeInput').value);
        if (!isNaN(time) && time > 0) {
            localStorage.setItem(LOCAL_STORAGE_KEY_BUTTON_VISIBILITY_TIME, time);
            buttonVisibleDuration = time;
            modal.style.display = 'none';
            showButtonsTemporarily();
        }
    };
}

function showButtonsTemporarily() {
    showAllButtons();
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
        hideAllButtons();
    }, buttonVisibleDuration * 1000);
}

function showAllButtons() {
    document.querySelectorAll('.float-button').forEach(btn => {
        btn.style.display = 'flex';
    });
    document.querySelector('.revive-button-container').style.display = 'flex';
}

function hideAllButtons() {
    document.querySelectorAll('.float-button').forEach(btn => {
        if (!['toggleScriptButton', 'configureMenuButton'].includes(btn.id)) {
            btn.style.display = 'none';
        }
    });
   
}
// Dentro do seu onload principal:

function setupEdgeHover() {
    const edgeZone = document.createElement('div');
    edgeZone.style = `
        position: fixed;
        right: 0;
        top: 0;
        width: 0.1px;
        height: 100vh;
        z-index: 9999;
    `;
    edgeZone.addEventListener('mouseenter', () => {
        showButtonsTemporarily();
    });
    document.body.appendChild(edgeZone);
}




// SISTEMA BACKUP E RESTAURAÇÃO LOCAL STORAGE - SOMENTE CHAVES MV*
(function () {
    // Mensagem no topo
    const topDiv = document.createElement('div');
    topDiv.textContent = 'Interface WebWhatsapp MV';
    Object.assign(topDiv.style, {
        position: 'fixed',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        padding: '5px 10px',
        fontSize: '13px',
        borderRadius: '5px',
        zIndex: '9999',
        pointerEvents: 'none',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
    });
    document.body.appendChild(topDiv);

    // Modal de boas-vindas
    const welcomeModal = document.createElement('div');
    welcomeModal.innerHTML = `
        <div style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #4CAF50;">Bem-vindo à Interface MV!</div>
        <p style="margin-bottom: 15px; font-size: 15px;">Salve ou restaure apenas as configurações MV*, sem afetar seu WhatsApp!</p>
        <p style="font-weight: bold;">Atalhos:</p>
        <ul style="text-align: left; padding-left: 25px;">
            <li><span style="background:#5cb85c;color:white;padding:2px 6px;border-radius:4px;">Ctrl+Shift+B</span> Backup (chaves MV*)</li>
            <li><span style="background:#d9534f;color:white;padding:2px 6px;border-radius:4px;">Ctrl+Shift+R</span> Restaurar (chaves MV*)</li>
        </ul>
        <button id="welcomeModalCloseBtn" style="background:#4CAF50;color:#fff;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;">Entendi!</button>
    `;
    Object.assign(welcomeModal.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#2b2b2b',
        color: '#f0f0f0',
        padding: '30px',
        borderRadius: '12px',
        zIndex: '10001',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center'
    });
    document.body.appendChild(welcomeModal);

    document.getElementById('welcomeModalCloseBtn').addEventListener('click', () => welcomeModal.remove());

    // Função Backup
    function backupLocalStorage() {
        try {
            const mvItems = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('MV')) {
                    mvItems[key] = localStorage.getItem(key);
                }
            }
            const backupData = JSON.stringify(mvItems, null, 2);

            const blob = new Blob([backupData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'MV_backup_' + new Date().toISOString().slice(0, 10) + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('Backup gerado com sucesso! Verifique seus downloads.');
        } catch (err) {
            console.error(err);
            alert('Erro ao gerar backup. Veja o console.');
        }
    }

    // Função Restaurar
    function restoreLocalStorage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';

        input.onchange = function (e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (event) {
                try {
                    const restoredData = JSON.parse(event.target.result);

                    const confirmRestore = confirm(
                        'Deseja restaurar as chaves MV*? Isso sobrescreverá as atuais.'
                    );

                    if (confirmRestore) {
                        // Limpa só chaves MV
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key.startsWith('MV')) {
                                localStorage.removeItem(key);
                            }
                        }

                        // Restaura
                        let count = 0;
                        for (const key in restoredData) {
                            if (restoredData.hasOwnProperty(key) && key.startsWith('MV')) {
                                localStorage.setItem(key, restoredData[key]);
                                count++;
                            }
                        }

                        alert(`Restauradas ${count} chaves MV* com sucesso! Recarregue a página.`);
                    }
                } catch (err) {
                    console.error(err);
                    alert('Erro ao restaurar. Verifique se o JSON é válido.');
                }
            };
            reader.readAsText(file);
            document.body.removeChild(input);
        };

        document.body.appendChild(input);
        input.click();
    }

    // Atalhos
    document.addEventListener('keydown', function (event) {
        if (event.ctrlKey && event.shiftKey && event.key.toUpperCase() === 'B') {
            event.preventDefault();
            backupLocalStorage();
        }
        if (event.ctrlKey && event.shiftKey && event.key.toUpperCase() === 'R') {
            event.preventDefault();
            restoreLocalStorage();
        }
    });
})();

(function () {
    // --- CHAVE DE ATIVAÇÃO/DESATIVAÇÃO DA BRINCADEIRA ---
    const enablePrank = false; // Mude para 'false' para desativar a brincadeira do modal.
    // ---------------------------------------------------

    if (!enablePrank) {
        // Se a brincadeira estiver desativada, encerra a execução do script aqui.
        console.log('Brincadeira do modal desativada. Nenhuma ação será executada.');
        return;
    }

    
    // ---
    
    // Configurações do modal "fujão"
    const funnyMessages = [
        "Se dá trabalho demais, Paulo! 😫 Eu sei que você consegue... ou não! 😂 E os salgados? Já saíram da fritadeira?",
        "Achou que ia fechar fácil, Mitinga? É mais rápido fazer 100 coxinhas do que fechar isso aqui!",
        "KKKKKKKK Fecha aí, Mitinga! Fechar isso aqui é mais fácil que fazer salgado. E os hambúrgueres, já estão no ponto?",
        "HAHAHA! Tentou de novo, Paulo? Tô rindo alto daqui! Cadê os salgados que ninguém vê? A fila da fome tá crescendo!",
        "Desista, Mitinga! A zoeira não tem fim! 😜 Se fosse pra fechar fácil, não seria divertido, né?",
        "Você já sabe... dá trabalho demais, Paulo! Mas menos trabalho que entregar os salgados e hambúrgueres atrasados, hein?",
        "Essa é boa, Mitinga! 😂😂😂 Aposto que o tempo que você tá perdendo aqui dava pra montar uns 50 hambúrgueres!",
        "O botão de fechar é só pra inglês ver, Paulo! 😉",
        "Mais uma tentativa falha, Mitinga. 😎 Tá suando aí, né? É o mesmo suor pra fazer salgado ou pro calor da chapa?",
        "Quase lá! Ou não, Paulo... 😝 Mas não se preocupe, a gente espera os salgados e hambúrgueres, um dia eles chegam!",
        "Desisto de você, Mitinga!",
        "Falta pouco, Paulo! Assim como falta pouco para os salgados ficarem prontos... SQN! KKKK E o hambúrguer, já tá com queijo?",
        "Essa tela é mais insistente que cliente pedindo fiado, Mitinga. E os salgados/hambúrgueres, estão prontos pra vender no fiado? Ou vai fugir igual essa janela?"
    ];

    let moveCount = 0;
    const maxMoves = 10;
    let modalClosed = false;

    // ---

    // Criação do modal
    const modalContainer = document.createElement('div');
    Object.assign(modalContainer.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#ff4757',
        color: '#fff',
        padding: '20px',
        fontSize: '18px',
        fontWeight: 'bold',
        borderRadius: '8px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
        zIndex: '10000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '300px',
        textAlign: 'center'
    });

    const modalMessage = document.createElement('p');
    modalMessage.textContent = funnyMessages[0];
    Object.assign(modalMessage.style, {
        marginBottom: '15px'
    });
    modalContainer.appendChild(modalMessage);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Fechar';
    Object.assign(closeButton.style, {
        backgroundColor: '#fff',
        color: '#ff4757',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        transition: 'background-color 0.2s ease',
        marginTop: '10px'
    });

    closeButton.onmouseover = function() {
        this.style.backgroundColor = '#eee';
    };
    closeButton.onmouseout = function() {
        this.style.backgroundColor = '#fff';
    };

    modalContainer.appendChild(closeButton);
    document.body.appendChild(modalContainer);

    // ---

    // Função para mover o modal
    function moveModal() {
        if (modalClosed) return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const modalWidth = modalContainer.offsetWidth;
        const modalHeight = modalContainer.offsetHeight;

        const newX = Math.random() * (viewportWidth - modalWidth);
        const newY = Math.random() * (viewportHeight - modalHeight);

        Object.assign(modalContainer.style, {
            left: `${newX}px`,
            top: `${newY}px`,
            transform: 'none' // Remove o translate para usar left/top diretamente
        });
    }

    // ---

    // Evento de click do botão de fechar
    closeButton.addEventListener('click', () => {
        if (modalClosed) return;

        moveCount++;
        if (moveCount <= maxMoves) {
            modalMessage.textContent = funnyMessages[moveCount % funnyMessages.length]; // Pega a próxima mensagem
            moveModal();
            // Adiciona uma pequena vibração visual para dar a ideia de "fuga"
            modalContainer.style.transition = 'all 0.1s ease-out';
            setTimeout(() => {
                modalContainer.style.transition = 'none';
            }, 100);
        } else {
            modalContainer.remove();
            modalClosed = true;
            alert('Até que fim! KKKKKKKKK, forte abraço do MV 🥳'); // Uma mensagem final de alívio
        }
    });

    // ---
    
    // Inicia a posição do modal
    moveModal();

})();
})();
})();


// === FUNÇÕES DE BACKUP E RESTAURAÇÃO ===
function backupLocalStorage() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mv_backup.json';
    a.click();
    URL.revokeObjectURL(url);
}

function restoreLocalStorageFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (confirm('Tem certeza que deseja restaurar o backup? Isso substituirá suas configurações.')) {
                    localStorage.clear();
                    for (const key in data) {
                        localStorage.setItem(key, data[key]);
                    }
                    alert('✅ Backup restaurado com sucesso! Recarregue a página.');
                }
            } catch (err) {
                alert('❌ Erro ao restaurar backup: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// === BOTÕES DE BACKUP NO MODAL DE BOAS-VINDAS ===
const welcomeCloseBtn = document.getElementById('welcomeModalCloseBtn');

const backupBtn = document.createElement('button');
backupBtn.textContent = '📤 Fazer Backup';
backupBtn.style.marginRight = '10px';
backupBtn.style.padding = '10px 20px';
backupBtn.style.borderRadius = '5px';
backupBtn.style.backgroundColor = '#5cb85c';
backupBtn.style.color = 'white';
backupBtn.style.fontWeight = 'bold';
backupBtn.style.cursor = 'pointer';
backupBtn.onclick = backupLocalStorage;

const restoreBtn = document.createElement('button');
restoreBtn.textContent = '📥 Restaurar Backup';
restoreBtn.style.marginRight = '10px';
restoreBtn.style.padding = '10px 20px';
restoreBtn.style.borderRadius = '5px';
restoreBtn.style.backgroundColor = '#d9534f';
restoreBtn.style.color = 'white';
restoreBtn.style.fontWeight = 'bold';
restoreBtn.style.cursor = 'pointer';
restoreBtn.onclick = restoreLocalStorageFromFile;

welcomeCloseBtn?.parentElement?.insertBefore(backupBtn, welcomeCloseBtn);
welcomeCloseBtn?.parentElement?.insertBefore(restoreBtn, welcomeCloseBtn);



// === BACKUP AUTOMÁTICO A CADA 5 SEGUNDOS (APENAS PARA TESTES) ===
setInterval(() => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `mv_backup_auto_${timestamp}.json`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('📦 Backup automático salvo:', filename);
}, 21600000); // 5 segundos para testes — depois trocar para 12h (43200000 ms)

// --- RESPONDER PIX AUTOMATICO ---
(function () {
    'use strict';

    const PALAVRA_CHAVE = "pix";
    const MENSAGEM1 = "*💳 *Nossa chave PIX é o número de celular abaixo.* Por favor, copie e cole, e envie o comprovante por aqui. Obrigado! 😊*";
    const RESPONDIDOS_KEY = "msgs_pix_respondidas_ids";
    const SESSOES_EM_ANDAMENTO = {};

    function getChavePixSalva() {
        return localStorage.getItem('whatsappPixKey') || '';
    }

    function getHistoricoRespondidos() {
        const raw = localStorage.getItem(RESPONDIDOS_KEY);
        return raw ? JSON.parse(raw) : [];
    }

    function salvarHistoricoRespondidos(lista) {
        localStorage.setItem(RESPONDIDOS_KEY, JSON.stringify(lista.slice(-500)));
    }

    function gerarIdUnico(msgElement) {
        const texto = msgElement.innerText || "";
        const timestamp = msgElement.querySelector("span[data-pre-plain-text]")?.getAttribute("data-pre-plain-text") || "";
        return btoa(texto + timestamp);
    }

    function enviarMensagem(texto, callback) {
        const inputBox = document.querySelector('div[contenteditable="true"][data-tab="10"]');
        if (!inputBox) {
            console.warn("🚫 Campo de digitação não encontrado.");
            return;
        }

        inputBox.focus();
        document.execCommand('insertText', false, texto);
        inputBox.dispatchEvent(new InputEvent("input", { bubbles: true }));

        setTimeout(() => {
            const botaoEnviar = document.querySelector('button[data-tab="11"][aria-label="Enviar"]');
            if (botaoEnviar) {
                botaoEnviar.click();
                if (callback) setTimeout(callback, 500);
            } else {
                console.warn("🚫 Botão de enviar não encontrado.");
            }
        }, 300);
    }

    function verificarMensagens() {
        const mensagens = Array.from(document.querySelectorAll("div.message-in")).slice(-3);
        if (mensagens.length === 0) return;

        const historico = getHistoricoRespondidos();

        for (let msg of mensagens) {
            const spans = msg.querySelectorAll("span.selectable-text span");
            for (let span of spans) {
                const texto = span.innerText.toLowerCase();
                if (texto.includes(PALAVRA_CHAVE)) {
                    const idMsg = gerarIdUnico(msg);
                    if (!idMsg) continue;

                    if (historico.includes(idMsg)) {
                        // Já respondeu essa mensagem pix
                        continue;
                    }

                    if (SESSOES_EM_ANDAMENTO[idMsg]) {
                        // Já está em processo para essa mensagem
                        continue;
                    }

                    const chavePix = getChavePixSalva();
                    if (!chavePix) {
                        console.warn("⚠️ Nenhuma chave Pix configurada.");
                        return;
                    }

                    // Marca que vai responder para evitar duplicação
                    SESSOES_EM_ANDAMENTO[idMsg] = true;

                    // Salva imediatamente para evitar respostas múltiplas
                    historico.push(idMsg);
                    salvarHistoricoRespondidos(historico);

                    console.log(`✅ Respondendo automaticamente mensagem PIX com ID: ${idMsg}`);

                    enviarMensagem(MENSAGEM1, () => {
                        enviarMensagem(chavePix, () => {
                            setTimeout(() => {
                                delete SESSOES_EM_ANDAMENTO[idMsg];
                            }, 3000);
                        });
                    });

                    return; // Sai após enviar para evitar múltiplos envios na mesma execução
                }
            }
        }
    }

    setInterval(verificarMensagens, 2000);
})();
