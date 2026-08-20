import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { calculateJobCost } from './src/utils/priceCalculator';
import { INITIAL_SHOPKEEPERS } from './src/utils/shopStore';
import { Shopkeeper, PrintJob, PrintSettings } from './src/types';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3001;
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(__dirname, 'db.json');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-Memory Database initialized from db.json or defaults
let db: {
  shops: Shopkeeper[];
  jobs: PrintJob[];
} = {
  shops: [],
  jobs: []
};

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(data);
      console.log('Database loaded successfully.');
    } else {
      db.shops = INITIAL_SHOPKEEPERS;
      db.jobs = [];
      saveDb();
    }
  } catch (err) {
    console.error('Error loading database:', err);
    db.shops = INITIAL_SHOPKEEPERS;
    db.jobs = [];
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

loadDb();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.txt', '.xls', '.xlsx', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format'));
    }
  }
});

// Serve static uploaded files only through secure authenticated/tokenized route
app.get('/api/files/download/:jobId', (req, res) => {
  const { jobId } = req.params;
  const { token } = req.query;

  const job = db.jobs.find(j => j.id === jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Basic security: require correct file/job ID and token (we can use the job's pickup pin or a security token)
  const expectedToken = job.pickupPin; // Use pickup PIN as download token
  if (!token || token !== expectedToken) {
    return res.status(443).json({ error: 'Unauthorized access to document' });
  }

  const filePath = path.join(UPLOADS_DIR, job.file.id);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File no longer exists on server' });
  }

  res.download(filePath, job.file.name);
});

// API Endpoint: File Upload
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({
    fileId: req.file.filename,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    fileType: req.file.mimetype
  });
});

// API Endpoint: Get all shops
app.get('/api/shops', (req, res) => {
  res.json(db.shops);
});

// API Endpoint: Get specific shop config
app.get('/api/shops/:id', (req, res) => {
  const shop = db.shops.find(s => s.id === req.params.id);
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found' });
  }
  res.json(shop);
});

// API Endpoint: Update shop config
app.put('/api/shops/:id', (req, res) => {
  const { id } = req.params;
  const shopIndex = db.shops.findIndex(s => s.id === id);
  if (shopIndex === -1) {
    return res.status(404).json({ error: 'Shop not found' });
  }
  db.shops[shopIndex] = { ...db.shops[shopIndex], ...req.body };
  saveDb();

  // Notify all connected shopkeeper clients about config changes
  broadcastToShop(id, { type: 'SHOP_UPDATED', shop: db.shops[shopIndex] });

  res.json(db.shops[shopIndex]);
});

// API Endpoint: Add a new shop
app.post('/api/shops', (req, res) => {
  const newShop = req.body;
  if (!newShop.id) {
    return res.status(400).json({ error: 'Missing shop ID' });
  }
  db.shops.push(newShop);
  saveDb();
  res.status(201).json(newShop);
});

// API Endpoint: Delete a shop
app.delete('/api/shops/:id', (req, res) => {
  db.shops = db.shops.filter(s => s.id !== req.params.id);
  saveDb();
  res.json({ success: true });
});

// API Endpoint: Calculate pricing (validates client inputs)
app.post('/api/jobs/calculate-price', (req, res) => {
  const { settings, pageCount, shopId } = req.body;
  const shop = db.shops.find(s => s.id === shopId);
  if (!shop) {
    return res.status(404).json({ error: 'Shop pricing configuration not found' });
  }

  const costResult = calculateJobCost(settings, pageCount, shop.pricingConfig);
  res.json(costResult);
});

// API Endpoint: Create a print job (with backend validation)
app.post('/api/jobs', (req, res) => {
  const { shopId, stationId, file, settings } = req.body;
  
  const shop = db.shops.find(s => s.id === shopId);
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found' });
  }
  const station = shop.stations.find(st => st.id === stationId) || shop.stations[0];

  // Perform Server-Side Price and Page validation
  const calculatedCost = calculateJobCost(settings, file.pageCount, shop.pricingConfig);

  const jobId = 'job-' + Date.now();
  const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
  const pickupPin = Math.floor(1000 + Math.random() * 9000).toString();

  const newJob: PrintJob = {
    id: jobId,
    orderNumber,
    shopId,
    shopName: shop.name,
    stationId: station.id,
    stationName: station.name,
    file, // Contains backend fileId in `file.id`
    settings,
    calculatedPages: calculatedCost.calculatedPages,
    sheetsNeeded: calculatedCost.sheetsNeeded,
    pricing: calculatedCost.pricing,
    status: 'pending_payment',
    printProgress: 0,
    createdAt: Date.now(),
    pickupPin,
  };

  db.jobs.unshift(newJob);
  saveDb();

  // Notify connected shopkeeper that a pending job is created
  broadcastToShop(shopId, { type: 'JOB_CREATED', job: newJob });

  res.status(201).json(newJob);
});

// API Endpoint: Simulate payment completion
app.post('/api/jobs/:id/pay', (req, res) => {
  const { id } = req.params;
  const { paymentMethod } = req.body;

  const jobIndex = db.jobs.findIndex(j => j.id === id);
  if (jobIndex === -1) {
    return res.status(404).json({ error: 'Print job not found' });
  }

  const job = db.jobs[jobIndex];
  
  // Update state to paid / spooling
  job.status = 'spooling';
  job.printProgress = 5;
  job.payment = {
    method: paymentMethod || 'upi',
    transactionId: 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    paidAt: Date.now(),
    amount: job.pricing.total
  };

  saveDb();

  // Broadcast job state update
  broadcastJobUpdate(job);

  // Dispatch the job to the connected Print Agent immediately
  dispatchJobToAgent(job);

  res.json(job);
});

// API Endpoint: Update job details/status
app.put('/api/jobs/:id', (req, res) => {
  const { id } = req.params;
  const { status, printProgress } = req.body;
  const jobIndex = db.jobs.findIndex(j => j.id === id);
  if (jobIndex === -1) {
    return res.status(404).json({ error: 'Job not found' });
  }
  const job = db.jobs[jobIndex];
  if (status !== undefined) job.status = status;
  if (printProgress !== undefined) job.printProgress = printProgress;
  saveDb();
  broadcastJobUpdate(job);
  res.json(job);
});

// API Endpoint: Get job status
app.get('/api/jobs/:id', (req, res) => {
  const job = db.jobs.find(j => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

// API Endpoint: Get all jobs for a shop
app.get('/api/shops/:shopId/jobs', (req, res) => {
  const { shopId } = req.params;
  const jobs = db.jobs.filter(j => j.shopId === shopId);
  res.json(jobs);
});

// WebSocket Server Integration logic
const clients = new Map<string, WebSocket>(); // Connection ID -> WebSocket
const clientSubscriptions = new Map<string, Set<string>>(); // Subscription Type (jobId/shopId) -> Set of Connection IDs
const printAgents = new Map<string, { socket: WebSocket; shopId: string; stationId: string }>(); // connectionId -> agent info

// Helper to generate unique ID
let connectionSeq = 0;

wss.on('connection', (ws: WebSocket) => {
  const connectionId = 'conn-' + (++connectionSeq);
  clients.set(connectionId, ws);
  console.log(`WebSocket client connected: ${connectionId}`);

  ws.on('message', (messageString: string) => {
    try {
      const message = JSON.parse(messageString);
      console.log(`Received WS message from ${connectionId}:`, message);

      switch (message.type) {
        case 'SUBSCRIBE': {
          // Subscribe to job status updates
          const { jobId } = message;
          if (jobId) {
            subscribe(connectionId, `job:${jobId}`);
          }
          break;
        }
        case 'SUBSCRIBE_SHOP': {
          // Subscribe to shop queue updates
          const { shopId } = message;
          if (shopId) {
            subscribe(connectionId, `shop:${shopId}`);
          }
          break;
        }
        case 'REGISTER_AGENT': {
          // Register as print agent
          const { shopId, stationId } = message;
          if (shopId && stationId) {
            printAgents.set(connectionId, { socket: ws, shopId, stationId });
            console.log(`Print Agent registered: shop=${shopId}, station=${stationId} (${connectionId})`);
            ws.send(JSON.stringify({ type: 'AGENT_ONLINE', shopId, stationId }));
            
            // Auto-dispatch any existing pending "spooling" or "paid" jobs for this station
            const pendingJobs = db.jobs.filter(j => j.shopId === shopId && j.stationId === stationId && (j.status === 'spooling' || j.status === 'paid'));
            pendingJobs.forEach(job => {
              ws.send(JSON.stringify({
                type: 'PRINT_JOB',
                job: {
                  id: job.id,
                  orderNumber: job.orderNumber,
                  file_url: `http://localhost:${PORT}/api/files/download/${job.id}?token=${job.pickupPin}`,
                  copies: job.settings.copies,
                  paperSize: job.settings.paperSize,
                  colorMode: job.settings.colorMode,
                  duplex: job.settings.duplex,
                  sheetsNeeded: job.sheetsNeeded,
                  fileName: job.file.name
                }
              }));
            });
          }
          break;
        }
        case 'AGENT_STATUS_UPDATE': {
          // Progress report from Print Agent
          const { jobId, progress, status, statusText } = message;
          const agent = printAgents.get(connectionId);
          if (agent) {
            updateJobFromAgent(jobId, progress, status);
          }
          break;
        }
        default:
          console.warn('Unknown WebSocket message type:', message.type);
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(connectionId);
    printAgents.delete(connectionId);
    unsubscribeAll(connectionId);
    console.log(`WebSocket client disconnected: ${connectionId}`);
  });
});

// Subscribe helper
function subscribe(connId: string, topic: string) {
  if (!clientSubscriptions.has(topic)) {
    clientSubscriptions.set(topic, new Set());
  }
  clientSubscriptions.get(topic)!.add(connId);
}

// Unsubscribe helpers
function unsubscribeAll(connId: string) {
  for (const [topic, connIds] of clientSubscriptions.entries()) {
    connIds.delete(connId);
    if (connIds.size === 0) {
      clientSubscriptions.delete(topic);
    }
  }
}

// Broadcast message to a specific topic
function broadcastToTopic(topic: string, data: any) {
  const connIds = clientSubscriptions.get(topic);
  if (connIds) {
    const payload = JSON.stringify(data);
    connIds.forEach(connId => {
      const client = clients.get(connId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}

function broadcastToShop(shopId: string, data: any) {
  broadcastToTopic(`shop:${shopId}`, data);
}

function broadcastJobUpdate(job: PrintJob) {
  // Broadcast to customer subscribed to this job
  broadcastToTopic(`job:${job.id}`, { type: 'JOB_UPDATED', job });
  // Broadcast to shopkeeper subscribed to this shop
  broadcastToTopic(`shop:${job.shopId}`, { type: 'JOB_UPDATED', job });
}

// Dispatch job to registered Print Agent
function dispatchJobToAgent(job: PrintJob) {
  let dispatched = false;
  for (const [connId, agent] of printAgents.entries()) {
    if (agent.shopId === job.shopId && agent.stationId === job.stationId) {
      if (agent.socket.readyState === WebSocket.OPEN) {
        agent.socket.send(JSON.stringify({
          type: 'PRINT_JOB',
          job: {
            id: job.id,
            orderNumber: job.orderNumber,
            file_url: `http://localhost:${PORT}/api/files/download/${job.id}?token=${job.pickupPin}`,
            copies: job.settings.copies,
            paperSize: job.settings.paperSize,
            colorMode: job.settings.colorMode,
            duplex: job.settings.duplex,
            sheetsNeeded: job.sheetsNeeded,
            fileName: job.file.name
          }
        }));
        dispatched = true;
        console.log(`Dispatched Job ${job.id} to Print Agent ${connId}`);
      }
    }
  }
  if (!dispatched) {
    console.log(`No active Print Agent online for shop=${job.shopId}, station=${job.stationId}. Job queued.`);
  }
}

// Update job status received from Print Agent
function updateJobFromAgent(jobId: string, progress: number, status: PrintJob['status']) {
  const jobIndex = db.jobs.findIndex(j => j.id === jobId);
  if (jobIndex === -1) return;

  const job = db.jobs[jobIndex];
  job.printProgress = progress;
  job.status = status;
  
  saveDb();
  broadcastJobUpdate(job);

  // Auto clean file from uploads folder when completed
  if (status === 'completed' || status === 'ready') {
    cleanupJobFile(job);
  }
}

function cleanupJobFile(job: PrintJob) {
  const filePath = path.join(UPLOADS_DIR, job.file.id);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`Securely deleted completed job file: ${job.file.id}`);
    } catch (err) {
      console.error(`Failed to delete file ${job.file.id}:`, err);
    }
  }
}

// Periodic cleanup of orphaned uploads / jobs older than 30 mins
setInterval(() => {
  const expiryTime = Date.now() - 30 * 60 * 1000; // 30 minutes
  let changed = false;

  db.jobs.forEach(job => {
    // Delete files for jobs older than 30 minutes
    if (job.createdAt < expiryTime) {
      const filePath = path.join(UPLOADS_DIR, job.file.id);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Cron: Securely cleaned up expired job file: ${job.file.id}`);
        } catch (err) {
          console.error(`Cron: Failed to delete file ${job.file.id}:`, err);
        }
      }
    }
  });

  // Also clean any un-indexed files in uploads/ that are older than 30 mins
  fs.readdir(UPLOADS_DIR, (err, files) => {
    if (err) return;
    files.forEach(file => {
      const filePath = path.join(UPLOADS_DIR, file);
      fs.stat(filePath, (statErr, stats) => {
        if (statErr) return;
        if (stats.mtimeMs < expiryTime) {
          fs.unlink(filePath, () => {
            console.log(`Cron: Cleaned unindexed file: ${file}`);
          });
        }
      });
    });
  });

  if (changed) {
    saveDb();
  }
}, 5 * 60 * 1000); // Run every 5 minutes

// Upgrade HTTP Server to WebSocket
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Start full-stack server
server.listen(PORT, () => {
  console.log(`=== Backend Server Running on http://localhost:${PORT} ===`);
});
