const express = require('express');
const app = express();
const { Datastore } = require('@google-cloud/datastore');
const bodyParser = require('body-parser');
const { entity } = require('@google-cloud/datastore/build/src/entity');
const datastore = new Datastore();

const router = express.Router();

// create a consts to store the entity names
const USERS = "Users";
const POSTS = "Posts";
const COMMENTS = "Comments";


app.use(bodyParser.json());
app.enable('trust proxy');


function fromDatastore(item) {
    item.id = item[Datastore.KEY].id;
    return item;
}


/* -------------Users Model Functions ------------- */


/*
Params: Function takes three user attributes and creates a new entity
in Google Datastore using the provideed attributes.

Returns: The function returns the key to the created entity.
*/
function createUser(firstName, lastName, userName) {
    let key = datastore.key(USERS);
    const newUser = { "firstName": firstName, "lastName": lastName, "userName": userName};
    return datastore.save({ "key": key, "data": newUser }).then(() => { return key });
}

/*
Params: Function takes a userID and fetches a user entity
from Google Datastore using the provided ID.

Returns: The function returns the user entity.
*/
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

/*
Params:None

Returns: All user entities in Datastore
*/
function getUsers() {
    const q = datastore.createQuery(USERS);
    return datastore.runQuery(q).then((entities) => {
        // Use Array.map to call the function fromDatastore. This function
        // adds id attribute to every element in the array at element 0 of
        // the variable entities
        return entities[0].map(fromDatastore);
    });
}


/*
Function that takes new post attributes and replaces an existing post
with the provided attributes

Params: id: the existing post ID
        content: the updated content
        creationDate: the updated creation date, or editing date
        public: the new public status (true or false)

Returns: None
*/
function editPost(id, content, creationDate, public) {
    const key = datastore.key([POSTS, parseInt(id, 10)]);
    const post = { "content": content, "creationDate": creationDate, "public": public };
    return datastore.save({ "key": key, "data": post });
}


/* -------------Posts Model Functions ------------- */

/*
Function takes three post attributes and creates a new entity
in Google Datastore using the provided attributes.

Params: content: the post content.
        creationDate: the date the post was created.
        public: true if post is public, false if private.

Returns: The function returns the key to the created entity.
*/
function createPost(content, creationDate, public) {
    let key = datastore.key(POSTS);
    const newPost = { "content": content, "creationDate": creationDate, "public": public};
    return datastore.save({ "key": key, "data": newPost }).then(() => { return key });
}


/*
Function takes a postID and fetches a post entity
from Google Datastore using the provided ID.

Params: postID: the post's ID

Returns: The function returns the post entity with the provided ID.
*/
function getPost(postID) {
    // get key from Datastore using the provided userID
    const key = datastore.key([POSTS, parseInt(postID, 10)]);
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

/*
Function queries Datastore and returns all posts.
Params:None

Returns: All post entities in Datastore
*/
function getPosts() {
    const q = datastore.createQuery(POSTS);
    return datastore.runQuery(q).then((entities) => {
        // Use Array.map to call the function fromDatastore. This function
        // adds id attribute to every element in the array at element 0 of
        // the variable entities
        return entities[0].map(fromDatastore);
    });
}

/*
Function deletes a post from Datastore that corresponds 
with the provided postID
Params:postID: the ID of the post to be deleted.

Returns: None
*/
function deletePost(postID) {
    const key = datastore.key([POSTS, parseInt(postID, 10)]);
    return datastore.delete(key);
}


/* -------------Comments Model Functions ------------- */

/*
Function takes three comment attributes and creates a new entity
in Google Datastore using the provided attributes.

Params: content: the comment content.
        creationDate: the date the comment was created.
        upvote: true if comment is upvoting the post, false if not.

Returns: The function returns the key to the created entity.
*/
function createComment(content, creationDate, upvote) {
    let key = datastore.key(COMMENTS);
    const newComment = { "content": content, "creationDate": creationDate, "upvote": upvote};
    return datastore.save({ "key": key, "data": newComment }).then(() => { return key });
}


/*
Function takes a commendID and fetches a comment entity
from Google Datastore using the provided ID.

Params: commentID: the comment's ID

Returns: The function returns the comment entity with the provided ID.
*/
function getComment(commentID) {
    // get key from Datastore using the provided userID
    const key = datastore.key([COMMENTS, parseInt(commentID, 10)]);
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


/*
Get a user from Datastore using a userID
*/
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


/*
Get all user entities from Datastore
*/
router.get('/users', function(req,res){
    getUsers().then(users => {
        res.status(200).json(users);
    })
})


/* -------------Posts Controller Functions ------------- */

/*
Create a new post entity
*/
router.post('/posts', function (req,res){
    // check if all the required post attributes are provided
    if(!("content" in req.body) || !("creationDate" in req.body) || !("public" in req.body)){
        // send back an error if an attribute is missing
        res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' });
    } else {
        // get the content, creationDate, and public status from the request body
        const content = req.body.content;
        const creationDate = req.body.creationDate;
        const public = req.body.public;
        // create a new post in Datastore
        createPost(content, creationDate, public).then((key) => {
            // create a self link that points to the new post using the post information
            const self = req.protocol + "://" + req.get("host") + "/posts/" + key.id;  
            // send a successful response and a JSON object that contains the post information
            res.status(201).json({"id": key.id, "content": content, "creationDate": creationDate, "public": public, "self": self});
        })
    }
});


/*
Get a post from Datastore using a postID
*/
router.get('/posts/:post_id', function(req,res){
    // get the postID from the path parameters
    const postID = req.params.post_id

    // call a function to get the post from Datastore, then return the post if exists
    getPost(postID).then(entity => {
        // get the user object
        const post = entity[0]; 
        if (post === undefined || post === null) {
            res.status(404).json({'Error': 'No post with postID exists.'});
        } else {
            // construct a self link
            const self = req.protocol + "://" + req.get("host") + "/posts/" + postID;

            // add the self attribute to the user object
            post['self'] = self;

            // return the post object
            res.status(200).json(post);
        }
    })
});

/*
Get all post entities from Datastore
*/
router.get('/posts', function(req,res){
    getPosts().then(posts => {
        res.status(200).json(posts);
    })
})


/*
Delete a post from Datastore using a postID
*/

router.delete('/posts/:post_id', function (req, res) {

    // get the post ID
    const postID = req.params.post_id;

    // check if there's a post with this ID
    getPost(postID)
        .then(entity => {
            const post = entity[0];
            // check if the returned result is empty, meaning there's not post with this postID
            if (post === undefined || post === null) {
                // The 0th element is undefined. This means there is no post with this id
                res.status(404).json({ 'Error': 'No post with this postID exists' });
            } else {       
                    // delete the post and return status 204 with no content
                    deletePost(postID).then(res.status(204).end());
            }
        });
});


/*
Edit a post
*/

router.put('/posts/:post_id', function (req, res) {
    // check if one of the required attributes is missing
    if (!("content" in req.body) || !("creationDate" in req.body) || !("public" in req.body)){
        res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' });
    } else {
        // get the postID form the request path parameters
        const postID = req.params.post_id;

        // check if the post to be edited actually exists
        getPost(postID).then(post => {
            if (post[0] === undefined || post[0] === null) {

                // The 0th element is undefined. This means there is no post with this id
                res.status(404).json({ 'Error': 'No post with this post_id exists' });

            } else {
                // get the new post attributes
                const content = req.body.content;
                const creationDate = req.body.creationDate;
                const public = req.body.public;

                // edit the post in Datastore
                editPost(postID, content, creationDate, public).then(key => {
                    
                    // create the self link that points to the new post object
                    const self = req.protocol + "://" + req.get("host") + "/posts/" + postID;

                    // form the new post object
                    const newPost = {"id": postID, "content": content, "creationDate": creationDate, "public": public, "self": self};

                    // return a success and the newly edited post object
                    res.status(200).json(newPost);
                })
            }
        })
    }
});


/*
partially update a post
*/
router.patch('/posts/:post_id', function (req, res) {
    // get the postID
    const postID = req.params.post_id;

    // get the attributes to be edited
    const attributes = req.body;

    // first check if the post actually exists
    getPost(postID).then(post => {
        if (post[0] === undefined || post[0] === null) {

            // The 0th element is undefined. This means there is no post with this id
            res.status(404).json({ 'Error': 'No post with this post_id exists' });

        } else {
            // get the old post object
            const oldPost = post[0];

            // get the attributes to be updated and update the old post object accordingly
            if ("content" in attributes) {
                oldPost["content"] = attributes["content"];
            }
            if ("creationDate" in attributes) {
                oldPost["creationDate"] = attributes["creationDate"];
            }
            if ("public" in attributes) {
                oldPost["public"] = attributes["public"];
            }

            // edit the post 
            editPost(postID, oldPost.content, oldPost.creationDate, oldPost.public).then(key => {
               // create the self link that points to the new post object
               const self = req.protocol + "://" + req.get("host") + "/posts/" + postID;

               // add the self link to the updated post object
               oldPost["self"] = self;
               // return a success and the newly edited post object
               res.status(200).json(oldPost);
            })
        }
    })
});


/* -------------Comments Controller Functions ------------- */

/*
Create a new comment
*/
router.post('/comments', function (req,res){
    // check if all the required comment attributes are provided
    if(!("content" in req.body) || !("creationDate" in req.body) || !("upvote" in req.body)){
        // send back an error if an attribute is missing
        res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' });
    } else {
        // get the content, creationDate, and upvote from the request body
        const content = req.body.content;
        const creationDate = req.body.creationDate;
        const upvote = req.body.upvote;
        // create a new comment in Datastore
        createComment(content, creationDate, upvote).then((key) => {
            // create a self link that points to the new comment using the post information
            const self = req.protocol + "://" + req.get("host") + "/comments/" + key.id;  
            // send a successful response and a JSON object that contains the comment information
            res.status(201).json({"id": key.id, "content": content, "creationDate": creationDate, "upvote": upvote, "self": self});
        })
    }
});



/*
Get a comment from Datastore using a commentID
*/
router.get('/comments/:comment_id', function(req,res){
    // get the commentID from the path parameters
    const commentID = req.params.comment_id;

    // call a function to get the comment from Datastore, then return the comment if exists
    getComment(commentID).then(entity => {
        // get the comment object
        const comment = entity[0]; 
        if (comment === undefined || comment === null) {
            res.status(404).json({'Error': 'No comment with commentID exists.'});
        } else {
            // construct a self link
            const self = req.protocol + "://" + req.get("host") + "/comments/" + commentID;

            // add the self attribute to the user object
            comment['self'] = self;

            // return the post object
            res.status(200).json(comment);
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