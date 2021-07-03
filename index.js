// Import libraries
const http = require("http");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");

// Environment config
require("dotenv").config();
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

// Create server
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(cors());

// Database connection
mongoose
  .connect(MONGO_URI, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Connect database successfully");
  })
  .catch((err) => {
    console.log("Connect to database failed:", err.stack);
    process.exit(1);
  });

// Database schema
const { Schema, model } = mongoose;
const venueSchema = new Schema({
  name: String,
  websites: [
    {
      name: String,
      room_types: [
        {
          name: String,
          prices: { normal: Number, peak: Number },
          peak_hours: [Number],
        },
      ],
    },
  ],
});

// Database model
const Venue = new model("venue", venueSchema);

const sampleVenue = new Venue({
  name: "antman sample hostel",
  websites: [
    {
      name: "abc.com",
      room_types: [
        {
          name: "small",
          prices: { normal: 100, peak: 150 },
          peak_hours: [12, 13, 14],
        },
      ],
    },
  ],
});

sampleVenue
  .save()
  .then((result) => {
    console.log(result);
  })
  .catch((err) => console.log(err.stack));

// API routes
// GET
// Get all information of all venues
app.get("/api/venues", (_req, res) => {
  Venue.find({})
    .then((result) => res.status(200).json(result))
    .catch((err) => console.log(err.stack));
});

// Get information of specific venue
app.get("/api/venues/:id", (req, res) => {
  Venue.findOne({ _id: req.params.id })
    .then((result) => res.status(200).json(result))
    .catch((err) => console.log(err.stack));
});

// Get all the websites information of a venue
app.get("/api/venues/:id/websites", (req, res) => {
  Venue.findOne({ _id: req.params.id })
    .then((result) => res.status(200).json(result.websites))
    .catch((err) => console.log(err.stack));
});

// Get a specific website from a venue
app.get("/api/venues/:id/websites/:wid", (req, res) => {
  Venue.findOne({ _id: req.params.id, "websites._id": req.params.wid })
    .then((result) => {
      const filteredWebsite = result.websites.filter(
        (site) => site._id !== req.params.wid
      );
      res.status(200).json(filteredWebsite);
    })
    .catch((err) => console.log(err.stack));
});

// Get all types of rooms on website and venue
app.get("/api/venues/:id/websites/:wid/rooms", (req, res) => {
  Venue.findOne({ _id: req.params.id, "websites._id": req.params.wid })
    .then((result) => {
      const filteredWebsite = result.websites.filter(
        (site) => site._id !== req.params.wid
      );
      res.status(200).json(filteredWebsite[0].room_types);
    })
    .catch((err) => console.log(err.stack));
});

// Get prices of a types of rooms on website and venue
app.get("/api/venues/:id/websites/:wid/rooms/:rid", (req, res) => {
  Venue.findOne({
    _id: req.params.id,
    "websites._id": req.params.wid,
    "websites.room_types._id": req.params.rid,
  })
    .then((result) => {
      const filteredWebsite = result.websites.filter(
        (site) => site._id !== req.params.wid
      );
      const filteredRoom = filteredWebsite[0].room_types.filter(
        (room) => room._id !== req.params.rid
      );
      res.status(200).json(filteredRoom);
    })
    .catch((err) => console.log(err.stack));
});

// POST
app.post("/api/venues", (req, res) => {
  const newVenue = new Venue(req.body);

  newVenue
    .save()
    .then((result) => res.status(201).json(result))
    .catch((err) => console.log(err.stack));
});

// PUT
// Update a specific venue with new data
app.put("/api/venues/:id", (req, res) => {
  const options = {
    new: true, // Return new modified object
    upsert: true, // If the object does not exists, create new one
  };

  Venue.findOneAndUpdate({ _id: req.params.id }, req.body, options)
    .then((result) => res.json(result))
    .catch((err) => console.log(err.stack));
});

// DELETE
// Delete a specific venue using id
app.delete("/api/venues/:id", (req, res) => {
  Venue.deleteOne({ _id: req.params.id })
    .then((result) => res.status(200).json(result))
    .catch((err) => console.log(err.stack));
});

// Unknown endpoint
app.get("*", (_req, res) => {
  res.status(404).json({ Error: "Unknown Endpoint" });
});

server.listen(PORT, () => {
  console.log("Server is listening on port", PORT);
});
