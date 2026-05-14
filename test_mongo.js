const mongoose = require("mongoose");
const uri = "mongodb+srv://avinashfortax:Abarai123x@cluster0.zvt00gi.mongodb.net/hydbar?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri)
  .then(() => {
    console.log("Connected successfully");
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection error:", err.message);
    process.exit(1);
  });
