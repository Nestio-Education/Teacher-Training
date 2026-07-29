const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/teacher_training_portal');
  const db = mongoose.connection.db;
  const courses = await db.collection('courses').find({}).toArray();
  console.log("Total courses in teacher_training_portal:", courses.length);
  process.exit(0);
}
check();
