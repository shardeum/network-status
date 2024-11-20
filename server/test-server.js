const express = require('express');
const app = express();

// Simulate service responses
app.get('/nodelist', (req, res) => {
  res.json({
    nodeList: [{}, {}],
    sign: {
      owner: "64a3833499130406550729ab20f6bec351d04ec9be3e5f0144d54f01d4d18c45"
    }
  });
});

app.post('/rpc', (req, res) => {
  res.json({
    jsonrpc: "2.0",
    id: 73,
    result: "0x1234"
  });
});

app.get('/explorer', (req, res) => {
  res.send("The Shardeum Betanet Explorer");
});

app.get('/website', (req, res) => {
  res.send("Shardeum | EVM based Sharded Layer 1 Blockchain");
});

app.get('/docs', (req, res) => {
  res.send("Shardeum is a scalable, secure, and efficient blockchain platform that enables developers to build and deploy decentralized applications. Dive into our documentation to learn more about Shardeum and how to get started with the network");
});

app.get('/is-healthy', (req, res) => {
  res.json({ health: true });
});

const port = 3001;
app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});