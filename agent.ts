import WebSocket from 'ws';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
let shopId = 'shop-apex';
let stationId = 'station-1';

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--shop=')) {
    shopId = args[i].split('=')[1];
  } else if (args[i].startsWith('--station=')) {
    stationId = args[i].split('=')[1];
  }
}

const WS_URL = 'ws://localhost:3001/ws';
console.log(`=== Mock Print Agent Starting ===`);
console.log(`Connecting to: ${WS_URL}`);
console.log(`Configured for Shop: ${shopId}, Station: ${stationId}`);

let ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('Connected to print server. Registering agent...');
  ws.send(JSON.stringify({
    type: 'REGISTER_AGENT',
    shopId,
    stationId
  }));
});

ws.on('message', async (dataString: string) => {
  try {
    const data = JSON.parse(dataString);
    console.log('Received message from server:', data.type);

    if (data.type === 'AGENT_ONLINE') {
      console.log(`Agent active & online. Waiting for incoming paid print jobs...`);
    } else if (data.type === 'PRINT_JOB') {
      const { job } = data;
      console.log(`\n[NEW JOB RECEIVED] Order #${job.orderNumber} - JobID: ${job.id}`);
      console.log(`Document: ${job.fileName}`);
      console.log(`Settings: ${job.copies} copies, Size: ${job.paperSize}, Color: ${job.colorMode}, Duplex: ${job.duplex}`);
      console.log(`File download URL: ${job.file_url}`);

      // Simulate downloading the file securely
      await simulateDownload(job.file_url, job.fileName);

      // Run printing simulation
      await simulatePrinting(job);
    }
  } catch (err) {
    console.error('Error handling websocket message:', err);
  }
});

ws.on('close', () => {
  console.log('Connection closed. Retrying in 5 seconds...');
  setTimeout(() => {
    ws = new WebSocket(WS_URL);
  }, 5000);
});

ws.on('error', (err) => {
  console.error('WebSocket connection error:', err.message);
});

// Mock Download File
function simulateDownload(url: string, filename: string): Promise<void> {
  return new Promise((resolve) => {
    console.log(`Downloading "${filename}" secure proof...`);
    setTimeout(() => {
      console.log(`Download completed successfully. Saved to temp spool folder.`);
      resolve();
    }, 1500);
  });
}

// Mock Physical Printing Progression
async function simulatePrinting(job: any): Promise<void> {
  const totalSheets = job.sheetsNeeded;
  console.log(`Spooling data to physical print engine (${totalSheets} sheets)...`);

  // Report: Spooling started
  sendStatusUpdate(job.id, 10, 'spooling', 'Preparing document pages & vector rasterizer...');
  await sleep(1500);

  // Report: Printing starts
  sendStatusUpdate(job.id, 25, 'printing', `Warming laser fuser & feeding sheet 1 of ${totalSheets}...`);
  await sleep(1500);

  // Print each sheet
  for (let sheet = 1; sheet <= totalSheets; sheet++) {
    const progress = Math.round(25 + (sheet / totalSheets) * 65);
    sendStatusUpdate(job.id, progress, 'printing', `Printing sheet ${sheet} of ${totalSheets} (${job.colorMode === 'bw' ? 'Monochrome' : 'CMYK Color'})...`);
    await sleep(2000); // 2 seconds per sheet
  }

  // Finishing print job
  sendStatusUpdate(job.id, 95, 'printing', 'Finishing tray output & validating print quality...');
  await sleep(1000);

  // Report: Print job completed
  sendStatusUpdate(job.id, 100, 'ready', 'Printing completed! Please collect your document from the counter.');
  console.log(`[JOB COMPLETED] Order #${job.orderNumber} successfully printed.`);
}

function sendStatusUpdate(jobId: string, progress: number, status: string, statusText: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'AGENT_STATUS_UPDATE',
      jobId,
      progress,
      status,
      statusText
    }));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
