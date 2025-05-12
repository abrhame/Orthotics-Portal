const express = require("express");
const path = require("path");
const app = express();
const port = 3000;

// Serve static files from the static directory
app.use("/static", express.static(path.join(__dirname, "static")));

// Log requests to the server
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Start the server
app.listen(port, () => {
  console.log(`Static file server running at http://localhost:${port}`);
  console.log(`Serving static files from: ${path.join(__dirname, "static")}`);
});
