const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

const whatsappClient = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ["--no-sandbox"], executablePath: '/usr/bin/google-chrome-stable' },
});

whatsappClient.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

whatsappClient.on("ready", async () => {
  console.log("Cliente WhatsApp está pronto!");
});

whatsappClient.on("message", (msg) => {
  if (msg.body == "!ping") {
    msg.reply("pong");
  }
});

module.exports = { whatsappClient };