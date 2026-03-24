const database = include('databaseconnection');

async function getGroups(user_id)
{
  try {
    const results = await database.query(
      `SELECT r.room_id, r.name, r.start_datetime, ru.room_user_id, mm.message_id, m.sent_datetime
        FROM user u INNER JOIN room_user ru ON u.user_id = ru.user_id
        INNER JOIN room r ON ru.room_id = r.room_id
        left join (SELECT r.room_id, max(m.message_id) AS message_id
        FROM room r
        INNER JOIN room_user ru ON r.room_id = ru.room_id
        INNER JOIN message m ON ru.room_user_id = m.room_user_id
        GROUP BY r.room_id
       ) mm ON mm.room_id = r.room_id
       LEFT JOIN message m ON mm.message_id = m.message_id WHERE u.user_id = ?`,
      [user_id])
    return results
  } catch(err) {
    console.log(err)
    return err
  }
}

async function addReaction(message_id, user_id, emoji_id)
{
try {
  const results = await database.query(
    `INSERT INTO message_reaction (message_id, emoji_id, user_id) VALUES (?,?,?)`,
    [message_id, emoji_id, user_id]
  ) 
} catch(err) {
  console.log("ERROR IN ADDING REACTION")
  console.log(err);
}
}

async function getEmojiIdFromName(emoji_name)
{
try {
  const results = await database.query(
    `SELECT emoji_id FROM emoji WHERE emoji_name = ?`,
    [emoji_name]
  )
  return results[0][0].emoji_id;
} catch(err)
{
  console.log('ERROR IN GETTING EMOJIID FROM NAME')
  console.log(err);
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

async function checkIfUserInGroup(group_id, user_id)
{

  try{ 
    const results = await database.query(`
      SELECT * FROM room_user
      WHERE user_id = ? AND
      room_id = ?`,
    [user_id, group_id])
    if (results[0].length == 0)
    {
      return false
    }
    return true
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
      `SELECT u.username, m.message_id, m.sent_datetime, m.text 
      FROM room r INNER JOIN room_user ru ON r.room_id = ru.room_id 
      INNER JOIN message m ON ru.room_user_id = m.room_user_id 
      INNER JOIN user u ON ru.user_id = u.user_id 
      WHERE r.room_id = ? ORDER BY m.sent_datetime ASC`,[group_id]
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
      'INSERT INTO room_user (room_id, user_id) VALUES (?, ?)',
      [group_id, user_id]
    )
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

async function makeGroup(user_id, group_name)
{
  try {
    const result = await database.query(
      'INSERT INTO room (name, start_datetime) VALUES (?, now())',
      [group_name]
    )
    const group_id = result[0].insertId
    await addPersonToGroup(group_id, user_id)
  } catch(err) {
    console.log("ERROR IN MAKING GROUP")
    console.log(err)
    return false
  }
}

async function getUsersInGroup(group_id, user_id)
{
  try{
    const result = await database.query(
      `SELECT u.email, u.username, u.user_id, r.room_id
      FROM user u
      INNER JOIN room_user ru ON u.user_id = ru.user_id
      INNER JOIN room r ON ru.room_id = r.room_id
      WHERE r.room_id = ?`,
    [group_id]
    )
    return result
  } catch(err) {
    console.log("ERROR IN GETTING USERS IN GROUP")
    console.log(err)
    return err
  }
}

module.exports = {getGroups, getMessagesInGroup, addMessageToGroup, updateLastSeenMessage, getLastSeenMessageId, makeGroup, addPersonToGroup, getUsersInGroup, checkIfUserInGroup, getEmojiIdFromName, addReaction};