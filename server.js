const express = require("express")
const app = express()
const pg = require("pg")
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://postgres:sigzz1029@localhost/acme_hr_directory')
const port = process.env.PORT || "3000"


app.use(express.json())
app.use(require("morgan")("dev"))

app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM employees;`
    const response = await client.query(SQL)
    res.send(response.rows)
  } catch (error) {
    next(error)
  }
})
app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM departments;`
    const response = await client.query(SQL)
    res.send(response.rows)
  } catch (error) {
    next(error)
  }
})
app.post("/api/employees", async (req, res, next) => {
  try {
    const { name, department_id } = req.body
    const SQL = `
      INSERT INTO employees(name, department_id) VALUES($1, $2) RETURNING *;
    `
    const response = await client.query(SQL, [name, department_id])
    res.send(response.rows)
  } catch (error) {
    next(error)
  }
})
app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const id = req.params.id
    const SQL = `
      DELETE FROM employees WHERE id = $1;
    `
    const response = await client.query(SQL, [id])
    res.send(response.rows)
  } catch (error) {
    next(error)
  }
})
app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const id = req.params.id
    const { name, department_id } = req.body
    const SQL = `
      UPDATE employees
      SET name = $1, department_id = $2, updated_at = now()
      WHERE id = $3
      RETURNING *;
    `
    const response = await client.query(SQL, [name, department_id, id])
    res.send(response.rows)
  } catch (error) {
    next(error)
  }
})



const init = async () => {
  await client.connect()
  const SQLCreate = `
  DROP TABLE IF EXISTS departments CASCADE;
  DROP TABLE IF EXISTS employees CASCADE;
  CREATE TABLE departments(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
    );
  CREATE TABLE employees(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    department_id INTEGER REFERENCES departments(id) NOT NULL
    );
  `
  await client.query(SQLCreate)
  const SQLSeed = `
    INSERT INTO departments(name) VALUES('IT');
    INSERT INTO departments(name) VALUES('Sales');
    INSERT INTO departments(name) VALUES('Executive');
    INSERT INTO employees(name, department_id) VALUES('Dave', (SELECT id from departments WHERE name = 'Executive'));
    INSERT INTO employees(name, department_id) VALUES('Cindy', (SELECT id from departments WHERE name = 'Sales'));
    INSERT INTO employees(name, department_id) VALUES('Jim', (SELECT id from departments WHERE name = 'IT'));
    `
  await client.query(SQLSeed)


  app.listen(port, () => {
    console.log(`Listening on port ${port}`)
  })
}

init()