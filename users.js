const database = include('databaseconnection');

async function createUser(postData) {
	let params = {
		user: postData.user,
		passwordHash: postData.hashedPassword,
    email: postData.email
	}
	
	try {
		const results = await database.query(
      "INSERT INTO user (username, password_hash, email) VALUES (?, ?, ?)",
      [params.user, params.passwordHash, params.email]
    );

    console.log("Successfully created user");
		console.log(results[0]);
		return true;
	}
	catch(err) {
		console.log("Error inserting user");
    console.log(err);
		return false;
	}
}

async function getAllUsers() {
  try {
    const results = await database.query('SELECT * FROM user');
    console.log(results[0]);
  } catch (err) {
    console.log(err);
  }
}

async function getUser(username) {
  try {
    
    const results = await database.execute("SELECT username, password FROM user WHERE username = ?",[username])
    return results
  } catch (err) {
    console.log(err);
    return false
  }
}


async function deleteUsers() {
  try {
    await database.execute("DELETE FROM user WHERE user_id > 0");
    console.log('yay');
  } catch (err)
  {
    console.log(err)
  }
}

module.exports = {createUser, getUser, getAllUsers, deleteUsers};