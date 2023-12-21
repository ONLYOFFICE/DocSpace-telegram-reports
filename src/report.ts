import { NullableMappedPosition } from "source-map";

interface Report {
  description: string;
  errorMessage: string;
  errorStack: string;
  errors: NullableMappedPosition[];
  language: string;
  localStorage: string;
  platform: string;
  reportTime: string;
  url: string;
  userAgent: string;
  userId: string;
  version: string;
}

export default Report;
