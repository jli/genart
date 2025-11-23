// SPDX-FileCopyrightText: Copyright (c) 2025 Tim C for Adafruit Industries
// SPDX-License-Identifier: MIT

// Global variables
let port;
let reader;
let writer;
let readTimeout;
let keepReading = false;
let decoder = new TextDecoder();
let lineBuffer = '';

// DOM Elements

const clearButton = document.getElementById('clear-button');
const statusDisplay = document.getElementById('status');
const serialLog = document.getElementById('serial-log');
const dataPoint = document.getElementById('data-point');
const cieXDisplay = document.getElementById('cie-x');
const cieYDisplay = document.getElementById('cie-y');
const luxDisplay = document.getElementById('lux');
const cctDisplay = document.getElementById('cct');
const colorSample = document.getElementById('color-sample');
const debugCoordinates = document.getElementById('debug-coordinates');

// Add a test plotting function
function testPlotPoint() {
  // Test with fixed values at 25%, 50%, and 75% across the CIE diagram
  const testPoints = [
    { x: 0.2, y: 0.3, label: "Test point 1 (0.2, 0.3)" },
    { x: 0.4, y: 0.45, label: "Test point 2 (0.4, 0.45)" },
    { x: 0.6, y: 0.6, label: "Test point 3 (0.6, 0.6)" }
  ];

  // Get next test point (rotate through them)
  const currentTest = parseInt(localStorage.getItem('currentTestPoint') || '0');
  const nextTest = (currentTest + 1) % testPoints.length;
  localStorage.setItem('currentTestPoint', nextTest);

  const testPoint = testPoints[nextTest];

  // Update the data displays
  cieXDisplay.textContent = testPoint.x.toFixed(6);
  cieYDisplay.textContent = testPoint.y.toFixed(6);

  // Call the plot function
  updateCIEPlot(testPoint.x, testPoint.y);

  // Show test information
  addToLog(`Testing point: ${testPoint.label}`, 'status');
  debugCoordinates.textContent = `TEST MODE: ${testPoint.label}`;
}

clearButton.addEventListener('click', clearLog);

let ws = new WebSocket('ws://' + location.host + '/connect-websocket');

ws.onopen = () => {
  console.log('WebSocket connection opened');
  statusDisplay.innerText = "Connected";
}

ws.onclose = () => {
  console.log('WebSocket connection closed');
  statusDisplay.innerText = "Not Connected";
  hideDataPoint();
}

ws.onmessage = ws_onmessage;
ws.onerror = error => console.log(error);


function ws_onmessage(event){
  processSerialData(event.data)
}


// Process data received from MCU
function processSerialData(data) {
  // Add received data to the buffer
  lineBuffer += data;

  // Process complete lines
  let lineEnd;
  while ((lineEnd = lineBuffer.indexOf('\n')) !== -1) {
    const line = lineBuffer.substring(0, lineEnd).trim();
    lineBuffer = lineBuffer.substring(lineEnd + 1);

    if (line) {
      addToLog(line);
      parseDataFromLine(line);
    }
  }
}

// Parse data from a line received from MCU
function parseDataFromLine(line) {
  // Log the raw line
  console.log("Data received:", line);

  // Look for CIE x value
  const cieXMatch = line.match(/CIE x: ([\d.]+)/);
  if (cieXMatch) {
    const cieX = parseFloat(cieXMatch[1]);
    cieXDisplay.textContent = cieX.toFixed(6);
    console.log("Found CIE x:", cieX);

    // If we have a y value already stored in the display
    const cieYStr = cieYDisplay.textContent;
    if (cieYStr !== '-') {
      const cieY = parseFloat(cieYStr);
      console.log("Using existing CIE y:", cieY);
      if (!isNaN(cieY)) {
        // Update the plot with the current x,y pair
        updateCIEPlot(cieX, cieY);
      }
    }
  }

  // Look for CIE y value
  const cieYMatch = line.match(/CIE y: ([\d.]+)/);
  if (cieYMatch) {
    const cieY = parseFloat(cieYMatch[1]);
    cieYDisplay.textContent = cieY.toFixed(6);
    console.log("Found CIE y:", cieY);

    // If we have an x value already stored in the display
    const cieXStr = cieXDisplay.textContent;
    if (cieXStr !== '-' && cieXMatch === null) {  // Only use stored x if not found on this line
      const cieX = parseFloat(cieXStr);
      console.log("Using existing CIE x:", cieX);
      if (!isNaN(cieX)) {
        // Update the plot with the current x,y pair
        updateCIEPlot(cieX, cieY);
      }
    }
  }

  // Look for Lux value
  const luxMatch = line.match(/Lux: ([\d.]+)/);
  if (luxMatch) {
    const lux = parseFloat(luxMatch[1]);
    luxDisplay.textContent = lux.toFixed(2);
    console.log("Found Lux:", lux);
  }

  // Look for Color Temperature value
  const cctMatch = line.match(/Color Temperature: ([\d.]+)/);
  if (cctMatch) {
    const cct = parseFloat(cctMatch[1]);
    cctDisplay.textContent = cct.toFixed(0);
    console.log("Found CCT:", cct);

    // If we have both x and y values by now, let's try to update the plot again
    const cieXStr = cieXDisplay.textContent;
    const cieYStr = cieYDisplay.textContent;
    if (cieXStr !== '-' && cieYStr !== '-') {
      const cieX = parseFloat(cieXStr);
      const cieY = parseFloat(cieYStr);
      if (!isNaN(cieX) && !isNaN(cieY)) {
        // Final attempt to update plot
        updateCIEPlot(cieX, cieY);
        console.log("Updating plot after CCT with:", cieX, cieY);
      }
    }
  }
}

// Initialize debug coordinates
document.addEventListener('DOMContentLoaded', function() {
  debugCoordinates.textContent = 'Waiting for color data...';
});

// Update the CIE plot with new data point
function updateCIEPlot(x, y) {
  console.log(`Plotting CIE coordinates: x=${x}, y=${y}`); // Debug log

  // Get the dimensions of the CIE diagram container
  const cieDiagram = document.getElementById('cie-diagram');

  // Ensure we're only working with valid x,y coordinates
  if (isNaN(x) || isNaN(y) || x < 0 || y < 0 || x > 1 || y > 1) {
    console.warn(`Invalid CIE coordinates: x=${x}, y=${y}`);
    debugCoordinates.textContent = `Invalid coordinates: x=${x}, y=${y}`;
    return;
  }

  // Adjust coordinates to fit the visible area of the CIE diagram
  // CIE diagram typically has coordinates: x [0-0.8], y [0-0.9]
  const xMax = 0.8;
  const yMax = 0.9;

  // Get actual dimensions of the CIE diagram image
  const cieImage = document.querySelector('#cie-diagram img');
  const imgWidth = cieImage.clientWidth;
  const imgHeight = cieImage.clientHeight;

  // Calculate percentage positions within the SVG viewBox
  const xPercent = (x / xMax) * 100; // Scale to percentage of max x (0.8)
  const yPercent = (1 - (y / yMax)) * 100; // Invert y-axis and scale to percentage of max y (0.9)

  console.log(`Plotting at: left=${xPercent}%, top=${yPercent}%`); // Debug log

  // Set the data point position
  dataPoint.style.left = `${xPercent}%`;
  dataPoint.style.top = `${yPercent}%`;
  dataPoint.style.display = 'block';

  // Show debug coordinates for troubleshooting
  debugCoordinates.textContent = `CIE: (${x.toFixed(4)}, ${y.toFixed(4)}) → Position: (${Math.round(xPercent)}%, ${Math.round(yPercent)}%)`;

  // Update the color sample with an approximate RGB color
  updateColorSample(x, y);
}

// Convert CIE XYZ to RGB for color approximation
function updateColorSample(x, y) {
  // Calculate XYZ from xyY (assuming Y=1 for relative luminance)
  const Y = 1.0;
  const X = (x * Y) / y;
  const Z = ((1 - x - y) * Y) / y;

  // XYZ to RGB conversion (sRGB)
  // Using the standard D65 transformation matrix
  let r = X * 3.2406 - Y * 1.5372 - Z * 0.4986;
  let g = -X * 0.9689 + Y * 1.8758 + Z * 0.0415;
  let b = X * 0.0557 - Y * 0.2040 + Z * 1.0570;

  // Apply gamma correction
  r = r <= 0.0031308 ? 12.92 * r : 1.055 * Math.pow(r, 1/2.4) - 0.055;
  g = g <= 0.0031308 ? 12.92 * g : 1.055 * Math.pow(g, 1/2.4) - 0.055;
  b = b <= 0.0031308 ? 12.92 * b : 1.055 * Math.pow(b, 1/2.4) - 0.055;

  // Clamp RGB values between 0 and 1
  r = Math.min(Math.max(0, r), 1);
  g = Math.min(Math.max(0, g), 1);
  b = Math.min(Math.max(0, b), 1);

  // Convert to 8-bit color values
  const ri = Math.round(r * 255);
  const gi = Math.round(g * 255);
  const bi = Math.round(b * 255);

  // Set the background color of the sample
  colorSample.style.backgroundColor = `rgb(${ri}, ${gi}, ${bi})`;
}

// Hide the data point and reset all displays
function hideDataPoint() {
  dataPoint.style.display = 'none';
  debugCoordinates.textContent = 'Waiting for color data...';
  cieXDisplay.textContent = '-';
  cieYDisplay.textContent = '-';
  luxDisplay.textContent = '-';
  cctDisplay.textContent = '-';
  colorSample.style.backgroundColor = 'transparent';
}

// Add a message to the serial log
function addToLog(message, type = 'data') {
  const entry = document.createElement('div');
  entry.textContent = message;
  entry.className = `log-entry ${type}`;
  serialLog.appendChild(entry);
  serialLog.scrollTop = serialLog.scrollHeight;
}

// Clear the serial log
function clearLog() {
  serialLog.innerHTML = '';
}
