const { telegramBot, setupTelegramBot } = require('./telegram');
const { whatsappClient } = require('./whatsapp');

// Configura o bot do Telegram com o cliente do WhatsApp
setupTelegramBot(whatsappClient);

// Inicia o bot do Telegram
telegramBot.launch();
console.log('O bot do Telegram está funcionando...');

// Inicializa o cliente do WhatsApp
whatsappClient.initialize();
