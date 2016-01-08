**GameZyme Javascript plugin**
==============================
Get started
-----------


Initialize
----------
To start using **GameZyme**, you must have an account (for that just create an account and sign in [here](http://www.gamezyme.com/login)). After that you need to add the following snippet into your index HTML.

```html
<head>
    <!-- You can download our minified file and add it -->  
    <script src="/js/gz.min.js"></script>
    <!-- Or get it from an external source -->
    <script src="https://rawgit.com/GameZyme/js_plugin/master/dist/gz.min.js"></script>
    <script>
        var publicKey = "<GAME'S PUBLIC KEY>";

        Gamezyme.init(publicKey, function(result) {
            // Callback when the init method suceeded
            console.log("Connected and ready!");
        }, function(error) {
            // Something failed
            console.log("Something went wrong! \n" + "Error detail: " + error);
        });
    </script>
</head>
```
You can get your game's **public key** in the **Basic** section of our dashboard.

Game
----
In this section you can get variables configured earlier in our dashboard.

### .getAllVars(callback)   
Retrieve all game variables.

#### Example
```javascript
var gameVars = {};

Gamezyme.game.getAllVars(function(response) {
    gameVars = response.result;
});
```

### .getVar(key, callback)   
Retrieve a single variable.

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
This section is for sending information to the server.

### .ping(callback)
Send player's info to the server, like time, player's ID, among others

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
In this section, you can register every IAP (In-App Purchase) made in your game. We will improve this section soon so use it now and when everything is ready you'll find it useful. Trust us!

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
This section has everything related to the player. Here you can login, logout, save player data, among others.

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
Gets the player data of your game

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
If a player has an account, use this function to login into **GameZyme**. Parameters `email` and `password` must be **Strings**.

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
With this function you can register a player with an `email`, a `password` and his/her `name`. All these parameters must be **String**

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
With this method you can logout the player.

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
Save the player data of your game

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
In **GameZyme** we handle 2 type of leaderboard: **Global leaderboard** and **Friends leaderboard**. With this section you can show both leaderboards if you want it.

We must say it! Our leaderboards are **multiplatform**, so you can get player from _Android_ and _iOS_ in the same list!

### .getFriends(options, callback)
Gets player's friends leaderboard (only Facebook)

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
