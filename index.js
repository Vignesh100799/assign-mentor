const express = require('express');
const { MongoClient, ObjectId } = require("mongodb");
const app = express()
const dotenv = require('dotenv').config();
const port = 4005;
const URL = process.env.DB;
const mentors = [];
const students = [];

app.use(express.json())
// API to create Mentor

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


// ------------------------------------------------------------------


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
// ------------------------------------------------------

// API to create Student

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

// API to Assign a student to Mentor

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

// API to A student who has a mentor should not be shown in List

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
        const nonMentorStudent = students.find(student => student.oldMentor === null || student.currentMentor === null);

        if (nonMentorStudent) {
            res.send(nonMentorStudent);
        } else {
            res.send({ message: "All students assigned for mentors" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

// API to Assign or Change Mentor for particular Student
// Select One Student and Assign one Mentor

app.post("/change-mentor", async (req, res) => {
    try {
        const mentorId = req.body.mentorId;
        const studentId = req.body.studentId;
        const newcurrentMentor = req.body.currentMentor;
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
            { $set: { oldMentor: student.currentMentor, currentMentor: newcurrentMentor } }
        );


        await mentorsCollection.updateOne(
            { _id: mentorObjectId },
            { $push: { students: { studentName: student.studentName, studentMail: student.studentMail, studentId: studentObjectId } } }
        );

        connection.close();

        res.send({ success: true, student });
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});


app.get("/all-students", async (req, res) => {
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


// API to show all students for a particular mentor

app.get("/:mentorName/students", async (req, res) => {

    try {
        const mentorName = req.params.mentorName;

   

        const connection = await MongoClient.connect(URL);
        const db = connection.db("class");
        const mentorsCollection = db.collection("mentors");
        const mentor = await mentorsCollection.findOne({});

        res.send(mentor.students)
    } catch (error) {
        console.log(error)
    }
})

    //  API to show the previously assigned mentor for a particular student.


    app.get("/oldmentor-by-student/:studentName", async (req, res) => {
        try {
            const studentName = req.params.studentName;
       
            const connection = await MongoClient.connect(URL);
            const db = connection.db("class");
            const studentsCollection = db.collection("students");
            const student = await studentsCollection.findOne({studentName : studentName });

            res.send({ oldMentor: student.oldMentor})
        } catch (error) {
            console.log(error)
        }
    })
app.listen(port)
