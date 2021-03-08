const { bot } = require('./index');

let reminder;

export const remind = function(msg) {
  if (!reminder) {
    reminder = setInterval(() => {
      bot.sendMessage(msg.chat.id, 'Не забудь добавить расходы за сегодня');
    }, 1000 * 3600 * 24);
  }
}
