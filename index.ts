import admin from "firebase-admin";

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./src/app/app.module";
import { AppService } from "./src/app/app.service";
import Report from "src/report";
import Message from "src/message";
import config from "./config";
import { parseStackTrace } from "src/utils";

const winston = require("./src/log.js");
const firebaseConfig = config.get("firebase");
const IO = "io";
const COM = "com";

const listen = (fbApp: admin.app.App, appService: AppService): void => {
  var queryRef = fbApp.database().ref("reports").limitToLast(1);
  let first = true;
  let index = 0;

  // Retrieve new reports as they are added to our database
  queryRef.on("child_added", (snapshot: admin.database.DataSnapshot) => {
    try {
      if (first) {
        first = false;
        return;
      } // skip first element

      index++;

      const newReport = snapshot.val() as Report;

      winston.info(
        `FB ${fbApp.name}: NEW REPORT #${index} key:'${snapshot.ref.key}' message: ${newReport?.errorMessage}`
      );

      parseStackTrace(newReport.errorStack)
        .then((errors) => {
          if (errors) {
            newReport.errors = errors;
          }
        })
        .catch((e) => {
          winston.error("parseStackTrace error", e);
        })
        .finally(() => {
          const m = new Message(snapshot.ref.key, newReport, fbApp.name);

          appService.sendMessage(m);
        });
    } catch (e) {
      winston.error(e);
    }
  });
};

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const appService = app.get(AppService);

    winston.info(`Start TelegramReports Service`);

    winston.info(`Start listen ${IO}`);

    const fbIOaccount = firebaseConfig[IO];

    const ioApp = admin.initializeApp(
      {
        credential: admin.credential.cert(fbIOaccount["serviceAccount"]),
        databaseURL: fbIOaccount["databaseURL"],
      },
      IO
    );

    listen(ioApp, appService);

    winston.info(`Start listen ${COM}`);

    const fbCOMaccount = firebaseConfig[COM];

    const comApp = admin.initializeApp(
      {
        credential: admin.credential.cert(fbCOMaccount["serviceAccount"]),
        databaseURL: fbCOMaccount["databaseURL"],
      },
      COM
    );

    listen(comApp, appService);
  } catch (e) {
    winston.error(e);
  }
}

bootstrap();
