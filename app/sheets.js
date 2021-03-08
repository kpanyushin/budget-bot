import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

import { google } from 'googleapis';

import { months, incomeSheetName } from './constants';
import { bot } from './index';

const spreadsheetId = process.env.SPREADSHEET_ID;
let sheets;
let authClient;
const currentMonth = months[new Date().getMonth()];

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

export const authorize = function (msg) {
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);

    const { redirect_uris } = JSON.parse(content).installed;
    const client_id = process.env.CLIENT_ID;
    const client_secret = process.env.CLIENT_SECRET;
    authClient = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getNewToken(msg, authClient);
      authClient.setCredentials(JSON.parse(token));
      sheets = google.sheets({
        version: 'v4',
        auth: authClient
      });
    });
  });
};

function getNewToken(msg, oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  bot.sendMessage(
    msg.chat.id,
    'Authorize this app by visiting this url: ' + authUrl
  );
}

export const createNewToken = function (code) {
  authClient.getToken(code, (err, token) => {
    if (err)
      return console.error('Error while trying to retrieve access token', err);
    authClient.setCredentials(token);
    // Store the token to disk for later program executions
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
      if (err) return console.error(err);
      console.log('Token stored to', TOKEN_PATH);
    });
  });
};

function fulfillSheet(range, onErr, onSuccess) {
 sheets.spreadsheets.values.append(
   {
     range,
     spreadsheetId,
     valueInputOption: 'USER_ENTERED',
     insertDataOption: 'OVERWRITE',
     requestBody: {
       values: [
        ['Дата операции', 'Сумма',	'Категория', 'Описание', 'Остаток']
       ]
     }
   },
   (err, res) => {
    if (err) {
      onErr(err);
      return;
    }

    onSuccess(res);
   }
 );
}

export const addExpense = function (data, onErr, onSuccess) {
  if (!data || !data.length) return;
  sheets.spreadsheets.values.append(
    {
      spreadsheetId,
      range: currentMonth,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'OVERWRITE',
      requestBody: {
        values: data
      }
    },
    (err, res) => {
      if (err) {
        onErr(err);
        return;
      }
      onSuccess(res);
    }
  );
};

export const addIncome = function (data, onErr, onSuccess) {
  if (!data || !data.length) return;
  sheets.spreadsheets.values.append(
    {
      spreadsheetId,
      range: `${incomeSheetName}!A:D`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'OVERWRITE',
      requestBody: {
        values: data
      },
    },
    (err, res) => {
      if (err) {
        onErr(err);
        return;
      }
      onSuccess(res);
    }
  );
};

export const getBalance = function (onErr, onSuccess) {
  sheets.spreadsheets.values.get(
    {
      spreadsheetId,
      range: `${currentMonth}!E2:E2`
    },
    (err, res) => {
      if (err) {
        onErr(err);
        return;
      }
      onSuccess(res.data.values[0][0]);
    }
  );
};

export const addSheet = function (onErr, onSuccess) {
  const request = {
    spreadsheetId,
    resource: {
      requests: [
        {
          addSheet: {
            properties: {
              title: currentMonth,
            }
          }
        }
      ]
    }
  };
  sheets.spreadsheets.batchUpdate(request, (err) => {
    if (err) {
      onErr(err);
      return;
    }

    fulfillSheet(currentMonth, onErr, onSuccess);
  });
};
