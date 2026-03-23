const database = include('databaseconnection');

async function getGroups(user_id)
{
  try {
    const results = await database.query(
      'SELECT r.room_id, r.name, r.start_datetime FROM USER u INNER JOIN room_user ru ON u.user_id = ru.user_id INNER JOIN room r ON ru.room_id = r.room_id WHERE u.user_id = ?',
      [user_id])
    return results
  } catch(err) {
    console.log(err)
    return null
  }
}

async function addPersonToGroup(group_id, user_id)
{
  try{
    const results = await database.query(
      'INSERT INTO room_user (room_id, user_id) VALUES = (?, ?)',
      [group_id, user_id]
    )
    console.log(results[0])
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

module.exports = {getGroups};