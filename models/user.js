/** User class for message.ly */

const db = require('../db')
const {SECRET_KEY} = require('../config')

const { BCRYPT_WORK_FACTOR } = require("../config");
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')

/** User of the site. */

class User {

    /** register new user -- returns
     *    {username, password, first_name, last_name, phone}
     */
  
    static async register({username, password, first_name, last_name, phone}) { 
        console.log(password)
        let hashedPwd = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
        console.log(hashedPwd)
        const result = await db.query(
            `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
            VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
            RETURNING username, password, first_name, last_name, phone`,
            [username, hashedPwd, first_name, last_name, phone]
        );
        return res.json(result.rows[0])
    }
  
    /** Authenticate: is this username/password valid? Returns boolean. */
  
    static async authenticate(username, password) { 
        try {
            const result = await db.query(
                `SELECT password FROM users 
                WHERE username = $1`, [username]
            );
            let user = result.rows[0];
            if (user){
                if (await bcrypt.compare(password, user.password) === true){
                    let token = jwt.sign({username}, SECRET_KEY)
                    return res.json({token})
                }
            }
        } catch (err) {
            return false
        }
    }
  
    /** Update last_login_at for user */
  
    static async updateLoginTimestamp(username) { 
        const result = await db.query(
            `UPDATE users
               SET last_login_at = current_timestamp
               WHERE username = $1
               RETURNING username`,
            [username]);
    
        if (!result.rows[0]) {
          throw new ExpressError(`No such user: ${username}`, 404);
        }
    }
  
    /** All: basic info on all users:
     * [{username, first_name, last_name, phone}, ...] */
  
    static async all() { 
        try {
            const result = await db.query(
                `SELECT username, first_name, last_name, phone
                FROM users`
            )
            return res.json(result.rows);
        } catch (err) {
            return next(err)
        }
    }
  
    /** Get: get user by username
     *
     * returns {username,
     *          first_name,
     *          last_name,
     *          phone,
     *          join_at,
     *          last_login_at } */
  
    static async get(username) { 
        try {
            const result = await db.query(
                `SELECT username, first_name, last_name, phone, join_at, last_login_at
                FROM users WHERE username = $1`, [username]
            )
            return result.rows[0]
        } catch (err) {
            return next(err)
        }
    }
  
    /** Return messages from this user.
     *
     * [{id, to_user, body, sent_at, read_at}]
     *
     * where to_user is
     *   {username, first_name, last_name, phone}
     */
  
    static async messagesFrom(username) { 
        try {
            const result = db.query(
                `SELECT m.id, 
                        m.to_username,
                        u.first_name,
                        u.last_name,
                        u.phone,
                        m.body,
                        m.sent_at,
                        m.read_at
                FROM messages AS m
                JOIN users AS u ON m.to_username = u.username
                WHERE from_username = $1`, [username]
            );
            return result.rows.map(m => ({
                id: m.id,
                to_user: {
                    username: m.to_username,
                    first_name: u.first_name,
                    last_name: u.last_name,
                    phone: u.phone
                },
                body: m.body,
                sent_at: m.sent_at,
                read_at: m.read_at
            }));
        } catch (err) {
            return next(err)
        }
    }
  
    /** Return messages to this user.
     *
     * [{id, from_user, body, sent_at, read_at}]
     *
     * where from_user is
     *   {username, first_name, last_name, phone}
     */
  
    static async messagesTo(username) { 
        try {
            const result = db.query(
                `SELECT m.id, 
                        m.from_username,
                        u.first_name,
                        u.last_name,
                        u.phone,
                        m.body,
                        m.sent_at,
                        m.read_at
                FROM messages AS m
                JOIN users AS u ON m.from_username = u.username
                WHERE to_username = $1`, [username]
            );
            return result.rows.map(m => ({
                id: m.id,
                from_user: {
                    username: m.from_username,
                    first_name: u.first_name,
                    last_name: u.last_name,
                    phone: u.phone
                },
                body: m.body,
                sent_at: m.sent_at,
                read_at: m.read_at
            }));
        } catch (err) {
            return next(err)
        }
    }
  }
  
  
  module.exports = User;