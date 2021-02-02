const fs = require('fs');
const dotenv = require('dotenv');
const { google } = require('googleapis');

const { bot } = require('../index');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

let oAuth2Client;

dotenv.config();

function authorize(msg) {
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);

    const { redirect_uris } = JSON.parse(content).installed;
    const client_id = process.env.CLIENT_ID;
    const client_secret = process.env.CLIENT_SECRET;
    oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );
  
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getNewToken(msg);
      oAuth2Client.setCredentials(JSON.parse(token));
    });
  });
}

function getNewToken(msg) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  bot.sendMessage(msg.chat.id, 'Authorize this app by visiting this url: ' + authUrl);
}

bot.onText(/Токен - (.+)/, (_, match) => {
  const code = match[1];
  oAuth2Client.getToken(code, (err, token) => {
    if (err)
      return console.error(
        'Error while trying to retrieve access token',
        err
      );
    oAuth2Client.setCredentials(token);
    // Store the token to disk for later program executions
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
      if (err) return console.error(err);
      console.log('Token stored to', TOKEN_PATH);
    });
  });
});

bot.onText(/\/start/, (msg) => {
  authorize(msg);
  const opts = {
    reply_to_message_id: msg.message_id,
    reply_markup: JSON.stringify({
      keyboard: [
        ['Добавить доход'],
        ['Добавить расход'],
        ['Остаток'],
        ['Добавить новый лист']
      ]
    })
  };

  bot.sendMessage(msg.chat.id, 'Что нужно сделать?', opts);
});

console.log(oAuth2Client);

module.exports.authClient =  {
  auth: oAuth2Client,
};