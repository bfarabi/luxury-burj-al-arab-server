const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const { initializeApp} = require('firebase-admin/app');
var admin = require("firebase-admin");

const port = 5022;

const app = express();
app.use(cors());
app.use(bodyParser.json());

const serviceAccount = require("./luxury-hotel-432ef-firebase-adminsdk-wc9sj-93cdf541ce.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://luxury-hotel.firebaseio.com',
});

const { MongoClient } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vag79.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db("burjAlArab").collection("Rooms");
  console.log('db connect');
  

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking).then((result) => {
      res.send(result.insertedId > 0);
    });
  });
  app.get("/booking", (req, res) => {
    const bearer = req.headers.authorization;
    // console.log(bearer);
    if (bearer && bearer.startsWith("Bearer ")) {
      idToken = bearer.split(" ")[1];
      console.log({ idToken });
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          //now double verification email.
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          console.log(tokenEmail, queryEmail);
          if (tokenEmail == queryEmail) {
            bookings.find({ email: queryEmail }).toArray((err, documents) => {
              res.status(200).send(documents);
            });
          }
        })
        .catch((error) => {
          res.status(401).send("unauthorized access");
        });
    } else {
      res.status(401).send("unauthorized access"); 
    }
  });

});
app.listen(process.env.PORT ||port);
