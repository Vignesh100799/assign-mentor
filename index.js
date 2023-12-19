const express = require('express');
const { MongoClient, ObjectId } = require("mongodb");
const URL = "mongodb://localhost:27017";
const app = express()
const port = 4005;
const mentors = [];
const students = [];

app.use(express.json())

app.post("/create-mentor", async (req, res) => {
    try {
        const connection = await MongoClient.connect(URL)
        const db = connection.db("class")
        const mentor = await db.collection("mentors").insertOne({
            mentorName: req.body.mentorName,
            mentorMail: req.body.mentorMail,
            students: []
        })
        mentors.push(mentor)
        res.send({
            message: 'Mentor created successfully',
            mentor: {
                mentorId: mentor.insertedId.toString(),
                mentorName: req.body.mentorName,
                mentorMail: req.body.mentorMail,
                students: []
            }
        });
    } catch (error) {
        console.log(error)
    }
})
app.get("/mentors", async (req, res) => {
    try {
        const connection = await MongoClient.connect(URL);
        const db = connection.db("class");
        const mentorsData = await db.collection("mentors").find({}).toArray();
        const mentors = mentorsData.map((item) => ({
            mentorId: item._id.toString(),
            mentorName: item.mentorName,
            mentorMail: item.mentorMail,
            students: []
        }));
        connection.close();
        res.send(mentors);
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});
app.post("/create-student", async (req, res) => {
    try {
        const newStudent = {
            studentName: req.body.studentName,
            studentMail: req.body.studentMail,
            oldMentor: null,
            currentMentor: null
        };
        students.push(newStudent);

        const connection = await MongoClient.connect(URL);
        const db = connection.db("class");

        const student = await db.collection('students').insertOne(newStudent);
        connection.close();

        res.send({
            message: 'Student created successfully',
            newStudent: {
                studentId: student.insertedId.toString(),
                studentName: req.body.studentName,
                studentMail: req.body.studentMail,
                oldMentor: null,
                currentMentor: null
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});
app.get("/students", async (req, res) => {
    try {
        const connection = await MongoClient.connect(URL);
        const db = connection.db("class");
        const studentsData = await db.collection("students").find({}).toArray();
        const students = studentsData.map((item) => ({
            studentId: item._id.toString(),
            studentName: item.studentName,
            studentMail: item.studentMail,
            oldMentor: item.oldMentor,
            currentMentor: item.currentMentor
        }));
        connection.close();
        res.send(students);
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});
app.post("/studentToMentor", async (req, res) => {
    try {
        const mentorId = req.body.mentorId;
        const studentId = req.body.studentId;

        const mentorObjectId = new ObjectId(mentorId);
        const studentObjectId = new ObjectId(studentId);

        const connection = await MongoClient.connect(URL);
        const db = connection.db("class");
        const mentorsCollection = db.collection("mentors");
        const studentsCollection = db.collection("students");

     
        const mentor = await mentorsCollection.findOne({ _id: mentorObjectId });
        const student = await studentsCollection.findOne({ _id: studentObjectId });

        if (!mentor || !student) {
            res.status(404).send({ error: "Mentor or student not found" });
            return;
        }


        await studentsCollection.updateOne(
            { _id: studentObjectId },
            { $set: { oldMentor: student.currentMentor, currentMentor: mentor.mentorName } }
        );


        await mentorsCollection.updateOne(
            { _id: mentorObjectId },
            { $push: { students: { studentName: student.studentName, studentMail: student.studentMail, studentId: studentObjectId } } }
        );

        connection.close();

        res.send({ success: true, mentor });
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});
app.get("/studentsAvailable", async (req, res) => {
    try {
        const connection = await MongoClient.connect(URL);
        const db = connection.db("class");
        const studentsData = await db.collection("students").find({}).toArray();
        const students = studentsData.map((item) => ({
            studentId: item._id.toString(),
            studentName: item.studentName,
            studentMail: item.studentMail,
            oldMentor: item.oldMentor,
            currentMentor: item.currentMentor
        }));
        connection.close();
        res.send(students);
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});
app.listen(port)