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
function getPosts(req) {
    

    // run a query on Datastore to get all posts
    const query = datastore.createQuery(POSTS);
    return datastore.runQuery(query).then((entities) => {
        // get total number of posts in Datastore
        const totalItems = entities[0].length;
        
        // run another query for posts, but limit results this time
        let q = datastore.createQuery(POSTS).limit(5);
        let results = {};
        let prev;

        if(Object.keys(req.query).includes("cursor")){
            prev = req.protocol + "://" + req.get("host") + "/posts" + "?cursor=" + req.query.cursor;
            q = q.start(req.query.cursor);
        }
        return datastore.runQuery(q).then( (entities) => {
            results.posts = entities[0].map(fromDatastore);
            // if(typeof prev !== 'undefined'){
            //     results.previous = prev;
            // }
            if(entities[1].moreResults !== Datastore.NO_MORE_RESULTS ){
                results.next = req.protocol + "://" + req.get("host") + "/posts" + "?cursor=" + entities[1].endCursor;
                results.total_items = totalItems;
            }
            return results;
        });
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


/*
Function queries Datastore and returns all comments.
Params:None

Returns: All comment entities in Datastore
*/
function getComments() {
    const q = datastore.createQuery(COMMENTS);
    return datastore.runQuery(q).then((entities) => {
        // Use Array.map to call the function fromDatastore. This function
        // adds id attribute to every element in the array at element 0 of
        // the variable entities
        return entities[0].map(fromDatastore);
    });
}


/*
Function deletes a comment from Datastore that corresponds 
with the provided commentID
Params:commentID: the ID of the comment to be deleted.

Returns: None
*/
function deleteComment(commentID) {
    const key = datastore.key([COMMENTS, parseInt(commentID, 10)]);
    return datastore.delete(key);
}


/*
Function that takes new comment attributes and replaces an existing comment
with the provided attributes

Params: id: the existing comment ID
        content: the updated content
        creationDate: the updated creation date, or editing date
        upvote: the new public upvote (true or false)

Returns: None
*/
function editComment(id, content, creationDate, upvote) {
    const key = datastore.key([COMMENTS, parseInt(id, 10)]);
    const comment = { "content": content, "creationDate": creationDate, "upvote": upvote };
    return datastore.save({ "key": key, "data": comment });
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
    getPosts(req).then(posts => {
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



/*
Get all comment entities from Datastore
*/
router.get('/comments', function(req,res){
    getComments().then(comments => {
        res.status(200).json(comments);
    })
})


/*
Delete a comment from Datastore using a commentID
*/

router.delete('/comments/:comment_id', function (req, res) {

    // get the post ID
    const commentID = req.params.comment_id;

    // check if there's a post with this ID
    getComment(commentID)
        .then(entity => {
            const comment = entity[0];
            // check if the returned result is empty, meaning there's not comment with this commentID
            if (comment === undefined || comment === null) {
                // The 0th element is undefined. This means there is no comment with this id
                res.status(404).json({ 'Error': 'No comment with this commentID exists' });
            } else {       
                    // delete the post and return status 204 with no content
                    deleteComment(commentID).then(res.status(204).end());
            }
        });
});


/*
Edit a comment
*/

router.put('/comments/:comment_id', function (req, res) {
    // check if one of the required attributes is missing
    if (!("content" in req.body) || !("creationDate" in req.body) || !("upvote" in req.body)){
        res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' });
    } else {
        // get the commentID form the request path parameters
        const commentID = req.params.comment_id;

        // check if the comment to be edited actually exists
        getComment(commentID).then(comment => {
            if (comment[0] === undefined || comment[0] === null) {

                // The 0th element is undefined. This means there is no comment with this id
                res.status(404).json({ 'Error': 'No post with this post_id exists' });

            } else {
                // get the new post attributes
                const content = req.body.content;
                const creationDate = req.body.creationDate;
                const upvote = req.body.upvote;

                // edit the commment in Datastore
                editComment(commentID, content, creationDate, upvote).then(key => {
                    
                    // create the self link that points to the new comment object
                    const self = req.protocol + "://" + req.get("host") + "/comments/" + commentID;

                    // form the new comment object
                    const newComment = {"id": commentID, "content": content, "creationDate": creationDate, "upvote": upvote, "self": self};

                    // return a success and the newly edited comment object
                    res.status(200).json(newComment);
                })
            }
        })
    }
});


/*
partially update a comment
*/
router.patch('/comments/:comment_id', function (req, res) {
    // get the commentID
    const commentID = req.params.comment_id;

    // get the attributes to be edited
    const attributes = req.body;

    // first check if the comment actually exists
    getComment(commentID).then(comment => {
        if (comment[0] === undefined || comment[0] === null) {

            // The 0th element is undefined. This means there is no comment with this id
            res.status(404).json({ 'Error': 'No comment with this comment_id exists' });

        } else {
            // get the old comment object
            const oldComment = comment[0];

            // get the attributes to be updated and update the old comment object accordingly
            if ("content" in attributes) {
                oldComment["content"] = attributes["content"];
            }
            if ("creationDate" in attributes) {
                oldComment["creationDate"] = attributes["creationDate"];
            }
            if ("upvote" in attributes) {
                oldComment["upvote"] = attributes["upvote"];
            }

            // edit the comment 
            editComment(commentID, oldComment.content, oldComment.creationDate, oldComment.upvote).then(key => {
               // create the self link that points to the new comment object
               const self = req.protocol + "://" + req.get("host") + "/comments/" + commentID;

               // add the self link to the updated comment object
               oldComment["self"] = self;

               // return a success and the newly edited comment object
               res.status(200).json(oldComment);
            })
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