import Report from "./report";

interface IMessage {
  report: Report;
  zone: string;
  key: string;
}

class Message implements IMessage {
  report: Report;
  zone: string;
  key: string;

  /**
   * Message data for telegram
   */
  constructor(key: string, report: Report, zone: string) {
    this.report = report;
    this.zone = zone.toUpperCase();
    this.key = key;
  }
}

export default Message;
