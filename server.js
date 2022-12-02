const express = require('express');
const app = express();
const { Datastore } = require('@google-cloud/datastore');
const bodyParser = require('body-parser');
const datastore = new Datastore();

const router = express.Router();

const USERS = "Users";

app.use(bodyParser.json());
app.enable('trust proxy');


function fromDatastore(item) {
    item.id = item[Datastore.KEY].id;
    return item;
}


/* -------------Home Page Controller Function ------------- */


router.get('/', function (req, res) {
    res.send("Welcome to Posts-API");
 });

/* -------------Start Server ------------- */


app.use('/', router);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});