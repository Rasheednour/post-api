# Posts API

API for managing posts and comments in a social media application.

## Description

The Posts API provides endpoints to perform CRUD (Create, Read, Update, Delete) operations on users, posts, and comments in a social media application. The API is implemented using Node.js and Express, deployed on Google Cloud Platform's App Engine, and uses Google Datastore as the database. User authentication is implemented using Google OAuth 2.0.

## API Endpoints

The following endpoints are available in the API:

### Create a Post

- Endpoint: `POST /posts`
- Description: Create a new post.
- Request Body:
  ```json
  {
    "content": "string",
    "creationDate": "string",
    "public": "boolean"
  }
  ```
- Responses:
  - `201 Created`: Post created successfully.
  - `400 Bad Request`: Invalid request.
  - `406 Not Acceptable`: Invalid accept header.

### Get a Post

- Endpoint: `GET /posts/{post_id}`
- Description: Get a specific post by its ID.
- Parameters:
  - `post_id` (path parameter): The ID of the post.
- Responses:
  - `200 OK`: Post retrieved successfully.
  - `404 Not Found`: Post not found.

### Edit a Post

- Endpoint: `PUT /posts/{post_id}`
- Description: Edit an existing post.
- Parameters:
  - `post_id` (path parameter): The ID of the post.
- Request Body:
  ```json
  {
    "content": "string",
    "creationDate": "string",
    "public": "boolean",
    "comments": ["string"],
    "upvotes": "integer"
  }
  ```
- Responses:
  - `200 OK`: Post edited successfully.
  - `400 Bad Request`: Invalid request.
  - `401 Unauthorized`: Invalid JWT (JSON Web Token).
  - `404 Not Found`: Post not found.
  - `406 Not Acceptable`: Invalid accept header.

### Partially Update a Post

- Endpoint: `PATCH /posts/{post_id}`
- Description: Partially update an existing post.
- Parameters:
  - `post_id` (path parameter): The ID of the post.
- Request Body:
  ```json
  {
    "content": "string",
    "creationDate": "string",
    "public": "boolean",
    "comments": ["string"],
    "upvotes": "integer"
  }
  ```
- Responses:
  - `200 OK`: Post updated successfully.
  - `401 Unauthorized`: Invalid JWT.
  - `404 Not Found`: Post not found.
  - `406 Not Acceptable`: Invalid accept header.

### Delete a Post

- Endpoint: `DELETE /posts/{post_id}`
- Description: Delete a post.
- Parameters:
  - `post_id` (path parameter): The ID of the post.
- Responses:
  - `204 No Content`: Post deleted successfully.
  - `401 Unauthorized`: Invalid JWT.
  - `404 Not Found`: Post not found.

### Create a Comment

- Endpoint: `POST /comments`
- Description: Create a new comment.
- Request Body:
  ```json
  {
    "content": "string",
    "creationDate": "string",
    "upvote": "boolean"
  }
  ```
- Responses:
  - `201 Created`: Comment created successfully.
  - `400 Bad Request`: Invalid request.
  - `406 Not Acceptable`: Invalid accept header.

### Get a Comment

- Endpoint: `GET /comments/{comment_id}`
- Description: Get a specific comment by its ID.
- Parameters:
  - `comment_id`

 (path parameter): The ID of the comment.
- Responses:
  - `200 OK`: Comment retrieved successfully.
  - `404 Not Found`: Comment not found.

### Edit a Comment

- Endpoint: `PUT /comments/{comment_id}`
- Description: Edit an existing comment.
- Parameters:
  - `comment_id` (path parameter): The ID of the comment.
- Request Body:
  ```json
  {
    "content": "string",
    "creationDate": "string",
    "upvote": "boolean"
  }
  ```
- Responses:
  - `200 OK`: Comment updated successfully.
  - `400 Bad Request`: Invalid request.
  - `401 Unauthorized`: Invalid JWT.
  - `404 Not Found`: Comment not found.
  - `406 Not Acceptable`: Invalid accept header.

### Partially Update a Comment

- Endpoint: `PATCH /comments/{comment_id}`
- Description: Partially update an existing comment.
- Parameters:
  - `comment_id` (path parameter): The ID of the comment.
- Request Body:
  ```json
  {
    "content": "string",
    "creationDate": "string",
    "upvote": "boolean"
  }
  ```
- Responses:
  - `200 OK`: Comment updated successfully.
  - `401 Unauthorized`: Invalid JWT.
  - `404 Not Found`: Comment not found.
  - `406 Not Acceptable`: Invalid accept header.

### Add a Comment to a Post

- Endpoint: `PUT /posts/{post_id}/comments/{comment_id}`
- Description: Add a comment to a specific post.
- Parameters:
  - `post_id` (path parameter): The ID of the post.
  - `comment_id` (path parameter): The ID of the comment.
- Responses:
  - `200 OK`: Comment added to the post.
  - `401 Unauthorized`: Invalid JWT.
  - `403 Forbidden`: Access to private resource denied.

### Remove a Comment from a Post

- Endpoint: `DELETE /posts/{post_id}/comments/{comment_id}`
- Description: Remove a comment from a specific post.
- Parameters:
  - `post_id` (path parameter): The ID of the post.
  - `comment_id` (path parameter): The ID of the comment.
- Responses:
  - `204 No Content`: Comment removed from the post.
  - `401 Unauthorized`: Invalid JWT.
  - `403 Forbidden`: Access to private resource denied.

## Deployment

The API is deployed on Google Cloud Platform's App Engine. The API base URL is `https://posts-and-comments-api.ew.r.appspot.com/`.
