const express = require('express');

const app = express();

const csvtojson = require('csvtojson')

const fs = require('fs')

app.use(express.urlencoded({ extended: true }));

const multer = require('multer');

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./files");
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split("/")[1];
        cb(null, "files.csv");
    },
});

const multerFilter = (req, file, cb) => {
    if (file.mimetype.split("/")[1] === "csv") {
        cb(null, true);
    } else {
        cb(new Error("Not a PDF File!!"), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

app.set('view engine', 'ejs');

app.get("/", (req, res) => {
    res.render('home');
})


const csvfilepath = "./files/files.csv"

app.post("/files", upload.single('csv'), async (req, res) => {

    let files = req.file;

    csvtojson()
        .fromFile(csvfilepath)
        .then((json) => {

            let len = Object.keys(json[0]).length;

            console.log(json[0]);

            let objs = [];

            let naming = [];

            Object.keys(json[0]).forEach((key) => {
                naming.push(key);
            })

            for (let i = 0; i < len; i++) {
                let now = new Object();
                now['System'] = {};
                objs.push(now);
            }

            for (let i = 0; i < Object.keys(json).length; i++) {

                let arr = [];

                Object.keys(json[i]).forEach(key => {

                    let val = json[i][key];

                    arr.push(val);
                })

                for (let m = 0; m < arr.length; m++) {

                    objs[m]["System"][arr[0]] = arr[m];

                }

                arr = [];
            }

            for (let i = 1; i < len; i++) {
                fs.writeFileSync(naming[i] + ".json", JSON.stringify(objs[i], null, 4), "utf-8", (err) => {
                    if (err) console.log(err)
                })
            }
        })

    res.render('home');
})

app.listen(1342)