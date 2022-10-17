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

            // console.log("json->", json[1])

            let len = Object.keys(json[0]).length;

            // console.log("json", json[0]);

            let objs = [];

            let error = {};

            //it contains the name of the key -> 1st row acting as a key
            // json[0]-> {
            //     keys: 'productItem',
            //     English: 'Product Item',
            //     Bangala: 'পণ্য আইটেম',
            //     Hindi: 'उत्पाद',
            //     Kannada: 'ಉತ್ಪನ್ನದ ವಸ್ತುಗಳು',
            //     Odia: 'ଉତ୍ପାଦ ବସ୍ତୁ',
            //     Assamese: 'প্ৰডাক্ট আইটেম',
            //     Gujarati: 'ઉત્પાદીત વસ્તુ',
            //     Marathi: 'उत्पादन वस्तू',
            //     Malayalam: 'ഉൽപ്പന്ന ഇനം',
            //     punjabi: 'ਉਤਪਾਦ ਆਈਟਮ',
            //     Tamil: 'தயாரிப்பு உருப்படி',
            //     Telugu: 'ఉత్పత్తి అంశం'
            //   }

            let naming = [];

            let duplicate = {}, already = {}

            Object.keys(json[0]).forEach((key) => {
                naming.push(key);
            })

            //len -> it tells that how many languages are there -> that is how many columns arw eth
            for (let i = 0; i < len; i++) {
                let now = new Object();
                now['System'] = {};
                objs.push(now);
            }


            for (let i = 0; i < Object.keys(json).length; i++) {

                let arr = [];

                let word = json[i]['keys']

                //it is for taking out duplicate keys
                if (word in already) {
                    duplicate[word] += 1;
                }

                already[word] = 1;

                //iterating each row of the csv file
                Object.keys(json[i]).forEach(key => {

                    //val = json[3]['Hindi'] = कीमत|
                    let val = json[i][key];

                    if (spChar(val)) {
                        if (i + 2 in error)
                            error[i + 2][key] = val;
                        else {
                            error[i + 2] = new Object();
                            // error[6]['Hindi'] = कीमत|
                            error[i + 2][key] = val;
                        }
                    }

                    arr.push(val);
                    //Item,পণ্য,वस्तु,ಕಲೆ,ଆଇଟମ୍,সামগ্ৰী,વસ્તુ,वस्तू,ഇനം,ਆਈਟਮ,உருப்படி,వస్తువు
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
                fs.writeFileSync("./v4/" + naming[i] + "_v4.json", JSON.stringify(objs[i], null, 4), "utf-8", (err) => {
                    // if (err) console.log(err)
                })
            }

            fs.writeFileSync("./v4/error.json", JSON.stringify(error, null, 4), "utf-8", (err) => {
                // if (err) console.log(err)
            })

            fs.writeFileSync("./v4/duplicate.json", JSON.stringify(duplicate, null, 4), "utf-8", (err) => {
                // if (err) console.log(err)
            })
        })

    res.render('home');
})

app.listen(1341)