const http = require("http");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB connection successfully established..!");
  })
  .catch((err) => {
    console.log(err);
  });

const PORT = process.env.PORT || 8000;

let server = http.createServer(app);
server.listen(PORT, () => {
  console.log("Server is listening on port " + PORT);
});
