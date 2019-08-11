const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  res.json([
    {id: 1, username: "somebody"},
    {id: 2, username: "somebody_else"}
  ]);
});