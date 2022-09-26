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

function spChar(str) {
    const specialChars = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    return specialChars.test(str);
}

app.post("/files", upload.single('csv'), async (req, res) => {

    let files = req.file;

    csvtojson()
        .fromFile(csvfilepath, { encoding: 'utf-8' })
        .then((json) => {

            // console.log(json)

            let len = Object.keys(json[0]).length;

            // console.log("json", json[0]);

            let objs = [];

            let error = {};

            let naming = [];

            let duplicate = {}, already = {}

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

                let word = json[i]['keys']

                if (word in already) {
                    duplicate[word] += 1;
                }

                already[word] = 1;

                Object.keys(json[i]).forEach(key => {

                    let val = json[i][key];

                    if (spChar(val)) {
                        if (i + 2 in error)
                            error[i + 2][key] = val;
                        else {
                            error[i + 2] = new Object();
                            error[i + 2][key] = val;
                        }
                    }
                    arr.push(val);
                })

                if (arr[0] == "item")
                    console.log(arr)

                for (let m = 0; m < arr.length; m++) {

                    objs[m]["System"][arr[0]] = arr[m];

                }

                arr = [];
            }

            // console.log(error);

            for (let i = 1; i < len; i++) {
                fs.writeFileSync(naming[i] + "_v4.json", JSON.stringify(objs[i], null, 4), "utf-8", (err) => {
                    // if (err) console.log(err)
                })
            }

            fs.writeFileSync("error.json", JSON.stringify(error, null, 4), "utf-8", (err) => {
                // if (err) console.log(err)
            })

            fs.writeFileSync("duplicate.json", JSON.stringify(duplicate, null, 4), "utf-8", (err) => {
                // if (err) console.log(err)
            })
        })

    res.render('home');
})

app.listen(1341)