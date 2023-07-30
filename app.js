const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server running on http://localhost:3000");
    });
  } catch (err) {
    console.log("Error: ", err);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/todos", async (req, res) => {
  let { status, priority, category, search_q } = req.query;

  status = status ? status : "%%";
  priority = priority ? priority : "%%";
  category = category ? category : "%%";
  search_q = search_q ? search_q : "%%";

  const sql = `SELECT id, todo, priority, status, category, due_date AS dueDate FROM todo
  WHERE status LIKE "${status}"
  AND priority LIKE "${priority}"
  AND category LIKE "${category}"
  AND todo LIKE "${search_q}"`;

  console.log("sql", sql);

  let resp = await db.all(sql);
  res.send(resp);
});
