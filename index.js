const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5050;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running well");
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization.split(" ")[1];
  if (!authHeader) {
    res.status(401).send({ message: "unauthorized" });
  }

  jwt.verify(
    authHeader,
    process.env.ACCESS_TOKEN_SECRET,
    function (err, decoded) {
      if (err) res.status(401).send({ message: "unauthorized" });

      req.decode = decoded;
      next();
    }
  );

  // console.log();
}
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.yfdgs6q.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const placeCollection = client.db("travelDb").collection("touristPlace");
    const reviewCollection = client.db("travelDb").collection("reviews");

    app.post("/places", async (req, res) => {
      // const limit = parseInt(req.query.limit) || 0;

      const query = {};
      const cursor = placeCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get all places
    app.get("/places", async (req, res) => {
      // const limit = parseInt(req.query.limit) || 0;
      //serach for search query
      const search = req.query.search;
      // console.log(search);
      // page and size are calling for pagination content
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = search
        ? {
            $text: {
              $search: search,
            },
          }
        : {};
      const cursor = placeCollection.find(query);
      const result = await cursor
        .skip(size * page)
        .limit(size)
        .toArray();
      const count = await placeCollection.estimatedDocumentCount();
      res.send({ count, result });
    });

    app.get("/places/:id", async (req, res) => {
      const newid = req.params.id;
      const query = { _id: ObjectId(newid) };
      const place = await placeCollection.findOne(query);
      // console.log(place);
      res.send(place);
    });

    app.post("/addreview",verifyJWT, async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      // console.log("insert done");
    });
    app.post("/addservices",verifyJWT, async (req, res) => {
      const review = req.body;
      const result = await placeCollection.insertOne(review);
      // console.log("insert done");
    });
    app.get("/reviews/:id",  async (req, res) => {
      const id = req.params.id;
      const newQuery = parseInt(req.query.sorting);
      // console.log(newQuery);
      const query = {
        newPlaceId: id,
      };

      const cursor = reviewCollection.find(query).sort({ date: newQuery });
      const reviewsById = await cursor.toArray();
      // console.log(result);
      res.send(reviewsById);
    });
    app.get("/userReview/:email",verifyJWT, async (req, res) => {
      const authorization = req.headers.authorization.split(" ")[1];
      console.log(authorization);
      const email = req.params.email;
      // console.log(email);
      const query = {
        email,
      };

      const cursor = reviewCollection.find(query);
      const reviewsByEmail = await cursor.toArray();

      res.send(reviewsByEmail);
    });

    app.delete("/delete/:id",verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });

    // JWT API
    app.post("/jwt", (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "2h",
      });
      res.send({ token });
    });
  } finally {
  }
}
run().catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`server is runnifng well on port ${port}`);
});
