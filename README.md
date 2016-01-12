**GameZyme Javascript SDK**
==============================
Get started
-----------


Initialize
----------
To use **GameZyme**, you must have an account (sign in [here](http://www.gamezyme.com/login)), and a game set up on the dashboard. Then you just need to add the SDK and your game's public key to your HTML:

```html
<head>
    <!-- Host it locally -->  
    <script src="/js/gz.min.js"></script>
    <!-- Or Get it from an external source -->
    <!-- <script src="https://rawgit.com/GameZyme/js_plugin/master/dist/gz.min.js"></script> -->
    <script>
        var publicKey = "<YOUR GAME'S PUBLIC KEY>";

        Gamezyme.init(publicKey, function(result) {
            // Connection suceeded
            console.log("Connected and ready!");
        }, function(error) {
            // Something went wrong
            console.log("Something went wrong! \n" + "Error detail: " + error);
        });
    </script>
</head>
```
You can get your game's **public key** in the **Settings** section of our dashboard.

Game
----

### .getAllVars(callback)   
Retrieve all game variables set in **GameZyme**'s dashboard.

#### Example
```javascript
var gameVars = {};

Gamezyme.game.getAllVars(function(response) {
    gameVars = response.result;
});
```

### .getVar(key, callback)   
Retrieve a single variable you set in GameZyme's dashboard.

#### Example
```javascript
var key = "boss01_health";
var value;

Gamezyme.game.getVar(key, function(response){
    if (typeof response.error == 'undefined') {
        value = response.result;
    }
});
```
Server
------

### .ping(callback)
Get server Status

#### Example
```javascript
Gamezyme.server.ping(function(response) {
    if (typeof response.error == 'undefined') {
        // everything's fine
    }
});
```

Purchases
---------
This method is still a stub, in the future you'll be able to validate in app purchases (IAP) using it.

### .register(params, callback)
Register an In-App Purchase (IAP). The `params` object must have the `name` and `value` parameters.

#### Example
```javascript
var item = {
	name: 'powerUp_bullets',
	value: 1.99
};

Gamezyme.purchases.register(item, function(response) {
    if (response.result === 'success') {
        // purchase successfully registered
    }
});
```

Player
------
These methods are related to the player's information. Here you can login, logout, save player data, among others.

### .forgotPassword(email, callback)
Send an email to the player with the steps to recover his/her password.

#### Example
```javascript
var email = "foo@bar.io";

Gamezyme.player.forgotPassword(email, function(response) {
    if(response.result === "success") {
        //Email sent
        console.log("Check your email to recover your password");
    }
});
```

### .getData(callback)
Gets the player's peristed game data

#### Example
```javascript
var playerData = {};

Gamezyme.player.getData(function(result){
   if(result.status === 'success') {
       // Successfully retrieved data
       console.log('Data retrieved');
       playerData = result.response;
   }
});
```

### isLoggedIn(callback)
Check if the player is already logged in

#### Example
```javascript
Gamezyme.player.isLoggedIn(function(result) {
   if(result.response === true) {
       // This means the player ir already logged in
       console.log('Player already logged in');
   }
});
```

### localLogin(email, password, callback)
If a player has an account, use this function to login into your game. Parameters `email` and `password` must be **Strings**.

#### Example
```javascript
var email = 'foo@bar.io';
var password = 'foobar';

Gamezyme.player.localLogin(email, password, function(result) {
    var error = result.error;
    if (error) {
        // Maybe there's an error with his email or password
        console.log(error.message);
    } else {
        // Player logged in successfully
        console.log(result.response);
    }
});
```

### .localSignUp(email, password, name, callback)
Use this function to register a player with an `email`, a `password` and his/her `name`. All these parameters must be **String**

#### Example
```javascript
var email = 'foo@bar.io';
var password = 'foobar';
var name = 'Scott C. Alves';

Gamezyme.player.localSignUp(email, password, name, function(result) {
    var error = result.error;
    if (error) {
        // Probably the player exists
        console.log(error.message);
    } else {
        // Player signed up successfully
        console.log(result.response);
    }
});
```

### .logout(callback)
Use this method to logout the player.

#### Example
```javascript
Gamezyme.player.logout(function(result){
   if(result.status === 'success') {
       // Player logged out
       console.log('Player logged out');
   }
});
```

### .me(callback)
Retrieve information about the player.

#### Example
```javascript
var player = {};

Gamezyme.player.me(function(result){
   if(result.status === 'success') {
       // Successfully player info retrieved
       console.log('Player info retrieved');
       player = result.response

       // Player's email
       console.log(player.email);
       // Player's identifier
       console.log(player.identifier);
       // Player's name
       console.log(player.name);
       // Player's typeIdentifier (local sign-up or facebook)
       console.log(player.typeIdentifier);
       // Player's profile picture (Only available if the player's typeIdentifier is "facebook")
       console.log(player.urlProfilePicture);
   }
});
```

### .openPopupLoginFacebook(callback)
Open popup for Facebook login

#### Example
```javascript
var btnLoginFacebook = document.getElementsById("fb-login");

btnLoginFacebook.onclick = function(e) {
    Gamezyme.player.openPopupLoginFacebook(function(result) {
	    var error = result.error;
	    if (error) {
	        console.log(error.message);
	    } else {
	        console.log(result.response);
	    }
	});
}
```

### .saveData(callback)
Persist the player's game data

#### Example
```javascript
var data = {
    currentLevel: 5,
    money: 3200,
    score: 5000,
};

Gamezyme.player.saveData(data, function(result){
   if(result.status === 'success' && result.response === true) {
       // Data saved successfully
       console.log('Data saved');
   }
});
```

Leaderboard
-----------
In **GameZyme** we handle 2 type of crossplatform leaderboards: **Global leaderboard** and **Friends leaderboard**. Using these methods you can show both leaderboards.

### .getFriends(options, callback)
Get the player's friends leaderboard (currently we only support Facebook friends)

#### Example
```javascript
var options = {
    order: 'DESC' // This accepts only 2 strings: 'DESC' and 'ASC'
};

Gamezyme.leaderboard.getFriends(options, function(result){
   if(result.status === 'success') {
       // List retrieved successfully
       console.log(result.response);
   }
});
```

### .getGlobal(options, callback)
Gets all players leaderboard

#### Example
```javascript
var options = {
	limit: 10,
    order: 'DESC' // This accepts only 2 strings: 'DESC' and 'ASC'
};

Gamezyme.leaderboard.getGlobal(options, function(result){
   if(result.status === 'success') {
       // List retrieved successfully
       console.log(result.response);
   }
});
```
