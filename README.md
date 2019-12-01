# API Documentation

#### Backend delpoyed at [coming soon!](https://www.google.com/) <br>

## Getting started

prerequisite enviornment variables
- you need a .env file containing a  ```PRIVATE_KEY``` for jwt signing 

Setup for development 
- Clone this repo
- **npm i** to install all required dependencies
- **npm run dev ** to start the local server

### NodeJS + GraphQL + Mongodb/mongoose as ORM

Why I chose this stack

-    Easy to setup and "get going"
-    I wanted to learn GraphQL
-    I wanted to learn MongoDB

## Endpoints
```http://localhost:5000/account```


#### User Queries and Mutations
## All mutations and some queries respond with some form of a boolean
- ```register(username:"example", email:"example@example.com", password:"Password1234!"){ message created }```

- ```login(username:"example", email:"example@example.com", password:"Password1234!"){ loggedIn message token }```

  - login query requires either username or email it will default to email if both are in the body.<br>
    it will respond with a token but will also set token in set-cookies

- ```searchAccount(username:"abc"){username followers following}```
  - searchAccount brings back the accounts along with user details by a regular expresion match of the input limited to 30.
  
- ```update(key:"password", newValue:"NewPass1234!", oldValue:"Password1234!" ) { updated message }```
   - updates user info only the password key requires an oldValue.
   - Accepted keys are:
      - password
      - username
      - email
      
- ```myAccount(username,email){ message account{ username email } status}```
  - returns current user username and or email.
  
- ```follow(username:"someone"){ message followed }```
  - follows someone by username.
  
- ```unfollow(username:"someone"){ message unfollowed }```
  - unfollows someone by username.
  
## Using the testAccount api located in ```src/models/__tests__/utils/testAccount.ts```
#### creating new users on the fly:
- using valid
    - ```var test = testAccount()```<br>
      ```test.username = {type:"valid"} //this will generate a new valid username and sets it to the test object```<br>
      ```test.email = {type:"valid"} //this will generate a new valid email and sets it to the test object```<br>
      ```test.password = {type:"valid", length:16} //this will generate a new valid password and sets it to the test object it will also give it a length of 16```<br>
- using invalid
    - ```var test = testAccount()```<br>
      username by default will always be valid even when type invalid is set so you must use a postfix or prefix to get your desired result <br>
      ```test.username = {type:"invalid"} //this will generate a new invalid username and sets it to the test object```<br>
      ```test.email = {type:"invalid"} //this will generate a new invalid email and sets it to the test object```<br>
      ```test.password = {type:"invalid"} //this will generate a new invalid password and sets it to the test object```<br>
- using prefix / postfix
    - prefix / postfix will only work with an invalid type of testAccount  property <br>
    - ```var test = testAccount()```<br>
    ```test.username = {type:"invalid", postfix:"-"} //this will generate a new invalid username that ends with a dash and sets it to the test object```<br>
    ```test.email = {type:"invalid", prefix:"_"} //this will generate a new invalid email that begins with an underscore and sets it to the test object```<br>
-using custom properties
    - of course you can always just set your own property value<br>
    - ```var test = testAccount()```<br>
    ```test.username = "example"```<br>
    ```test.email = "example@example.com"```<br>
    ```test.password = "Password1234"```<br>



# Data Model

#### User
---
```
{
  username: STRING
  email: STRING
  password: STRING
  created: DATE
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
