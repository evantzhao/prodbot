const 
	mongoose = require('mongoose'),
	db_uri = process.env.MONGO_URI

mongoose.connect(db_uri);
let db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
  // we're connected!
  console.log("We're connected to the local mongodb");

  // Generate local schema
	var user_schema = mongoose.Schema({
		psid: Number,
		yesterday: String,
		today: String,
		blockers: String
	});

	exports.user = mongoose.model('users', user_schema);
});

exports.connection = db;