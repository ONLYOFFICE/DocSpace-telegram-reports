import * as nconf from "nconf";
import * as path from "path";

import "./config.json";

nconf.argv().env().file("config", path.join(__dirname, "config.json"));

export default nconf;
