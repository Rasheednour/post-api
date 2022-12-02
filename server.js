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


/* -------------Users Model Functions ------------- */

function createUser(firstName, lastName, userName) {
    let key = datastore.key(USERS);
    const newUser = { "firstName": firstName, "lastName": lastName, "userName": userName};
    return datastore.save({ "key": key, "data": newUser }).then(() => { return key });
}

/* -------------Home Page Controller Functions ------------- */


router.get('/', function (req, res) {
    res.send("Welcome to Posts-API");
 });


/* -------------Users Controller Functions ------------- */

router.post('/users', function (req,res){
    // check if all the required user attributes are provided
    if(!("firstName" in req.body) || !("lastName" in req.body) || !("userName" in req.body)){
        // send back an error if an attribute is missing
        res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' });
    } else {
        // get the firstName, lastName, and userName from the request body
        const firstName = req.body.firstName;
        const lastName = req.body.lastname;
        const userName = req.body.userName;
        // create a new user in Datastore
        createUser(firstName, lastName, userName).then((key) => {
            // create a self link that points to the new user using the user information
            const self = req.protocol + "://" + req.get("host") + "/users/" + key.id;  
            // send a successful response and a JSON object that contains the user information
            res.status(201).json({"id": key.id, "firstName": firstName, "lastName": lastName, "userName": userName, "self": self});
        })
    }
});



/* -------------Start Server ------------- */


app.use('/', router);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});