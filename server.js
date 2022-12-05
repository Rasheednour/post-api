const express = require('express');
const app = express();
const { Datastore } = require('@google-cloud/datastore');
const bodyParser = require('body-parser');
const { entity } = require('@google-cloud/datastore/build/src/entity');
const datastore = new Datastore();
const path = require('path');
const {google} = require('googleapis');
const url = require('url');
const jwt_decode = require('jwt-decode');
const {expressjwt: jwt} = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const router = express.Router();
// create a consts to store the entity names
const USERS = "Users";
const POSTS = "Posts";
const COMMENTS = "Comments";

const CLIENT_ID = '1049983258452-vgak6vsasjmuagjj49lrt3tab5nbs08e.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:8080/oauth';

// create a new oauth2Client
const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );
  
// Access scopes
const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

// create a function to verify JWTs
const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://www.googleapis.com/oauth2/v3/certs`
    }),
  
    // Validate the audience and the issuer.
    issuer: `https://accounts.google.com`,
    algorithms: ['RS256']
  });


app.use(bodyParser.json());
app.enable('trust proxy');
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, './views')));

function fromDatastore(item) {
    item.id = item[Datastore.KEY].id;
    return item;
}


/* -------------Google OAuth Model Functions ------------- */

/*
A function that constructs an endpoint to the Google Oauth 2.0
returns: the authorization URL
*/
function obtainAuthUrl() {
      
      // Generate a url that asks permissions for the Drive activity scope
      const authorizationUrl = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'online',
        /** Pass in the scopes array defined above.
          * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
        scope: scopes,
        // Enable incremental authorization. Recommended as a best practice.
        include_granted_scopes: true
      });

      return authorizationUrl;
}



/* -------------Users Model Functions ------------- */


/*
Params: Function takes two user attributes and creates a new entity
in Google Datastore using the provideed attributes.

Returns: The function returns the key to the created entity.
*/
function createUser(name, userID) {
    let key = datastore.key(USERS);
    const newUser = { "name": name, "userID": userID };
    return datastore.save({ "key": key, "data": newUser }).then(() => { return key });
}

/*
Params:None

Returns: All user entities in Datastore
*/
function getUsers() {
    const q = datastore.createQuery(USERS);
    return datastore.runQuery(q).then((entities) => {
        return entities[0]
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
function createPost(content, creationDate, public, userID) {
    let key = datastore.key(POSTS);
    const newPost = { "content": content, "creationDate": creationDate, "public": public, "comments": [], "upvotes": 0, "userID": userID};
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
    
    // get the unique userID of the user requesting to see their posts
    const userID = req.auth.sub;
    // run a query on Datastore to get all posts
    const query = datastore.createQuery(POSTS).filter('userID', '=', userID);
    return datastore.runQuery(query).then((entities) => {
        // get total number of user posts for this user
        const totalItems = entities[0].length;
        // run another query for posts, but limit results this time
        let q = datastore.createQuery(POSTS).filter('userID', '=', userID).limit(5);
        let results = {};
        let prev;
        console.log('here1');
        if(Object.keys(req.query).includes("cursor")){
            prev = req.protocol + "://" + req.get("host") + "/posts" + "?cursor=" + req.query.cursor;
            q = q.start(req.query.cursor);
        }
        console.log('here2');
        return datastore.runQuery(q).then( (entities) => {
            console.log('here3');
            results.posts = entities[0].map(fromDatastore);
            // if(typeof prev !== 'undefined'){
            //     results.previous = prev;
            // }
            console.log('here4');
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
function editPost(id, content, creationDate, public, userID, comments, upvotes) {
    const key = datastore.key([POSTS, parseInt(id, 10)]);
    const post = { "content": content, "creationDate": creationDate, "public": public, "userID": userID, "comments": comments, "upvotes": upvotes };
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
function getComments(req) {
    // run a query on Datastore to get all posts
    const query = datastore.createQuery(COMMENTS);
    return datastore.runQuery(query).then((entities) => {
        // get total number of posts in Datastore
        const totalItems = entities[0].length;
        
        // run another query for posts, but limit results this time
        let q = datastore.createQuery(COMMENTS).limit(5);
        let results = {};
        let prev;

        if(Object.keys(req.query).includes("cursor")){
            prev = req.protocol + "://" + req.get("host") + "/comments" + "?cursor=" + req.query.cursor;
            q = q.start(req.query.cursor);
        }
        return datastore.runQuery(q).then( (entities) => {
            results.comments = entities[0].map(fromDatastore);
            // if(typeof prev !== 'undefined'){
            //     results.previous = prev;
            // }
            if(entities[1].moreResults !== Datastore.NO_MORE_RESULTS ){
                results.next = req.protocol + "://" + req.get("host") + "/comments" + "?cursor=" + entities[1].endCursor;
                results.total_items = totalItems;
            }
            return results;
        });
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
    res.render('home-page');
 });


/* -------------Users Controller Functions ------------- */


/*
Get all user entities from Datastore
*/
router.get('/users', function(req,res){
    getUsers().then(users => {
        res.status(200).json(users);
    })
});


/*
Redirect route from home page to the Google OAuth 2.0 endpoint
*/
router.get('/auth', function(req,res){
    // construct Google Oauth endpoint
    const authUrl = obtainAuthUrl();
    res.redirect(authUrl);
});


/*
Redirect route from home page to the Google OAuth 2.0 endpoint
*/
router.get('/oauth', function(req,res){
    // Receive the callback from Google's OAuth 2.0 server.
    if (req.url.startsWith('/oauth')) {
        // Handle the OAuth 2.0 server response
        let q = url.parse(req.url, true).query;
    
        // Get access token
        oauth2Client.getToken(q.code).then(tokens => {
            oauth2Client.setCredentials(tokens);
            // get the JWT 
            const jwt = tokens.tokens.id_token;
            // decode the JWT
            const decodedJwt = jwt_decode(jwt);
            // obtain the value of sub and the name from the decoded JWT
            const userID = decodedJwt.sub;
            const name = decodedJwt.name;

            // before creating a new user, check if the user is already registered
            // get list of users
            getUsers().then(users => {
                // create variable to keep track of user status
                let userExists = false;
                // iterate through list of users
                for (let i=0; i < users.length; i++) {
                    const user = users[i];
                    const id = user.userID;
                    if (id === userID) {
                        userExists = true;
                        break;
                    }
                }
                // if the user doesn't exist in Datastore, create new user
                if (!userExists) {
                    // create a new user in Datastore with the above attributes
                    createUser(name, userID).then(user => {
                    // redirect to the user page and 
                    res.render('user-page', {"userID": userID, "jwt": jwt});
                     });
                // if user already exists, don't create new user, and redirect to user page
                } else {
                    res.render('user-page', {"userID": userID, "jwt": jwt});
                }
            })
            
            
        });
    }
});


/* -------------Posts Controller Functions ------------- */

/*
Create a new post entity
*/
router.post('/posts', checkJwt, function (req,res){
    // check if all the required post attributes are provided
    if(!("content" in req.body) || !("creationDate" in req.body) || !("public" in req.body)){
        // send back an error if an attribute is missing
        res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' });
    } else {
        // check if the request Accept header is set to application/json
        const accepts = req.accepts('application/json');
        if(!accepts){
            res.status(406).json({'Error': 'The request Accept header should allow application/json'});
        } else {
            // the request is authenticated and valid, proceed with creating the post
            // get the content, creationDate, and public status from the request body
            const content = req.body.content;
            const creationDate = req.body.creationDate;
            const public = req.body.public;

            // get the unique user ID which is the value of sub in the JWT
            const userID = req.auth.sub;
    
            // create a new post in Datastore
            createPost(content, creationDate, public, userID).then((key) => {
                // create a self link that points to the new post using the post information
                const self = req.protocol + "://" + req.get("host") + "/posts/" + key.id;  
                // send a successful response and a JSON object that contains the post information
                res.status(201).json({"id": key.id, "content": content, "creationDate": creationDate, "public": public, "comments": [], "upvotes": 0, "userID": userID, "self": self});
            });
        }
    }
});


/*
Get a post from Datastore using a postID
*/
router.get('/posts/:post_id', checkJwt, function(req,res){
    // get the postID from the path parameters
    const postID = req.params.post_id

    // call a function to get the post from Datastore, then return the post if exists
    getPost(postID).then(entity => {
        // get the user object
        const post = entity[0]; 
        if (post === undefined || post === null) {
            res.status(404).json({'Error': 'No post with post_id exists.'});
        } else {
            // check if a valid accept header exists in the request
            const accepts = req.accepts('application/json');
            if(!accepts){
            res.status(406).json({'Error': 'The request Accept header should allow application/json'});
            } else {
                // check if the post is public or private
                // if the post is public, show the post, if private, check if the requesting user is the owner of the post
                if (post.public) {
                    // construct a self link
                    const self = req.protocol + "://" + req.get("host") + "/posts/" + postID;

                    // add the self attribute to the user object
                    post['self'] = self;

                    // return the post object
                    res.status(200).json(post);
                } else {
                    // check if the requesting user is the owner of the post
                    if (req.auth.sub === post.userID) {
                        // construct a self link
                        const self = req.protocol + "://" + req.get("host") + "/posts/" + postID;

                        // add the self attribute to the user object
                        post['self'] = self;

                        // return the post object
                        res.status(200).json(post);
                    } else {
                        // the post is private and the requesting user is not the owner, reject the request
                        res.status(403).json({"Error": "You are not allowed to access this private resource"});
                    }
                }
            }


            
        }
    })
});

/*
Get all post entities from Datastore
*/
router.get('/posts', checkJwt, function(req,res){
    // check if request accepts application/json
    const accepts = req.accepts('application/json');
    if(!accepts){
        res.status(406).json({'Error': 'The request Accept header should allow application/json'});
    } else {
        getPosts(req).then(posts => {
            res.status(200).json(posts);
        })
    }
});


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
Deleting the list of posts is not allowed
*/

router.delete('/posts', function (req, res) {

    // get the post ID
    res.status(405).json({"Error": "Deleting the list of posts is not allowed."})
});


/*
Edit a post
*/

router.put('/posts/:post_id', checkJwt, function (req, res) {
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
                // check if the requesting user is editing a post that is not owned by them
                const requestUserID = req.auth.sub;
                const userID = post[0].userID;
                if (requestUserID !== userID) {
                    res.status(401).json({ 'Error': 'Missing/invalid JWT' });
                } else {
                    // get the new post attributes
                    const content = req.body.content;
                    const creationDate = req.body.creationDate;
                    const public = req.body.public;

                    // edit the post in Datastore
                    editPost(postID, content, creationDate, public, post[0].userID, post[0].comments, post[0].upvotes).then(key => {
                    
                        // create the self link that points to the new post object
                        const self = req.protocol + "://" + req.get("host") + "/posts/" + postID;

                        // form the new post object
                        const newPost = {"id": postID, "content": content, "creationDate": creationDate, "public": public, "self": self};

                        // return a success and the newly edited post object
                        res.status(200).json(newPost);
                });
                }   
            }
        })
    }
});


/*
partially update a post
*/
router.patch('/posts/:post_id', checkJwt, function (req, res) {
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
            // check if the requesting user is editing a post that is not owned by them
            const requestUserID = req.auth.sub;
            const userID = post[0].userID;
            if (requestUserID !== userID) {
                res.status(401).json({ 'Error': 'Missing/invalid JWT' });
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
                editPost(postID, oldPost.content, oldPost.creationDate, oldPost.public, oldPost.userID, oldPost.comments, oldPost.upvotes).then(key => {
                // create the self link that points to the new post object
                const self = req.protocol + "://" + req.get("host") + "/posts/" + postID;

                // add the self link to the updated post object
                oldPost["self"] = self;
                // return a success and the newly edited post object
                res.status(200).json(oldPost);
            });
            }
            
        }
    })
});


/* -------------Comments Controller Functions ------------- */

/*
Create a new comment
*/
router.post('/comments', checkJwt, function (req,res){
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
    getComments(req).then(comments => {
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


// catch error thrown by unauthorized requests to the API
app.use(function (err, req, res, next) {
    if (err) {
        res.status(401).json({ 'Error': 'missing/invalid JWT' });
    }
   });

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});