const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const { format } = require("date-fns");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

module.exports = app;

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

const validStatus = ["TO DO", "IN PROGRESS", "DONE"];
const validCategory = ["WORK", "HOME", "LEARNING"];
const validPriority = ["HIGH", "MEDIUM", "LOW"];

app.get("/todos", async (req, res) => {
  let { status, priority, category, search_q } = req.query;
  console.log(priority);
  console.log(validPriority[0]);

  if (status && !validStatus.includes(status)) {
    res.status(400).send("Invalid Todo Status");
  } else if (priority && !validPriority.includes(priority)) {
    res.status(400).send("Invalid Todo Priority");
  } else if (category && !validCategory.includes(category)) {
    res.status(400).send("Invalid Todo Category");
  } else {
    status = status ? status : "%%";
    priority = priority ? priority : "%%";
    category = category ? category : "%%";
    search_q = search_q ? search_q : "%%";

    const sql = `SELECT id, todo, priority, status, category, due_date AS dueDate FROM todo
  WHERE status LIKE "${status}"
  AND priority LIKE "${priority}"
  AND category LIKE "${category}"
  AND todo LIKE "%${search_q}%"`;

    let resp = await db.all(sql);
    res.send(resp);
  }
});

app.get("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;

  const sql = `SELECT id, todo, priority, status, category, due_date AS dueDate FROM todo
   WHERE id = ${todoId}`;

  let resp = await db.get(sql);
  res.send(resp);
});

app.get("/agenda", async (req, res) => {
  let { date } = req.query;

  if (!isValid(new Date(date))) {
    res.status(400).send("Invalid Due Date");
  } else {
    date = date ? format(new Date(date), "yyyy-MM-dd") : "";
    const sql = `SELECT id, todo, priority, status, category, due_date AS dueDate FROM todo
  WHERE dueDate = "${date}"`;

    let resp = await db.all(sql);
    res.send(resp);
  }
});

app.post("/todos/", async (req, res) => {
  const todoDetails = req.body;
  let { id, todo, status, category, dueDate, priority } = todoDetails;

  if (status && !validStatus.includes(status)) {
    res.status(400).send("Invalid Todo Status");
  } else if (priority && !validPriority.includes(priority)) {
    res.status(400).send("Invalid Todo Priority");
  } else if (category && !validCategory.includes(category)) {
    res.status(400).send("Invalid Todo Category");
  } else if (!isValid(new Date(dueDate))) {
    res.status(400).send("Invalid Due Date");
  } else {
    dueDate = format(new Date(dueDate), "yyyy-MM-dd");

    let sql = `INSERT INTO todo (id, todo, status ,priority, category, due_date)
    VALUES (
        ${id},
        '${todo}',
        '${status}',
        '${priority}',
        '${category}',
        '${dueDate}'
        )`;

    let resp = await db.run(sql);
    res.send("Todo Successfully Added");
  }
});

app.put("/todos/:todoId", async (req, res) => {
  const todoDetails = req.body;
  const { todoId } = req.params;
  let { todo, status, category, dueDate, priority } = todoDetails;
  const labelMap = {
    status: "Status",
    todo: "Todo",
    category: "Category",
    dueDate: "Due Date",
    priority: "Priority",
  };

  let respMessage = null;

  if (status) {
    respMessage = labelMap.status;
  } else if (todo) {
    respMessage = labelMap.todo;
  } else if (category) {
    respMessage = labelMap.category;
  } else if (dueDate) {
    respMessage = labelMap.dueDate;
  } else if (priority) {
    respMessage = labelMap.priority;
  }

  if (status && !validStatus.includes(status)) {
    res.status(400).send("Invalid Todo Status");
  } else if (priority && !validPriority.includes(priority)) {
    res.status(400).send("Invalid Todo Priority");
  } else if (category && !validCategory.includes(category)) {
    res.status(400).send("Invalid Todo Category");
  } else if (dueDate && !isValid(new Date(dueDate))) {
    res.status(400).send("Invalid Due Date");
  } else {
    dueDate = dueDate ? format(new Date(dueDate), "yyyy-MM-dd") : null;

    let getSql = `SELECT id, todo, priority, status, category, due_date AS dueDate FROM todo WHERE id = ${todoId}`;

    let resp = await db.get(getSql);

    let sql = `UPDATE todo
      SET todo = '${todo ? todo : resp.todo}',
          status = '${status ? status : resp.status}',
          priority = '${priority ? priority : resp.priority}',
          category ='${category ? category : resp.category}',
          due_date = '${dueDate ? dueDate : resp.dueDate}'
          WHERE id = ${resp.id}`;

    resp = await db.run(sql);
    res.send(`${respMessage} Updated`);
  }
});

app.delete("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;

  const sql = `DELETE FROM todo WHERE id = ${todoId}`;

  let resp = await db.run(sql);
  res.send("Todo Deleted");
});
