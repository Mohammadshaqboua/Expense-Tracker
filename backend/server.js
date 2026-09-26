require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
const port = 3000;
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const COLUMNS = `id, title, amount::float8 AS amount, category, to_char(date, 'YYYY-MM-DD') AS date`;

const CATEGORIES = ["Food", "Transport", "Bills", "Entertainment", "Other"];

app.get("/api/expenses", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${COLUMNS} FROM expenses ORDER BY id`,
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/expenses/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  try {
    const result = await pool.query(
      `SELECT ${COLUMNS} FROM expenses WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/expenses", async (req, res) => {
  const { title, amount, category, date } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ message: "Title is required" });
  }

  if (title.trim().length > 100) {
    return res
      .status(400)
      .json({ message: "Title must be 100 characters or less" });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res
      .status(400)
      .json({ message: "Amount must be a positive number" });
  }

  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({
      message: `Category must be one of: ${CATEGORIES.join(", ")}`,
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO expenses (title, amount, category, date)
       VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE))
       RETURNING ${COLUMNS}`,
      [title.trim(), parsedAmount, category, date || null],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    if (error.code === "22007") {
      return res
        .status(400)
        .json({ message: "Invalid date format (use YYYY-MM-DD)" });
    }

    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/expenses/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  const { title, amount, category, date } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ message: "Title is required" });
  }

  if (title.trim().length > 100) {
    return res
      .status(400)
      .json({ message: "Title must be 100 characters or less" });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res
      .status(400)
      .json({ message: "Amount must be a positive number" });
  }

  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({
      message: `Category must be one of: ${CATEGORIES.join(", ")}`,
    });
  }

  try {
    const result = await pool.query(
      `UPDATE expenses
       SET title = $1, amount = $2, category = $3, date = COALESCE($4, date)
       WHERE id = $5
       RETURNING ${COLUMNS}`,
      [title.trim(), parsedAmount, category, date || null, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    if (error.code === "22007") {
      return res
        .status(400)
        .json({ message: "Invalid date format (use YYYY-MM-DD)" });
    }

    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/expenses/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  try {
    const result = await pool.query(
      `DELETE FROM expenses WHERE id = $1 RETURNING ${COLUMNS}`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ message: "Expense deleted", expense: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
