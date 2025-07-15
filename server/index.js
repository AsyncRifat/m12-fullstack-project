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
    // custom middleware for Admin verify
    const verifyAdmin = async (req, res, next) => {
      const email = req.user?.email;
      // console.log(email);
      const user = await usersCollection.findOne({ email });
      if (!user || user.role !== 'admin') {
        return res.status(403).send({ message: 'Forbidden Access' });
      }
      next();
    };
    // custom middleware for Seller verify
    const verifySeller = async (req, res, next) => {
      const email = req.user?.email;
      // console.log(email);
      const user = await usersCollection.findOne({ email });
      if (!user || user.role !== 'seller') {
        return res.status(403).send({ message: 'Forbidden Access' });
      }
      next();
    };

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

    // ----------- ##user's## -----------
    // get all users for admin
    app.get('/all-users', verifyToken, verifyAdmin, async (req, res) => {
      // console.log(req.user);
      const filter = {
        email: { $ne: req?.user?.email }, // $ne ---> not equal
      };
      const result = await usersCollection.find(filter).toArray();
      res.send(result);
    });

    // update user's role
    app.patch(
      '/user/role/update/:email',
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const { role } = req.body;
        // console.log(role);
        const email = req.params.email;
        // console.log(email);
        const updateDoc = {
          $set: {
            role,
            status: 'verified',
          },
        };
        const result = await usersCollection.updateOne({ email }, updateDoc);
        // console.log(result);
        res.send(result);
      }
    );

    // become seller request
    app.patch('/become-seller/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      // console.log(email);
      const updateDoc = {
        $set: {
          status: 'requested',
        },
      };
      const result = await usersCollection.updateOne({ email }, updateDoc);
      // console.log(result);
      res.send(result);
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

    // save or payment a users in db (signUp , signIn , google Login)
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

    // ----------- ##plant## -----------
    // add a plant in db
    app.post('/add-plant', verifyToken, verifySeller, async (req, res) => {
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

    // ----------- ##order's## -----------
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

    // get all order info for customer verifyToken,
    app.get('/orders/customer/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const filter = { 'customer.email': email };
      const result = await orderCollection.find(filter).toArray();
      console.log(result);
      res.send(result);
    });

    // get all order info for seller
    app.get(
      '/orders/seller/:email',
      verifyToken,
      verifySeller,
      async (req, res) => {
        const email = req.params.email;
        const filter = { 'seller.email': email };
        const result = await orderCollection.find(filter).toArray();
        console.log(result);
        res.send(result);
      }
    );

    //  ##payment## -- create payment intent for order (eta more than secure - more secure)
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

    //  -------- ## admin statistic ## --------     (verifyToken,)
    app.get('/admin-stats', verifyToken, verifyAdmin, async (req, res) => {
      // const totalUser = await usersCollection.countDocuments({ role: 'admin' });   //filter accepted
      const totalUser = await usersCollection.estimatedDocumentCount(); //filter not accepted
      const totalPlant = await plantCollection.estimatedDocumentCount();
      const totalOrder = await orderCollection.estimatedDocumentCount();

      // mongoDB aggregation
      const pipeline = [
        {
          $addFields: {
            createdAt: { $toDate: '$_id' },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
              },
            },
            revenue: { $sum: '$price' },
            order: { $sum: 1 },
          },
        },
        {
          $project: {
            date: '$_id',
            _id: 0,
            revenue: 1,
            order: 1,
          },
        },
      ];
      const aggregateResult = await orderCollection
        .aggregate(pipeline)
        .toArray();

      // total revenue
      const totalRevenue = aggregateResult.reduce(
        (sum, data) => sum + data?.revenue,
        0
      );

      res.send({
        totalUser,
        totalPlant,
        totalOrder,
        totalRevenue,
        aggregateResult,
      });

      // const dataInfo = result.map(data => ({
      //   date: data?._id,
      //   totalRevenue: data?.totalRevenue,
      //   totalOrder: data?.totalOrder,
      // }));
      // return res.send(dataInfo);
      // প্রথম অবস্থায় _id দিয়ে date ছিলো। কিন্তু আমি পড়ে project করে _id কে date নাম দিছি। যেটা পরিবতন করব সেটা শূন্য (0) মান দিবো। পরিবতন না হলে ওয়ান (1) মান থাকবে। ------ আমি আবার এটাকে map করেও করতে পারি সেটা নিচে দেখলাম। -----
      // array.reduce((accumulator, currentValue) => { ... }, initialValue)
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
