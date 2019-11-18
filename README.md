# API Documentation

#### 1️⃣ Backend delpoyed at [herkou](https://memefly.herokuapp.com/) <br>

## 1️⃣ Getting started

prerequisite enviornment variables
- you need a .env file containing a mongodb URI ```ACCOUNT_URI``` and ```privateKey``` for the auth token

Setup for development
- Clone this repo
- **npm i** to install all required dependencies
- **npm run dev ** to start the local server

### NodeJS + GraphQL + Mongodb/mongoose as ORM

Why I chose this stack

-    Easy to setup and "get going"
-    I wanted to learn GraphQL
-    I wanted to learn MongoDB

## 2️⃣ Endpoints
### There are two endpoints 
```https://memefly.herokuapp.com/api/user```
```https://memefly.herokuapp.com/api/memes```

#### User Queries and Mutations
- ```register(username:"example", email:"example@example.com", password:"Password1234!")```

- ```login(username:"example", email:"example@example.com", password:"Password1234!")```

  - login query requires either username or email it will default to email if both are in the body
- ```searchUser(username:"abc"){username followers following}```
  - searchUser brings back the users along with user details by a regular expresion match of the input limited to 20
  
- ```update(key:"password", value:"NewPass1234!", oldValue:"Password1234!" )```
   - updates user info only password key requires an oldvalue
   - Accepted keys are:
      - password
      - username
      - email
- ```follow(username:"someone")```
  - follows someone by username
  
- ```unfollow(username:"someone")```
  - unfollows someone by 
  
- ```createDMRoom(username:"someone"{ roomID messages {username message timestamp } }```
  - creates a DM Room instance where you and another user can message each other in real time.`
  - returns chat history if an instance of a room between two users already exists
  
#### User Queries and Mutations
- ```getMemes { name box url }```
  - gets all "most popular" memes and returns the names, bounding box(for css) and url (image)

# Data Model



#### 2️⃣ User
---
```
{
  username: STRING
  email: STRING
  password: STRING
  
}
```
---
## Contributing

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other method with the owners of this repository before making a change.

Please note we have a [code of conduct](./code_of_conduct.md). Please follow it in all your interactions with the project.

### Issue/Bug Request

 **If you are having an issue with the existing project code, please submit a bug report under the following guidelines:**
 - Check first to see if your issue has already been reported.
 - Check to see if the issue has recently been fixed by attempting to reproduce the issue using the latest master branch in the repository.
 - Create a live example of the problem.
 - Submit a detailed bug report including your environment & browser, steps to reproduce the issue, actual and expected outcomes,  where you believe the issue is originating from, and any potential solutions you have considered.

### Feature Requests

We would love to hear from you about new features which would improve this app and further the aims of our project. Please provide as much detail and information as possible to show us why you think your new feature should be implemented.

### Pull Requests

If you have developed a patch, bug fix, or new feature that would improve this app, please submit a pull request. It is best to communicate your ideas with the developers first before investing a great deal of time into a pull request to ensure that it will mesh smoothly with the project.

Remember that this project is licensed under the MIT license, and by submitting a pull request, you agree that your work will be, too.

#### Pull Request Guidelines

- Ensure any install or build dependencies are removed before the end of the layer when doing a build.
- Update the README.md with details of changes to the interface, including new plist variables, exposed ports, useful file locations and container parameters.
- Ensure that your code conforms to our existing code conventions and test coverage.
- Include the relevant issue number, if applicable.
- You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.

### Attribution

These contribution guidelines have been adapted from [this good-Contributing.md-template](https://gist.github.com/PurpleBooth/b24679402957c63ec426).

## Documentation

See [Frontend Documentation](🚫link to your frontend readme here) for details on the fronend of our project.
🚫 Add DS iOS and/or Andriod links here if applicable.
