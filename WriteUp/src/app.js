require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({
  origin: [
    "https://writeup-delta.vercel.app",
    "http://localhost:5173"
  ],
  credentials: true
}));

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", require("./routes"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`WriteUp server running on port ${PORT}`);
});

module.exports = app;
