// ==UserScript==
// @name         Aviso Fixo WhatsApp Web com Botão de Contato e Contador
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Exibe aviso fixo no topo da tela com botão para contato via WhatsApp e contador de 20s
// @author       Marcos
// @match        https://web.whatsapp.com/
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  function mostrarAvisoFixo() {
    if (document.getElementById("aviso-fixo-topo")) return;

    const aviso = document.createElement("div");
    aviso.id = "aviso-fixo-topo";
    aviso.style.position = "fixed";
    aviso.style.top = "0";
    aviso.style.left = "0";
    aviso.style.width = "100%";
    aviso.style.backgroundColor = "#c62828";
    aviso.style.color = "#fff";
    aviso.style.fontSize = "16px";
    aviso.style.fontWeight = "bold";
    aviso.style.textAlign = "center";
    aviso.style.padding = "10px";
    aviso.style.zIndex = "999999";
    aviso.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
    aviso.style.fontFamily = "Arial, sans-serif";
    aviso.style.display = "flex";
    aviso.style.justifyContent = "center";
    aviso.style.alignItems = "center";
    aviso.style.gap = "10px";
    aviso.style.flexWrap = "wrap";

    const texto = document.createElement("span");
    texto.textContent = "⚠️ O sistema será desativado a qualquer momento. Entre em contato com o desenvolvedor: Marcos (MV ELETRÔNICOS)";

    const contador = document.createElement("span");
    contador.id = "contador-aviso";
    contador.style.marginLeft = "10px";
    contador.style.fontWeight = "bold";
    contador.style.backgroundColor = "#fff";
    contador.style.color = "#c62828";
    contador.style.padding = "3px 8px";
    contador.style.borderRadius = "4px";

    let tempoRestante = 20;
    contador.textContent = `(${tempoRestante}s)`;

    const interval = setInterval(() => {
      tempoRestante--;
      contador.textContent = `(${tempoRestante}s)`;
      if (tempoRestante <= 0) {
        clearInterval(interval);
        aviso.remove();
      }
    }, 1000);

    const botao = document.createElement("button");
    botao.textContent = "Entrar em contato";
    botao.style.backgroundColor = "#fff";
    botao.style.color = "#c62828";
    botao.style.border = "none";
    botao.style.padding = "5px 12px";
    botao.style.borderRadius = "5px";
    botao.style.cursor = "pointer";
    botao.style.fontWeight = "bold";
    botao.onclick = () => {
      window.open("https://wa.me/5531996707795", "_blank");
    };

    aviso.appendChild(texto);
    aviso.appendChild(contador);
    aviso.appendChild(botao);
    document.body.appendChild(aviso);
  }

  window.addEventListener('load', () => {
    setTimeout(mostrarAvisoFixo, 3000);
  });
})();
