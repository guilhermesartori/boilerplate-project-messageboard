/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

const MongoClient = require("mongodb").MongoClient;
const MONGO_CONNECTION_STRING = process.env.DB;
const ObjectID = require("mongodb").ObjectID;

module.exports = function(app) {
  app
    .route("/api/threads/:board")
    // /api/threads/:board
    .post((req, res) => {
      const board = req.params.board;
      const text = req.body.text;
      const delete_password = req.body.delete_password;
      if (board && text && delete_password) {
        const thread = {
          text: text,
          created_on: new Date(),
          bumped_on: new Date(),
          delete_password: delete_password,
          reported: false,
          replies: []
        };
        MongoClient.connect(
          MONGO_CONNECTION_STRING,
          { useUnifiedTopology: true },
          (err, con) => {
            if (err) {
              return res.send("Database error: " + err);
            }
            const db = con.db();
            db.collection(board).insertOne(thread, (err, data) => {
              if (err) {
                return res.send("Database error: " + err);
              } else {
                res.redirect(`/b/${board}`);
              }
            });
          }
        );
      } else {
        res.send("Invalid form data.");
      }
    })
    // /api/threads/:board
    .get((req, res) => {
      MongoClient.connect(
        MONGO_CONNECTION_STRING,
        { useUnifiedTopology: true },
        (err, con) => {
          if (err) {
            return res.send("Database error: " + err);
          } else {
            const db = con.db();
            const board = req.params.board;
            db.collection(board)
              .find()
              .project({
                reported: 0,
                delete_password: 0,
                "replies.delete_password": 0,
                "replies.reported": 0
              })
              .sort({ bumped_on: -1 })
              .limit(10)
              .toArray((err, docs) => {
                if (err) return res.send("Database error: " + err);
                docs.forEach(doc => {
                  doc.replycount = doc.replies.length;
                  if (doc.replies.length > 3) {
                    doc.replies = doc.replies.slice(-3);
                  }
                });
                res.json(docs);
              });
          }
        }
      );
    })

    // /api/threads/:board
    .delete((req, res) => {
      const board = req.params.board;
      const thread_id = req.body.thread_id;
      const delete_password = req.body.delete_password;
      MongoClient.connect(
        MONGO_CONNECTION_STRING,
        { useUnifiedTopology: true },
        (err, con) => {
          if (err) return res.send("Database error: " + err);
          const db = con.db();
          db.collection(board).findOneAndDelete(
            { _id: new ObjectID(thread_id), delete_password: delete_password },
            (err, doc) => {
              if (err) return res.send("Database error: " + err);
              else if (doc.value) res.send("success");
              else res.send("incorrect password");
            }
          );
        }
      );
    })
    // /api/threads/:board
    .put((req, res) => {
      const board = req.params.board;
      const thread_id = req.body.report_id;
      MongoClient.connect(
        MONGO_CONNECTION_STRING,
        { useUnifiedTopology: true },
        (err, con) => {
          const db = con.db();
          db.collection(board).findOneAndUpdate(
            { _id: new ObjectID(thread_id) },
            { $set: { reported: true } },
            (err, doc) => {
              if (err) return res.send("Database error: " + err);
              res.send("success");
            }
          );
        }
      );
    });

  app
    .route("/api/replies/:board")
    // /api/replies/:board
    .post((req, res) => {
      const board = req.params.board;
      const text = req.body.text;
      const delete_password = req.body.delete_password;
      const thread_id = req.body.thread_id;
      if (board && text && delete_password && thread_id) {
        const reply = {
          _id: new ObjectID(),
          text: text,
          created_on: new Date(),
          delete_password: delete_password,
          reported: false
        };
        MongoClient.connect(
          MONGO_CONNECTION_STRING,
          { useUnifiedTopology: true },
          (err, con) => {
            if (err) {
              return res.send("Database error: " + err);
            }
            const db = con.db();
            db.collection(board).findOneAndUpdate(
              { _id: new ObjectID(thread_id) },
              {
                $push: {
                  replies: { $each: [reply], $sort: { created_on: 1 } }
                },
                $set: { bumped_on: new Date() }
              },
              { returnNewDocument: true },
              (err, data) => {
                if (err) {
                  return res.send("Database error: " + err);
                } else {
                  res.redirect(`/b/${board}/${thread_id}`);
                }
              }
            );
          }
        );
      } else {
        res.send("Invalid form data.");
      }
    })
    // /api/replies/:board
    .get((req, res) => {
      MongoClient.connect(
        MONGO_CONNECTION_STRING,
        { useUnifiedTopology: true },
        (err, con) => {
          if (err) {
            return res.send("Database error: " + err);
          } else {
            const db = con.db();
            const board = req.params.board;
            const thread_id = req.query.thread_id;
            db.collection(board)
              .find({ _id: new ObjectID(thread_id) })
              .project({
                reported: 0,
                delete_password: 0,
                "replies.delete_password": 0,
                "replies.reported": 0
              })
              .toArray((err, docs) => {
                if (err) return res.send("Database error: " + err);
                else res.json(docs[0]);
              });
          }
        }
      );
    })
    // /api/replies/:board
    .delete((req, res) => {
      MongoClient.connect(
        MONGO_CONNECTION_STRING,
        { useUnifiedTopology: true },
        (err, con) => {
          if (err) {
            return res.send("Database error: " + err);
          } else {
            const db = con.db();
            const board = req.params.board;
            const thread_id = req.body.thread_id;
            const reply_id = req.body.reply_id;
            const delete_password = req.body.reply_id;

            db.collection(board).findOneAndUpdate(
              {
                _id: new ObjectID(thread_id),
                replies: {
                  $elemMatch: {
                    _id: new ObjectID(req.body.reply_id),
                    delete_password: req.body.delete_password
                  }
                }
              },
              { $set: { "replies.$.text": "[deleted]" } },
              { returnNewDocument: true },
              (err, doc) => {
                if (err) return res.send("Database error: " + err);
                else if (doc.value) return res.send("success");
                else return res.send("incorrect password");
              }
            );
          }
        }
      );
    })

    // /api/replies/:board
    .put((req, res) => {
      MongoClient.connect(
        MONGO_CONNECTION_STRING,
        { useUnifiedTopology: true },
        (err, con) => {
          if (err) {
            return res.send("Database error: " + err);
          } else {
            const db = con.db();
            const board = req.params.board;
            const thread_id = req.body.thread_id;
            const reply_id = req.body.reply_id;

            db.collection(board).findOneAndUpdate(
              {
                _id: new ObjectID(thread_id),
                replies: {
                  $elemMatch: {
                    _id: new ObjectID(req.body.reply_id)
                  }
                }
              },
              { $set: { "replies.$.reported": true } },
              { returnNewDocument: true },
              (err, doc) => {
                if (err) return res.send("Database error: " + err);
                res.send("success");
              }
            );
          }
        }
      );
    });
};
