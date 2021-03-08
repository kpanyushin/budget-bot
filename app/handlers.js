import dotenv from 'dotenv';

dotenv.config();

import { bot } from './index.js';
import * as constants from './constants';
console.log(constants);
// import { addIncomeMsg, addExpenseMsg, months, defaultKeyboard as keyboard } from './constants';
import {
  addExpense,
  addIncome,
  getBalance,
  addSheet,
  authorize,
  createNewToken
} from './sheets';
import remind from './reminder';

const incomeList = [];
const expenseList = [];
/**
 * @type {'income'|'expense'}
 */
let currentOperation;

function handleError(err) {
  console.error(err);
}

bot.onText(/\/start/, (msg) => {
  const opts = {
    reply_to_message_id: msg.message_id,
    reply_markup: JSON.stringify({ keyboard }),
  };

  bot.sendMessage(msg.chat.id, 'Что нужно сделать?', opts);
});

bot.onText(/Токен - (.+)/, (_, match) => {
  createNewToken(match[1]);
});

bot.onText(/Добавить доход/, (msg) => {
  currentOperation = 'income';
  bot.sendMessage(msg.chat.id, addIncomeMsg);
});

bot.onText(/Добавить расход/, (msg) => {
  currentOperation = 'expense';

  bot.sendMessage(msg.chat.id, addExpenseMsg);
});

bot.onText(/(.+)-(.+)-(.+)-(.+)/, (msg, match) => {
  const operation = [];
  let operationName = '';
  msg.text.split('-').forEach((item) => operation.push(item));
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Добавить еще',
            callback_data: currentOperation,
          }
        ]
      ]
    }
  };
  const handleSuccess = () => {
    bot.sendMessage(msg.chat.id, `${operationName} добавлен`, opts);
  };
  if (currentOperation === 'income') {
    if (!months.includes(match[1])) {
      bot.sendMessage(
        msg.chat.id,
        'Введи правильное название месяца в формате Январь'
      );
      return;
    }
    incomeList.push(operation);
    operationName = 'Доход';
    addIncome([operation], handleError, handleSuccess);
  }
  if (currentOperation === 'expense') {
    expenseList.push(operation);
    operationName = 'Расход';
    addExpense([operation], handleError, handleSuccess);
  }
});

bot.onText(/Остаток/, (msg) => {
  const handleSuccess = (res) => {
    bot.sendMessage(msg.chat.id, `На траты осталось ${res} крон`);
  };
  getBalance(handleError, handleSuccess);
});

bot.onText(/Добавить новый лист/, () => {
  const handleSuccess = (res) => {
    console.log(res);
  };
  addSheet(handleError, handleSuccess);
});

bot.on('message', (msg) => {
  remind(msg);
  authorize(msg);
});

bot.on('callback_query', (cbQuery) => {
  const action = cbQuery.data;
  const msg = cbQuery.message;

  if (action === 'income') {
    bot.sendMessage(msg.chat.id, addIncomeMsg);
  }

  if (action === 'expense') {
    bot.sendMessage(msg.chat.id, addExpenseMsg);
  }
});
