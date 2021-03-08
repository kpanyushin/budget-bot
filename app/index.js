import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

export const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
