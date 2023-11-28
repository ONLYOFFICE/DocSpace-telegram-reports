import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
  onChildAdded,
  query,
  limitToLast,
} from "firebase/database";
//import { getAuth, signInAnonymously } from "firebase/auth";

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./src/app/app.module";
import { AppService } from "./src/app/app.service";
import Report from "src/report";

import config from "./config";
const IO = "io";
const COM = "com";

const winston = require("./src/log.js");

const firebaseConfig = config.get("firebase");



// Initialize Firebase apps
const fbIOApp = initializeApp(firebaseConfig[IO], IO);
const fbCOMApp = initializeApp(firebaseConfig[COM], COM);

const connect = (
  fbApp: any,
  type: string,
  callback: (value: Report) => void
) => {
  const db = getDatabase(fbApp);

  const connectedRef = ref(db, ".info/connected");
  onValue(connectedRef, (snap) => {
    if (snap.val() !== true) {
      winston.info(`FB ${type}: not connected`);
      return;
    }

    winston.info(`FB ${type}: connected`);

    const reportsRef = ref(db, "reports");
    const recentQuery = query(reportsRef, limitToLast(1));

    winston.info(`FB ${type}: start listening on child added`, {
      reportsRef,
    });

    let first = true;
    let index = 0;

    onChildAdded(recentQuery, (data) => {
      if (first) {
        first = false;
        return;
      } // skip first element
      index++;
      const value = data.val() as Report;
      winston.info(
        `FB ${type}: NEW ${type} REPORT #${index} message: ${value?.errorMessage}`
      );
      callback(value);
    });
  });
};

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const appService = app.get(AppService);

    winston.info(`Start TelegramReports Service`);

    connect(fbIOApp, IO, (report) => {
      appService.sendMessage(report, IO); //`REPORT ${IO}: ${report}`);
    });

    connect(fbCOMApp, COM, (report) => {
      appService.sendMessage(report, COM); // `REPORT ${COM}: ${report}`);
    });
  } catch (e) {
    winston.error(e);
  }
}

bootstrap();
