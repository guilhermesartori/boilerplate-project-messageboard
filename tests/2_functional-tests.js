/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function() {
  let testText = Math.floor(Math.random() * 10000000);
  let testId;
  let testId2;
  let testId3;

  suite("API ROUTING FOR /api/threads/:board", function() {
    suite("POST", function(done) {
      test("create 2 new threads(because we end up deleting 1 in the delete test)", function(done) {
        chai
          .request(server)
          .post("/api/threads/test")
          .send({ text: "Test thread", delete_password: "123" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
          });
        chai
          .request(server)
          .post("/api/threads/test")
          .send({ text: "Test thread 2", delete_password: "123" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            done();
          });
      });
    });

    suite("GET", function(done) {
      test("most recent 10 threads with most recent 3 replies each", function(done) {
        chai
          .request(server)
          .get("/api/threads/test")
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.property(res.body[0], "_id");
            assert.property(res.body[0], "text");
            assert.property(res.body[0], "replies");
            assert.property(res.body[0], "created_on");
            assert.property(res.body[0], "bumped_on");
            assert.isArray(res.body[0].replies);
            assert.isBelow(res.body[0].replies.length, 4);
            assert.notProperty(res.body[0], "reported");
            assert.notProperty(res.body[0], "delete_password");
            testId = res.body[0]._id;
            testId2 = res.body[1]._id;
            done();
          });
      });
    });

    suite("DELETE", function(done) {
      test("delete thread with good password", function(done) {
        chai
          .request(server)
          .delete("/api/threads/test")
          .send({ thread_id: testId, delete_password: "123" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });

      test("delete thread with bad password", function(done) {
        chai
          .request(server)
          .delete("/api/threads/test")
          .send({ thread_id: testId2, delete_password: "321" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });
    });

    suite("PUT", function() {
      test("report thread", function(done) {
        chai
          .request(server)
          .put("/api/threads/test")
          .send({ thread_id: testId2 })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    suite("POST", function() {
      test("reply to thread", function(done) {
        chai
          .request(server)
          .post("/api/replies/test")
          .send({
            thread_id: testId2,
            text: "My number is " + testText,
            delete_password: "123"
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            done();
          });
      });
    });

    suite("GET", function() {
      test("Get all replies for 1 thread", function(done) {
        chai
          .request(server)
          .get(`/api/replies/test?thread_id=${testId2}`)
          .end(function(err, res) {
            assert.equal(res.status, 200);
            console.log(res.body)
            assert.property(res.body, "_id");
            assert.property(res.body, "created_on");
            assert.property(res.body, "bumped_on");
            assert.property(res.body, "text");
            assert.property(res.body, "replies");
            assert.notProperty(res.body, "delete_password");
            assert.notProperty(res.body, "reported");
            assert.isArray(res.body.replies);
            assert.notProperty(res.body.replies[0], "delete_password");
            assert.notProperty(res.body.replies[0], "reported");
            assert.equal(
              res.body.replies[res.body.replies.length - 1].text,
              "My number is " + testText
            );
            done();
          });
      });
    });

    suite("PUT", function() {
      test("report reply", function(done) {
        chai
          .request(server)
          .put("/api/threads/test")
          .send({ thread_id: testId2, reply_id: testId2 })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });

    suite("DELETE", function() {
      test("delete reply with bad password", function(done) {
        chai
          .request(server)
          .delete("/api/threads/test")
          .send({
            thread_id: testId2,
            reply_id: testId3,
            delete_password: "321"
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });

      test("delete reply with valid password", function(done) {
        chai
          .request(server)
          .delete("/api/threads/test")
          .send({
            thread_id: testId2,
            reply_id: testId3,
            delete_password: "123"
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });
  });
});
