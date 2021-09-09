<p align="center">
<img src="img/mashup_logo.png" width="400" title="hover text" align="center"/>
</p>

# Qlik Sense Saas: Iframe with JWT authentication

**Team**: Qlik OEM Emea

## Introduction
**Please be aware the code you see in this page is not an official Qlik documentation and is just for testing purpose since it does not claim at all to be an example of ready for production code. The author is not responsible for any malfunction or misbehavior of the code found in this project.**


The goal of this project is to show how you can embedd an iframe that shows a chart of your Qlik Cloud Services app thanks to JWT authentication.

# Getting Started

1. **Install Node.js** if you haven't already (https://nodejs.org) 

1. Download and unpack, or `git clone` this repository into your computer


1. Open **public/js/jwt_authentication.js** and set as *host* at line 7 your tenant name (es: *z29kgagw312sl0g.eu.qlikcloud.com*).

1. Open up a terminal window  and `cd` into the source code folder

1. **Run `npm install`** to install the project dependencies

1. **Upload [f1_app](./qlik_app/f1_app.qvf) to the tenant**. Open the app and copy its id. Paste it as the value of *appId* inside *qlikConfig* dictionary in **public/js/jwt_authentication.js** file. This is the app from which we will display the objects inside the iframe.

1. **Create a new Web Integration ID** from the administration console of your tenant: make sure you add https://127.0.0.1:1234 to your whitelist .Copy the *web integration id* and paste it as the value of *webIntegrationId* inside *qlikConfig* dictionary in **public/js/jwt_authentication.js**.

1. **Create a new Content Security Policy (CSP)** for allowing the browser to display the iframe correctly from the administration console of your tenant: make sure you add a new CSP with https://127.0.0.1:1234 (the server that hosts your iframe) as *Origin* and that you flag *frame-ancestors* directive. Please for more information regarding security policy refer to this page on *qlik.dev*: https://qlik.dev/tutorials/csp---what-is-it-and-how-to-use-it .

1. **Configure JSON Web Token (JWT) on your tenant**: to configure JWT authentication in your tenant please refer to the first part of the following online tutorial on *qlik.dev*: https://qlik.dev/tutorials/create-signed-tokens-for-jwt-authorization. After you've correctly configured the JWT Idp and generated (if not already available) the private and public certificates, create a *certs* folder inside the root folder of the project and place the **privatekey.pem** certificate. As the last step to complete the configuration please copy the **key ID** of your JWT Idp and paste it as the value of *keyid* inside *signingOptions* dictionary in **server.js** file. Please do the same for the **issuer** attribute.

1. **Self-signed certificate for running a local HTTPS server that hosts the mashup (test purpose)**: 
   Place, if you want to reuse existing ones, or generate **server.key** and **server.cert** certificates inside a folder called server_certs you must create in the root folder of the project (how to create an express https server with self-signed certs: : [link](https://timonweb.com/javascript/running-expressjs-server-over-https/) ).
   
   ```javascript
      https_exp.createServer({
          key: fs.readFileSync('./server_certs/server.key'),
          cert: fs.readFileSync('./server_certs/server.cert')
        }, app)
        .listen(port, '127.0.0.1', function () {
          console.log('Https Server listening on port 1234! Go to https://127.0.0.1:'+port+'/')
        })
   ```

1. Run `npm start` which should start a development server, open the link you see in your terminal (likely https://127.0.0.1:1234)


# Project explanation 

The steps to be performed in order to setup the system are:
The steps to be performed in order to setup the system are:
  * **1.**  Set up JWT authentication on the server that hosts the mashup 
  * **2.**  Use REST call to authenticate with JWT against your Qlik Cloud Services tenant
  * **3.**  Use the Single Integration APIs to create an iframe url that can be used to display a sheet or a single chart
  * **4.**  Display the iframe inside the HTML page.


  
<br>
 
 ## 1. Set up JWT authentication on the server that hosts the mashup
JSON Web Token (JWT) is an open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information between parties as a JSON object.
In its compact form, JSON Web Tokens consist of three parts separated by dots (.), which are:
  * **Header**:   The header typically consists of two parts: the type of the token, which is JWT, and the signing algorithm being used, such as HMAC SHA256 or RSA. 
  * **Payload**: The second part of the token is the payload, which contains the claims. Claims are statements about an entity (typically, the user) and additional data.   
  * **Signature**: The signature is used to verify the message wasn't changed along the way, and, in the case of tokens signed with a private key, it can also verify that the sender of the JWT is who it says it is.
  
  ### 1.1 JWT format for Qlik Sense authorization
  * **Signing Options**
  The required properties for the signing options of the JWT are the following:
     * **keyid** - This is a value created or supplied previously with identity provider configuration. Thanks to this one Qlik SaaS knows which JWT IDP to use to read the received JWT token.
     * **algorithm** - The encryption algorithm to protect the JWT with the private key.
     * **issuer** - This is a value created or supplied previously with identity provider configuration. 
     * **expiresIn** - The lifespan of the resulting JWT.
     * **audience** - A required value instructing the Qlik platform how to treat the received JWT. Please leave it as *qlik\.api/login/jwt-session* 
     Please check that the **signingOptions** dictionary in *server.js* is filled with all the information we need as the below example:
     
   ```javascript
  const signingOptions = {
    keyid: '5c0d103f-5abc-4c3a-a7d1-f90da24337f5',// Edit these to reflect your solution: it has to be the keyID of your JWT IDP
    algorithm: 'RS256',
    issuer: 'z29kgagw312sl0g.eu.qlikcloud.com',  // Edit these to reflect your solution: it has to be the issuer of your JWT IDP
    expiresIn: '6h',                             // Edit the JWT expiration time according to your needs
    audience: 'qlik.api/login/jwt-session',
  };
   ```
  * **Payload**
  The required claims for a Qlik JWT payload are the following:
    * **sub** - The main identifier (aka subject) of the user. 
    * **subType** - The type of identifier the sub represents. In this case, user is the only applicable value.
    * **name** - The friendly name to apply to the user.
    * **email** - The email address of the user.
    * **email_verified** - A claim indicating to Qlik that the JWT source has verified the email address belongs to the subject.
   It's possible to send additional claims in the JWT. Today, only the optional claim groups is read.

  Please fill the information inside **payload** dictionary according to the user you want to authenticate. Check that the **payload** dictionary in *server.js* is filled with all the information we need as the below example.
  The **payload** dictionary in *server.js* has the following structure:
     
```javascript
    var payload = {
      sub: "SomeSampleSeedValue",          //e.g. 0hEhiPyhMBdtOCv2UZKoLo4G24p-7R6eeGdZUQHF0-c
      subType: 'user',                     // The type of identifier the sub represents. In this case, user is the only applicable value.
      name: 'jackBrioschi',                // The friendly name to apply to the user.
      email: 'giacomo.brioschi@qlik.com',  //The email address of the user.
      email_verified: true,
      groups: ["Qlik_Employee"],            //possibility to specify groups in JWT. e.g.: "Sales", "Marketing"... etc
  };
```
  
   **Please note that in a real scenario, information of the user are obtained from the IDP you are using in your solution to do the login**
     
   * **Private key** for signing the token.
   We read it from certs folder inside *server.js* :
   
  ```javascript
   
    // This is the private key to encrypt the JWT
    const jwtEncryptionKey = fs.readFileSync('./certs/privatekey.pem');
   ```



## 2. Use REST call to authenticate with JWT against your Qlik Cloud Services tenants
The next step of JWT flow is to generate the JWT that we will use to authenticate against Qlik Sense SaaS.  In this example, this is done when the user visit the page https://127.0.0.1:1234/. **In a real scenario your IDP grants the information for the authenticated user in order to produce the JWT for creating the session in Qlik Sense** 
The **/** route retrieves the login attributes from JWT dictionary previously configured and generates the token and redirects the user to *public/mashup.html* that is the page that hosts the mashup:

```javascript
      app.get("/", (request, response) =>
      {
          new_payload = JSON.parse(JSON.stringify(payload));

          console.log("JWT payload ", new_payload );

          //token creation
          token = jsonWebToken.sign(new_payload, jwtEncryptionKey, signingOptions);
          console.log(token);

          response.sendFile(__dirname + "/public/mashup.html");
      });
```
The POST call to send the JWT token and login into Qlik Sense tenant happens in *public/js/jwt_authentication.js* script. The call is made to the url 'https://{tenant}/login/jwt-session' where we pass in the header the JWT token we have previously generated. This authentication call is very important because it will create and setup the session cookies we will need to perform the next requests to the server. **Please be aware that JWT token must be passed only the first time to retrieve the session cookies, while in future calls it will no longer be necessary.**
Below you can find the code snippet that retrieves the previously generated JWT and makes the POST login call to the Qlik Sense tenant.
 ```javascript
   async function connect() {
    return fetch("/get_token")
    .then(function(response)
    {
        return response.json();
    })
    .then(function(info)
    {
        jwt = info.token;
        return fetch(`https://${config.host}/login/jwt-session?qlik-web-integration-id=${config.webIntegrationId}`,
        {
            method:'POST',
            credentials:'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + jwt,
                'qlik-web-integration-id': config.webIntegrationId
            }
        })
        .then(function(response)
        {
                console.log("response" , response.status);
                return response.status === 200;
        })
        .catch(function(error)
        {
            console.error(error);
        })
    })
    .catch(function(error)
    {
        console.error(error);
    });
}
 ```
If the request was successful, you will get back a 200 response and the cookies in the response headers.
<br>

## 3. Use Single Integration APIs in order to display the iframe
Once we are logged in we can now insert the iframe url inside the iframe html tag with id *QV01*.
  ```javascript
document.getElementById('QV01').src="https://"+qlikConfig.host+"/single/?appid="+qlikConfig.appId+"&obj=NHKxVK&opt=ctxmenu,currsel";
  ``` 
 
 ## 4. Display the mashup into the HTML page with session app's objects.
 If the user is entitled to view the Qlik Sense app, the iframe correctly displays on *mashup.html* page:
 <br>
 <p align="center">
<img src="img/mashup.PNG" width="700" title="hover text" align="center"/>
</p>
 

 

  
  
