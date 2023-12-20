import { SourceMapConsumer } from "source-map";

const parseStackTrace = async (stackTrace: string) => {
  let errorStack = stackTrace.split(/\n/g);
  const errorText = errorStack.shift(); // error message

  //console.log("Top error:", errorText);

  let errors = [];
  let sourceFile = null;

  if (errorText.length === 0) return null;

  // Process each line in the error stack
  for (const line of errorStack) {
    let matchArray = line.match(/\bhttps?:\/\/\S+/gi);

    if (matchArray === null) continue;

    const url = matchArray[0].replace(")", "");

    const splittedUrl = new URL(url);
    let fullName = splittedUrl.pathname.split("/").pop() || "";

    // Extract row and column numbers from the URL
    const [filename, rowStr, colStr] = fullName.split(":");
    const row = parseInt(rowStr, 10);
    const col = parseInt(colStr, 10);

    if (filename && !isNaN(row) && !isNaN(col)) {
      // Push the parsed trace into the list
      const error = {
        filename: splittedUrl.origin + splittedUrl.pathname,
        line: row,
        column: col,
      };

      errors.push(error);

      if (!sourceFile) {
        sourceFile = error.filename.split(".js").shift();
      }
    }
  }

  //console.log(errors);

  if (errors.length === 0 || sourceFile === null) return null;

  const response = await fetch(`${sourceFile}.js.map`);
  const conf = await response.json();

  const result = await SourceMapConsumer.with(conf, null, async (consumer) => {
    const errorSource = errors
      .map((error) => consumer.originalPositionFor(error))
      .filter((r) => r.source != null);

    return errorSource;
  });

  //console.log(result);

  return result;
};

export { parseStackTrace };
