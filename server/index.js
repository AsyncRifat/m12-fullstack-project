require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 3000;
const app = express();
// middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: 'unauthorized access' });
    }
    req.user = decoded;
    next();
  });
};

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  const db = client.db('plantdb');
  const plantCollection = db.collection('plants');
  const orderCollection = db.collection('orders');
  const usersCollection = db.collection('users');

  try {
    // Generate jwt token
    app.post('/jwt', async (req, res) => {
      const email = req.body;

      // console.log(email);

      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '365d',
      });
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true });
    });

    // Logout
    app.get('/logout', async (req, res) => {
      try {
        res
          .clearCookie('token', {
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true });
      } catch (err) {
        res.status(500).send(err);
      }
    });

    // get user's role
    app.get('/user/role/:email', async (req, res) => {
      const email = req.params.email;
      // console.log(email);
      if (!email) {
        return res.status(400).send({ message: 'Email is required' });
      }

      const result = await usersCollection.findOne({ email });
      res.send(result);
    });

    // save or payment a users in db
    app.post('/user', async (req, res) => {
      try {
        const userData = req.body;
        // console.log(userData);

        userData.role = 'customer';
        userData.created_at = new Date().toISOString();
        userData.last_loggedIn = new Date().toISOString();
        // return console.log(userData);

        const alreadyExists = await usersCollection.findOne({
          email: userData?.email,
        });
        // console.log('ami age thekei achi rifat vai', !!alreadyExists);

        if (!!alreadyExists) {
          await usersCollection.updateOne(
            { email: userData?.email },
            {
              $set: {
                last_loggedIn: new Date().toISOString(),
              },
            }
          );

          return res
            .status(200)
            .send({ message: 'User already exists', inserted: false });
        }

        const result = await usersCollection.insertOne(userData);
        console.log('akta data insert holo vai', 'inserted:', !!result);

        res.send(result);
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
      }
    });

    // add a plant in db
    app.post('/add-plant', async (req, res) => {
      const plant = req.body;
      // console.log(plant);
      const result = await plantCollection.insertOne(plant);
      res.send(result);
    });

    // get all plants from database
    app.get('/plants', async (req, res) => {
      const result = await plantCollection.find().toArray();
      res.send(result);
    });

    // get a single plant from database
    app.get('/plant/:id', async (req, res) => {
      const id = req.params.id;

      const result = await plantCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // create payment intent for order (eta evabe korar karon - basi secure)
    app.post('/create-payment-intent', async (req, res) => {
      const { plantId, quantity } = req.body;
      // console.log(plantId, quantity);

      const plant = await plantCollection.findOne({
        _id: new ObjectId(plantId),
      });
      // console.log(plant);

      if (!plant) {
        return res
          .status(404)
          .send({ message: 'Not found any plant by this plant ID' });
      }

      const plantPriceCents = plant?.price * 100;
      const totalPrice = quantity * plantPriceCents;
      // console.log(totalPrice);

      // stripe....
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: totalPrice,
          currency: 'usd',
          automatic_payment_methods: {
            enabled: true,
          },
        });
        // console.log(paymentIntent);

        res.send({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // save order data in order collection
    app.post('/order-info', async (req, res) => {
      try {
        const orderData = req.body;
        const result = await orderCollection.insertOne(orderData);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: 'Not inserted data in database' });
      }
    });

    // update plant quantity (increase/decrease)
    app.patch('/quantity-update/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const { quantityToUpdate, status } = req.body;
        console.log(quantityToUpdate, status);

        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $inc: {
            quantity:
              status === 'increase' ? quantityToUpdate : -quantityToUpdate, //Increase or Decrease quantity
          },
        };
        const result = await plantCollection.updateOne(filter, updatedDoc);
        res.send(result);
      } catch (error) {
        res.status(500).send({ success: false, message: 'Server error' });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello from plantNet Server..');
});

app.listen(port, () => {
  console.log(`plantNet is running on port ${port}`);
});
