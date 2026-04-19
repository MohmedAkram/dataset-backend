const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

db.connect((err) => {
  if (err) {
    console.log("DB ERROR:", err);
  } else {
    console.log("Connected to Aiven MySQL");
  }
});

app.post("/users", (req, res) => {
  const { email, username, gender, birthdate, age, country } = req.body;

  const sql = `
    INSERT INTO users (Email, Username, Gender, Birthdate, Age, Country)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [email, username, gender, birthdate, age, country], (err) => {
    if (err) return res.json(err);
    res.json({ message: "User registered" });
  });
});

app.post("/usage", (req, res) => {
  const { userEmail, datasetId, projectName, projectCategory } = req.body;

  const sql = `
    INSERT INTO datasetusage (ProjectName, ProjectCategory, UserEmail, DatasetId)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [projectName, projectCategory, userEmail, datasetId], (err) => {
    if (err) return res.json(err);
    res.json({ message: "Usage added" });
  });
});

app.get("/usage/:email", (req, res) => {
  db.query(
    `SELECT * FROM datasetusage WHERE UserEmail = ?`,
    [req.params.email],
    (err, result) => {
      if (err) return res.json(err);
      res.json(result);
    }
  );
});

app.get("/datasets/org/:type", (req, res) => {
  db.query(
    `SELECT * FROM dataset WHERE AccessLevel = ?`,
    [req.params.type],
    (err, result) => {
      if (err) return res.json(err);
      res.json(result);
    }
  );
});

app.get("/stats/top-orgs", (req, res) => {
  db.query(
    `SELECT PublisherName, COUNT(*) AS count
     FROM dataset
     GROUP BY PublisherName
     ORDER BY count DESC
     LIMIT 5`,
    (err, result) => {
      if (err) return res.json(err);
      res.json(result);
    }
  );
});

app.get("/datasets/format/:format", (req, res) => {
  db.query(
    `SELECT * FROM dataset WHERE License = ?`,
    [req.params.format],
    (err, result) => {
      if (err) return res.json(err);
      res.json(result);
    }
  );
});

app.get("/datasets/tag/:tag", (req, res) => {
  db.query(
    `SELECT d.*
     FROM dataset d
     JOIN datasettag t ON d.Identifier = t.Identifier
     WHERE t.Tag = ?`,
    [req.params.tag],
    (err, result) => {
      if (err) return res.json(err);
      res.json(result);
    }
  );
});

app.get("/stats/top-datasets", (req, res) => {
  db.query(
    `SELECT DatasetId, COUNT(*) AS users
     FROM datasetusage
     GROUP BY DatasetId
     ORDER BY users DESC
     LIMIT 5`,
    (err, result) => {
      if (err) return res.json(err);
      res.json(result);
    }
  );
});

app.get("/stats/usage-distribution", (req, res) => {
  db.query(
    `SELECT ProjectCategory, COUNT(*) AS count
     FROM datasetusage
     GROUP BY ProjectCategory`,
    (err, result) => {
      if (err) return res.json(err);
      res.json(result);
    }
  );
});

app.get("/stats/top-tags", (req, res) => {
  db.query(
    `SELECT Tag, COUNT(*) AS count
     FROM datasettag
     GROUP BY Tag
     ORDER BY count DESC
     LIMIT 10`,
    (err, result) => {
      if (err) return res.json(err);
      res.json(result);
    }
  );
});


app.listen(3001, () => { console.log("🚀 Server running on port 3001"); });

module.exports = app;