require("dotenv").config();

const express = require("express");
const multer = require("multer");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();

const PORT = process.env.PORT || 3000;

// -------------------------
// FOLDERS
// -------------------------

const uploadFolder = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}


// -------------------------
// DATABASE FILE
// -------------------------

const databaseFile = path.join(__dirname, "papers.json");

if (!fs.existsSync(databaseFile)) {
    fs.writeFileSync(databaseFile, "[]");
}


// -------------------------
// MIDDLEWARE
// -------------------------

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


// -------------------------
// SESSION
// -------------------------

app.use(
    session({
        secret: process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,

            secure: false,

            maxAge: 1000 * 60 * 60 * 2
        }
    })
);


// -------------------------
// PUBLIC WEBSITE
// -------------------------

app.use(express.static(
    path.join(__dirname, "public")
));


// -------------------------
// PDF FILES
// -------------------------



// -------------------------
// MULTER
// -------------------------

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, uploadFolder);

    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() +
            "-" +
            file.originalname.replace(/\s+/g, "-");

        cb(null, uniqueName);

    }

});


const upload = multer({

    storage: storage,

    fileFilter: function (req, file, cb) {

        if (file.mimetype === "application/pdf") {

            cb(null, true);

        } else {

            cb(
                new Error("Only PDF files are allowed")
            );

        }

    },

    limits: {

        fileSize: 20 * 1024 * 1024

    }

});


// -------------------------
// DATABASE FUNCTIONS
// -------------------------

function getPapers() {

    return JSON.parse(
        fs.readFileSync(
            databaseFile,
            "utf8"
        )
    );

}


function savePapers(papers) {

    fs.writeFileSync(

        databaseFile,

        JSON.stringify(
            papers,
            null,
            2
        )

    );

}


// -------------------------
// ADMIN AUTHENTICATION
// -------------------------

function requireAdmin(req, res, next) {

    if (
        req.session &&
        req.session.isAdmin === true
    ) {

        next();

    } else {

        res.status(401).json({

            message: "Admin login required."

        });

    }

}


// -------------------------
// ADMIN LOGIN
// -------------------------

app.post("/api/admin/login", (req, res) => {

    const {
        password
    } = req.body;


    if (
        password &&
        password === process.env.ADMIN_PASSWORD
    ) {

        req.session.isAdmin = true;


        return res.json({

            success: true,

            message: "Admin login successful."

        });

    }


    res.status(401).json({

        success: false,

        message: "Incorrect password."

    });

});


// -------------------------
// ADMIN LOGOUT
// -------------------------

app.post("/api/admin/logout", (req, res) => {

    req.session.destroy(() => {

        res.json({

            success: true,

            message: "Logged out successfully."

        });

    });

});


// -------------------------
// CHECK ADMIN LOGIN
// -------------------------

app.get("/api/admin/status", (req, res) => {

    res.json({

        loggedIn:
            req.session &&
            req.session.isAdmin === true

    });

});


// -------------------------
// GET PAPERS
// PUBLIC
// -------------------------

app.get("/api/papers", (req, res) => {

    const papers = getPapers();

    res.json(papers);

});


// -------------------------
// UPLOAD PAPER
// ADMIN ONLY
// -------------------------

app.post("/api/upload", upload.single("pdf"), async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                message: "Please select a PDF file."
            });
        }

        const {
            title,
            subject,
            branch,
            semester,
            year
        } = req.body;

        if (!title || !subject || !branch || !semester || !year) {

            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(400).json({
                message: "Please fill all fields."
            });
        }

        // Upload PDF to Cloudinary
        const cloudinaryResult = await cloudinary.uploader.upload(
            req.file.path,
            {
                resource_type: "image",
                folder: "semester-question-papers",
                public_id: path.parse(req.file.filename).name
            }
        );

        // Delete temporary local file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        const papers = getPapers();

        const newPaper = {

            id: Date.now(),

            title: title,

            subject: subject,

            branch: branch,

            semester: semester,

            year: year,

            filename: req.file.filename,

            originalName: req.file.originalname,

            url: cloudinaryResult.secure_url,

            cloudinaryPublicId: cloudinaryResult.public_id,

            date: new Date().toISOString()

        };

        papers.push(newPaper);

        savePapers(papers);

        res.json({
            message: "Question paper uploaded successfully!",
            paper: newPaper
        });

    } catch (error) {

        console.error("UPLOAD ERROR:", error);

        // Remove temporary file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            message: "Something went wrong while uploading the PDF."
        });
    }
});


// -------------------------
// EDIT PAPER
// ADMIN ONLY
// -------------------------

app.put(
    "/api/papers/:id",
    requireAdmin,
    (req, res) => {

        const id =
            Number(req.params.id);


        const papers = getPapers();


        const paper =
            papers.find(
                p => p.id === id
            );


        if (!paper) {

            return res.status(404).json({

                message:
                    "Paper not found."

            });

        }


        const {
            title,
            subject,
            branch,
            semester,
            year
        } = req.body;


        if (title)
            paper.title = title;

        if (subject)
            paper.subject = subject;

        if (branch)
            paper.branch = branch;

        if (semester)
            paper.semester = semester;

        if (year)
            paper.year = year;


        savePapers(papers);


        res.json({

            success: true,

            message:
                "Paper updated successfully.",

            paper: paper

        });

    }
);


// -------------------------
// DELETE PAPER
// ADMIN ONLY
// -------------------------

app.delete(
    "/api/papers/:id",
    requireAdmin,
    async (req, res) => {

        const id =
            Number(req.params.id);


        const papers = getPapers();


        const paper =
            papers.find(
                p => p.id === id
            );


        if (!paper) {

            return res.status(404).json({

                message:
                    "Paper not found."

            });

        }


        if (paper.cloudinaryPublicId) {

    await cloudinary.uploader.destroy(
        paper.cloudinaryPublicId,
        {
            resource_type: "image"
        }
    );

}


        const updatedPapers =
            papers.filter(
                p => p.id !== id
            );


        savePapers(
            updatedPapers
        );


        res.json({

            success: true,

            message:
                "Paper deleted successfully."

        });

    }
);


// -------------------------
// ERROR HANDLING
// -------------------------

app.use(
    (err, req, res, next) => {

        console.error(err);


        if (
            err.message ===
            "Only PDF files are allowed"
        ) {

            return res.status(400).json({

                message:
                    "Only PDF files are allowed."

            });

        }


        res.status(500).json({

            message:
                "Server error."

        });

    }
);


// -------------------------
// START SERVER
// -------------------------

app.listen(
    PORT,"0.0.0.0",
    () => {

        console.log(
            `Website running on port ${PORT}`
        );

    }
)