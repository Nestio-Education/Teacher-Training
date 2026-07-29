const mongoose = require('mongoose');
require('dotenv').config({path: '.env'});

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const mod = await db.collection('parentmodules').findOne({});
  console.log(JSON.stringify(mod, null, 2));
  process.exit(0);
}
check();
