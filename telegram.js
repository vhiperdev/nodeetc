const { Telegraf } = require("telegraf");
const { MessageMedia } = require("whatsapp-web.js");
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

const configArray = [
  {
    "whatsappChatId": "120363205892553841@g.us", // Avisos Servidores Geral 
    "telegramChatId": -1002110243578, //  title: Avisos Servidores Geral 
    "telegramBotToken": "6868649484:AAH_M3qOBCtTTio-Fkcf_vY1wDFWjj58xAk"
  },
  // Adicione mais configurações aqui, se necessário
];

const telegramBot = new Telegraf(configArray[0].telegramBotToken);

// Função para configurar o bot do Telegram com o cliente do WhatsApp
function setupTelegramBot(whatsappClient) {
  // Cria um middleware customizado para encaminhar mensagens para o WhatsApp
  telegramBot.use((ctx, next) => {
    const chatId = ctx.update.channel_post?.chat.id;

    // Procura a configuração correspondente ao chatId
    const config = configArray.find((c) => c.telegramChatId === chatId);

    if (config) {
      handleChannelPost(ctx, config, whatsappClient);
    }

    return next();
  });

  telegramBot.hears("ping", (ctx) => ctx.reply("pong"));
}

// Exporta o bot do Telegram e a função de configuração
module.exports = { telegramBot, setupTelegramBot };

// Função de manipulação do post do canal
async function handleChannelPost(ctx, config, whatsappClient) {
  try {
    const post = ctx.update.channel_post;
    const file_id =
      post.photo?.[post.photo.length - 1]?.file_id ||
      post.voice?.file_id ||
      post.video?.file_id ||
      post.document?.file_id;
    const file_name = post.document?.file_name || null;

    if (file_id) {
      const file_url = await ctx.telegram.getFileLink(file_id);

      try {
        const media = await MessageMedia.fromUrl(file_url.href, {
          filename: file_name,
        });
        await whatsappClient.sendMessage(config.whatsappChatId, media, {
          caption: post.caption,
        });
      } catch (error) {
        console.error('Erro no envio direto do arquivo:', error);

        // Se houver erro no envio, tentamos converter apenas se for um vídeo
        if (post.video) {
          console.log('Tentando converter o vídeo...');

          try {
            const convertedMedia = await convertVideo(file_url.href);
            await whatsappClient.sendMessage(config.whatsappChatId, convertedMedia, {
              caption: post.caption,
            });

            console.log('Conversão e envio do vídeo concluídos.');
          } catch (conversionError) {
            console.error('Erro na conversão de vídeo:', conversionError);
          }
        }
      }
    } else {
      await whatsappClient.sendMessage(config.whatsappChatId, post.text);
    }
  } catch (error) {
    console.log(error);
  }
}

// Função para converter vídeo usando ffmpeg
async function convertVideo(originalUrl) {
  return new Promise(async (resolve, reject) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const convertedFilename = `converted_video_${uniqueSuffix}.mp4`; // Nome do arquivo convertido
	const outputFilePath = path.join(__dirname, 'videos', convertedFilename);

    ffmpeg(originalUrl)
      .output(outputFilePath)
      .on('end', async () => {
        console.log('Conversão de vídeo concluída.');

        // Chama a função para excluir o arquivo de vídeo após o envio
        await deleteVideoFile(outputFilePath);

        // Resolve com o caminho do arquivo para enviar
        resolve(MessageMedia.fromFilePath(outputFilePath));
      })
      .on('error', (err) => {
        console.error('Erro na conversão de vídeo:', err);
        reject(err);
      })
      .run();
  });
}

// Função para excluir o arquivo de vídeo
function deleteVideoFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Erro ao excluir o arquivo de vídeo:', err);
    } else {
      console.log('Arquivo de vídeo excluído com sucesso.');
    }
  });
}