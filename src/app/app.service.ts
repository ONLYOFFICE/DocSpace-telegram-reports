import { Injectable } from "@nestjs/common";
import { Telegraf } from "telegraf";

import config from "../../config";
import Report from "src/report";

const winston = require("../log.js");

const { botKey, chatId } = config.get("app");

winston.info({botKey, chatId})

const MAX_LENGTH = 4096; //TG Limit

@Injectable()
export class AppService {
  bot = new Telegraf(botKey);

  chunkMessage = (str: string, size: number): Array<string> =>
    Array.from({ length: Math.ceil(str.length / size) }, (_, i) =>
      str.slice(i * size, i * size + size),
    );

  async sendMessage(report: Report, source: string): Promise<string> {
    if (!botKey) throw new Error("Empty bot key");
    if (!chatId) throw new Error("Empty chat ID");

    const message = `DocSpace client ${source.toUpperCase()}: new bug report:\n` + JSON.stringify(report, null, "\t");

    try {
      if (message.length > MAX_LENGTH) {
        for (const part of this.chunkMessage(message, MAX_LENGTH)) {
          await this.bot.telegram.sendMessage(chatId, part);
        }
      } else {
        await this.bot.telegram.sendMessage(chatId, message);
      }

      winston.info(`Report sent successfully`, message);
      return "Report sent successfully"
    } catch (e) {
      winston.error(e);
      return e;
    }
  }
}
