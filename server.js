const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const APPOINTMENTS_FILE = path.join(DATA_DIR, "appointments.json");

const SERVICES = [
  { id: "cut", name: "Haircut", duration: "30 min", price: 1200 },
  { id: "color", name: "Color & Style", duration: "90 min", price: 4500 },
  { id: "beard", name: "Beard Trim", duration: "20 min", price: 800 },
  { id: "spa", name: "Scalp Spa", duration: "45 min", price: 2500 },
];

function log(msg) {
  const now = new Date().toISOString();
  console.log(`[${now}] ${msg}`);
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(APPOINTMENTS_FILE)) {
    fs.writeFileSync(APPOINTMENTS_FILE, "[]", "utf8");
  }
}

function loadAppointments() {
  try {
    const raw = fs.readFileSync(APPOINTMENTS_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    log(`Error loading appointments: ${err.message}`);
    return [];
  }
}

function saveAppointments(list) {
  try {
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    log(`Error saving appointments: ${err.message}`);
  }
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function send404(res) {
  const filePath = path.join(PUBLIC_DIR, "404.html");
  if (fs.existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html": return "text/html; charset=utf-8";
    case ".css": return "text/css; charset=utf-8";
    case ".js": return "application/javascript; charset=utf-8";
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".svg": return "image/svg+xml";
    case ".ico": return "image/x-icon";
    default: return "application/octet-stream";
  }
}

function serveStatic(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    let pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    
    // Safety check for path traversal
    const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(PUBLIC_DIR, safePath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        log(`404: ${pathname}`);
        send404(res);
        return;
      }
      res.writeHead(200, { "Content-Type": getContentType(filePath) });
      res.end(data);
    });
  } catch (err) {
    log(`Error serving static: ${err.message}`);
    send404(res);
  }
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (err) {
        reject(err);
      }
    });
  });
}

function handleApi(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    
    if (url.pathname === "/api/services" && req.method === "GET") {
      sendJson(res, 200, { services: SERVICES });
      return;
    }

    if (url.pathname === "/api/appointments" && req.method === "GET") {
      const appointments = loadAppointments();
      sendJson(res, 200, { appointments });
      return;
    }

    if (url.pathname === "/api/appointments" && req.method === "POST") {
      parseJsonBody(req)
        .then((payload) => {
          const { name, phone, serviceId, date, time, notes } = payload;
          
          if (!name || !phone || !serviceId || !date || !time) {
            sendJson(res, 400, { error: "Missing required fields" });
            return;
          }

          // Basic date validation (don't allow past dates)
          const appointmentDate = new Date(`${date}T${time}`);
          if (appointmentDate < new Date()) {
            sendJson(res, 400, { error: "Cannot book appointments in the past" });
            return;
          }

          const service = SERVICES.find((s) => s.id === serviceId);
          if (!service) {
            sendJson(res, 400, { error: "Invalid service" });
            return;
          }

          const appointments = loadAppointments();
          const appointment = {
            id: `A-${Date.now()}`,
            name,
            phone,
            serviceId,
            serviceName: service.name,
            date,
            time,
            notes: notes || "",
            status: "pending",
            createdAt: new Date().toISOString(),
          };

          appointments.push(appointment);
          saveAppointments(appointments);
          log(`New appointment: ${appointment.id} for ${name}`);
          sendJson(res, 201, { appointment });
        })
        .catch((err) => {
          log(`POST /api/appointments error: ${err.message}`);
          sendJson(res, 400, { error: "Invalid JSON payload" });
        });
      return;
    }

    sendJson(res, 404, { error: "API endpoint not found" });
  } catch (err) {
    log(`API Error: ${err.message}`);
    sendJson(res, 500, { error: "Internal server error" });
  }
}

ensureDataDir();

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res);
  } else {
    serveStatic(req, res);
  }
});

server.listen(PORT, () => {
  log(`Salon appointment server running on http://localhost:${PORT}`);
});

