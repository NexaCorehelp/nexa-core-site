// admin-password-api.js
// Node.js Express API for admin password validation using MongoDB

const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Replace with your actual MongoDB connection string
const MONGO_URI = 'mongodb+srv://nexacorehelp_db_user:G4wqGO0Gu46E64gB@cluster0nexalicenses.xrjoj6d.mongodb.net/?appName=Cluster0nexaLicenses';
const DB_NAME = 'admin'; // Change to your actual database name
const COLLECTION_NAME = 'passwords'; // Change to your actual collection name

app.use(cors());
app.use(express.json());

// Example password document: { password: 'yourpassword' }
app.get('/api/check-admin-password', async (req, res) => {
  const password = req.query.password;
  const discordId = req.query.discordId;
  if (!password || !discordId) {
    return res.status(400).json({ valid: false, error: 'Missing password or discordId' });
  }
  let client;
  try {
    client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    // Find password and discordId in collection
    const found = await collection.findOne({ password, discordId });
    if (found) {
      res.json({ valid: true });
    } else {
      res.json({ valid: false });
    }
  } catch (err) {
    res.status(500).json({ valid: false, error: 'Database error' });
  } finally {
    if (client) await client.close();
  }
});

app.listen(PORT, () => {
  console.log(`Admin password API running on port ${PORT}`);
});
