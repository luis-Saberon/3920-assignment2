const database = include('databaseconnection');

async function getGroups(user_id)
{
  try {
    const results = await database.query(
      'SELECT r.room_id, r.name, r.start_datetime, ru.room_user_id FROM USER u INNER JOIN room_user ru ON u.user_id = ru.user_id INNER JOIN room r ON ru.room_id = r.room_id WHERE u.user_id = ?',
      [user_id])
    return results
  } catch(err) {
    console.log(err)
    return err
  }
}


async function updateLastSeenMessage(room_user_id, message_id) {
  try {
    const results = await database.query(
      'UPDATE room_user SET last_seen_message_id = ? WHERE room_user_id = ?',
      [message_id, room_user_id]
    )
  } catch(err) {
    console.log(err)
    return false
  }
}

async function getLastSeenMessageId(room_user_id)
{
  try {
    const results = await database.query(
      'SELECT last_seen_message_id FROM room_user WHERE room_user_id = ?',
      [room_user_id]
    )

    return results
  } catch(err) {
    return err
  }
}
async function getMessagesInGroup(group_id)
{
  try {
    const results = await database.query(
      'SELECT u.username, m.message_id, m.sent_datetime, m.text FROM room r INNER JOIN room_user ru ON r.room_id = ru.room_id INNER JOIN message m ON ru.room_user_id = m.room_user_id INNER JOIN user u ON ru.user_id = u.user_id WHERE r.room_id = ? ORDER BY m.sent_datetime ASC',[group_id]
    )
    return results
  } catch(err) {
    console.log(err)
    return err
  }
}

async function addMessageToGroup(message, room_user_id)
{
  try{
    const results = await database.query(
      'INSERT INTO message (room_user_id, sent_datetime, text) VALUES (?, now(), ?)',
      [room_user_id, message]
    )
  } catch(err) {
    console.log(err)
    return false
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

module.exports = {getGroups, getMessagesInGroup, addMessageToGroup, updateLastSeenMessage, getLastSeenMessageId};