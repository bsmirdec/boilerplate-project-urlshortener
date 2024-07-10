require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
let mongoose = require("mongoose");
const dns = require("dns");

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

// Bodyparser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

// MY CODE HERE

const URLSchema = new mongoose.Schema({
  original_url: { type: String, required: true, unique: true },
  short_url: { type: String, required: true, unique: true },
});

let URLModel = mongoose.model("url", URLSchema);

app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  // Validate URL
  try {
    const url = new URL(originalUrl);
    dns.lookup(url.hostname, (err, address, family) => {
      if (!address) {
        return res.json({ error: "invalid url" });
      } else {
        const original_url = url.href;
        let short_url = 1;

        // find shortUrl value
        URLModel.find({})
          .sort({ short_url: "desc" })
          .limit(1)
          .then((latestShortUrl) => {
            if (latestShortUrl.length > 0) {
              short_url = parseInt(latestShortUrl[0].short_url) + 1;
            }
            const resObj = { original_url: original_url, short_url: short_url };
            let newUrl = new URLModel(resObj);
            newUrl.save();
            res.json(resObj);
          });
      }
    });
  } catch {
    return res.json({ error: "invalid url" });
  }
});

app.get("/api/shorturl/:short_url?", (req, res) => {
  const short_url = req.params.short_url;
  URLModel.findOne({ short_url: short_url }).then((foundUrl) => {
    if (foundUrl) {
      console.log(foundUrl);
      const original_url = foundUrl.original_url;
      res.redirect(original_url);
    } else {
      res.json({ error: "No short URL found for the given input" });
    }
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
