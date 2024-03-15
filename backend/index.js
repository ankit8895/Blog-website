const express = require('express');
const app = express();
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const PORT = process.env.PORT || 8000;

dotenv.config();

const withDB = async (operations, res) => {
  try {
    const client = MongoClient.connect(process.env.MONGODB);
    const db = (await client).db('blog');
    await operations(db);
    (await client).close();
  } catch (error) {
    res.status(500).json({ message: 'Error connecting to database', error });
  }
};

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', 'https://proshop-main.vercel.app');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  next();
});

app.use(express.json({ extended: false }));

app.get('/api/articles/:name', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articleInfo = await db
      .collection('articles')
      .findOne({ name: articleName });
    res.status(200).json(articleInfo);
  }, res);
});

app.post('/api/articles/:name/add-comments', (req, res) => {
  const { username, text } = req.body;
  const articleName = req.params.name;

  withDB(async (db) => {
    const articleInfo = await db
      .collection('articles')
      .findOne({ name: articleName });
    await db
      .collection('articles')
      .updateOne(
        { name: articleName },
        { $set: { comments: articleInfo.comments.concate({ username, text }) } }
      );

    const updateArticleInfo = await db
      .collection('articles')
      .findOne({ name: articleName });
    res.status(200).json(updateArticleInfo);
  }, res);
});

app.listen(PORT, () => console.log(`Server started at port ${PORT}`));
