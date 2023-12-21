import { Injectable } from "@nestjs/common";
import { Telegraf } from "telegraf";

import config from "../../config";
import Message from "src/message";

const winston = require("../log.js");

const { botKey, chatId } = config.get("app");

winston.info({ botKey, chatId });

const MAX_LENGTH = 4096; //TG Limit

@Injectable()
export class AppService {
  bot = new Telegraf(botKey);

  chunkMessage = (str: string, size: number): Array<string> =>
    Array.from({ length: Math.ceil(str.length / size) }, (_, i) =>
      str.slice(i * size, i * size + size)
    );

  async sendMessage(message: Message): Promise<string> {
    if (!botKey) throw new Error("Empty bot key");
    if (!chatId) throw new Error("Empty chat ID");

    message.report.localStorage = undefined; // hide localStorage - too long

    if (message.report.errors?.length > 0) {
      message.report.errorStack = undefined; // hide raw errorStack on parsed errors existance
    }

    const text =
      `[${message.zone}] DocSpace client:\nKey: '${message.key}'\nReport:\n` +
      JSON.stringify(message.report, null, "\t");

    try {
      if (text.length > MAX_LENGTH) {
        for (const part of this.chunkMessage(text, MAX_LENGTH)) {
          await this.bot.telegram.sendMessage(chatId, part);
        }
      } else {
        await this.bot.telegram.sendMessage(chatId, text);
      }

      winston.info(`Report sent successfully`);
      return "Report sent successfully";
    } catch (e) {
      winston.error(e);
      return e;
    }
  }
}
