const http = require("http");
const fs = require("fs");
const path = require("path");

const PROGRESS_PATH = path.resolve(__dirname, "../../PROGRESS.md");
const HTML_PATH = path.join(__dirname, "index.html");
const PORT = process.env.PORT || 3456;

let sseClients = [];

function broadcast() {
  let content = "";
  try {
    content = fs.readFileSync(PROGRESS_PATH, "utf-8");
  } catch {
    content = "# No PROGRESS.md found";
  }
  const data = JSON.stringify({ content, ts: Date.now() });
  sseClients = sseClients.filter((res) => {
    try {
      res.write(`data: ${data}\n\n`);
      return true;
    } catch {
      return false;
    }
  });
}

// Watch PROGRESS.md for changes
let debounce = null;
function startWatching() {
  try {
    fs.watch(PROGRESS_PATH, () => {
      clearTimeout(debounce);
      debounce = setTimeout(broadcast, 200);
    });
  } catch {
    // File might not exist yet — poll for it
    const poll = setInterval(() => {
      if (fs.existsSync(PROGRESS_PATH)) {
        clearInterval(poll);
        startWatching();
        broadcast();
      }
    }, 1000);
  }
}
startWatching();

const server = http.createServer((req, res) => {
  if (req.url === "/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });
    sseClients.push(res);
    broadcast(); // send current state immediately
    req.on("close", () => {
      sseClients = sseClients.filter((c) => c !== res);
    });
    return;
  }

  // Serve the HTML page for everything else
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(fs.readFileSync(HTML_PATH, "utf-8"));
});

server.listen(PORT, () => {
  console.log(`Progress monitor → http://localhost:${PORT}`);
});
