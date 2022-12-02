const express = require('express');
const app = express();
const { Datastore } = require('@google-cloud/datastore');
const bodyParser = require('body-parser');
const { entity } = require('@google-cloud/datastore/build/src/entity');
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


/*
Params: Function takes three user attributes and creates a new entity
in Google Datastore using the provideed attribtutes.

Returns: The function returns the key to the created entity.
*/
function createUser(firstName, lastName, userName) {
    let key = datastore.key(USERS);
    const newUser = { "firstName": firstName, "lastName": lastName, "userName": userName};
    return datastore.save({ "key": key, "data": newUser }).then(() => { return key });
}


function getUser(userID) {
    // get key from Datastore using the provided userID
    const key = datastore.key([USERS, parseInt(userID, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
            // if no entity is found, the user doesn't exist
            return entity;
        } else {
            // if an entity is found, return the user
            return entity.map(fromDatastore);
        }
    });
}

/* -------------Home Page Controller Functions ------------- */


router.get('/', function (req, res) {
    res.send("Welcome to Posts-API");
 });


/* -------------Users Controller Functions ------------- */

/*
Create a new user entity
*/
router.post('/users', function (req,res){
    // check if all the required user attributes are provided
    if(!("firstName" in req.body) || !("lastName" in req.body) || !("userName" in req.body)){
        // send back an error if an attribute is missing
        res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' });
    } else {
        // get the firstName, lastName, and userName from the request body
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
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

router.get('/users/:user_id', function(req,res){
    // get the userID from the path parameters
    const userID = req.params.user_id

    // call a function to get the user from Datastore, then return the user if exists
    getUser(userID).then(entity => {
        // get the user object
        const user = entity[0]; 
        if (user === undefined || user === null) {
            res.status(404).json({'Error': 'No user with userID exists.'});
        } else {
            // construct a self link
            const self = req.protocol + "://" + req.get("host") + "/users/" + userID;

            // add the self attribute to the user object
            user['self'] = self;

            // return the user object
            res.status(200).json(user);
        }
    })
});

/* -------------Start Server ------------- */


app.use('/', router);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});