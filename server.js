const express = require('express');
const fs = require("fs");
const jsonWebToken = require("jsonwebtoken")
var https_exp = require('https')



//**********************************************************/
//CONFIG SECTION                                            /
//**********************************************************/
const port = 1234; 
const app = express();
app.use(express.static('public'));


// This is the private key to encrypt the JWT
const jwtEncryptionKey = fs.readFileSync('./certs/privatekey.pem');



// kid and issuer have to match with the IDP config and the audience has to
// be qlik.api/jwt-login-session
const signingOptions = {
  keyid: 'a9d1c718-032a-431a-994d-4dc9a10c7a28',// Edit these to reflect your solution: it has to be the keyID of your JWT IDP
  algorithm: 'RS256',
  issuer: 'r85qgk05s06yq6b.eu.qlikcloud.com',  // Edit these to reflect your solution: it has to be the issuer of your JWT IDP
  expiresIn: '6h',                             // Edit the JWT expiration time according to your needs
  audience: 'qlik.api/login/jwt-session',
};


// These are the claims that will be accepted and mapped anything else will
// be ignored. sub, subtype and name are mandatory. Realm is optional in the
// sub field.
var payload = {
  sub: "abcd",          //e.g. 0hEhiPyhMBdtOCv2UZKoLo4G24p-7R6eeGdZUQHF0-c
  subType: 'user',                     // The type of identifier the sub represents. In this case, user is the only applicable value.
  name: 'testuser',                // The friendly name to apply to the user.
  email: 'testuser@spacewell.com',  //The email address of the user.
  email_verified: true,
  groups: ["SPACEWELL"],            //possibility to specify groups in JWT. e.g.: "Sales", "Marketing"... etc
};



//===================================================================
//
//      SERVER ROUTES
//
//==================================================================

app.get("/get_token", (request, response) =>
{
    const infos = {
        token: token,
        username : new_payload.name
    };
    console.log(infos);
    response.json(infos);
})



app.get("/", (request, response) =>
{
    new_payload = JSON.parse(JSON.stringify(payload));

    console.log("JWT payload ", new_payload );

    //token creation
    token = jsonWebToken.sign(new_payload, jwtEncryptionKey, signingOptions);
    console.log(token);

    response.sendFile(__dirname + "/public/mashup.html");
});




//======================================================================================
//
//      SERVER CREATION
//
//======================================================================================
//create a local test HTTPs server that serves the mashup
https_exp.createServer({
    key: fs.readFileSync('./certs/privatekey.pem'),
    cert: fs.readFileSync('./certs/publickey.cert')
  }, app)
  .listen(port, '127.0.0.1', function () {
    console.log('Https Server listening on port 1234! Go to https://127.0.0.1:'+port+'/')
  })