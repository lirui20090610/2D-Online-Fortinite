var process = require('process');
const jwt = require("jsonwebtoken"); // used to verify and sign tokens
var key="this_is_a_key"; // This key is used to sign a token
var crypto = require('crypto'); // used to hash password

// nodejs ftd.js PORT_NUMBER
var port = 11137; 
var express = require('express');
var cookieParser = require('cookie-parser')

var app = express();
app.use(cookieParser()); // parse cookies before processing other middleware

const sqlite3 = require('sqlite3').verbose();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// Create the DB if it does not exist
var db = new sqlite3.Database('db/database.db', (err) => {
	if (err) {
		console.error(err.message);
	}
	console.log('Connected to the database');
});

// Create tables in DB
db.serialize(function () {
	db.run("DROP TABLE IF EXISTS user;");
	db.run("DROP TABLE IF EXISTS score;");
	db.run("CREATE TABLE IF NOT EXISTS user (username varchar(20) UNIQUE,password varchar(100),email varchar(50));");
	db.run("CREATE TABLE IF NOT EXISTS score (username varchar(20) UNIQUE,score integer);");
	db.run('INSERT INTO user (username,password,email) VALUES (?,?,?);', ['\"abc\"','\"abc\"','\"abc@gmail.com\"']); // add some users
	db.run('INSERT INTO score (username,score) VALUES (?,?);',['\"abc\"',500]);
});


// Hash function part Credit to https://ciphertrick.com/salt-hash-passwords-using-nodejs-crypto/
var sha512 = function(password, salt){
    var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    var value = hash.digest('hex');
    return value;
};
function saltHashPassword(userpassword) {
    var salt = "fa37c843"; //give a uniform salt of legth 8
	var passwordData = sha512(userpassword, salt);
	return passwordData;
}

app.use('/',express.static('static-content')); // this directory has files to be returned

// Check login credentials
app.post('/api/login/:user/',function (req,res) {
	
	var username = '\"' + req.params.user.trim() + '\"';
	var hashedPassword = '\"' + saltHashPassword(req.body.password.trim()) + '\"';

	let sql = 'SELECT * FROM user WHERE username=? AND password=?';
	db.get(sql, [username, hashedPassword], (err, row) => {
		var result = {};
		result[req.params.user] = [];
  		if (err) {
			res.status(404);
			result["error"] = err.message;
		} 
		else {
			result[req.params.user] = row;
			// Check (username,password) exists in DB, if no matching record -> invalid login.
			if (result[req.params.user] === undefined){
				console.log("login failed");
				result["fail"] = "Invalid Username or Password."
			}
			else{
				// Sign a token and send it back in the response.
				var token = jwt.sign(result[req.params.user], key, {
					expiresIn: 60*60*24 // Expires after 24 hours
				});
				result["token"] = token;
				console.log(req.params.user + " LOGIN");
			}
		}
		res.json(result);
	});
});

// Create a new user -> add it to db
app.post('/api/register/:user/', function (req,res) {
	var userName = '\"' + req.params.user.trim() + '\"';
	var hashedPassword = '\"' + saltHashPassword(req.body.password.trim()) + '\"';
	console.log("hasehd password is " + hashedPassword);
	
	var result = {};
	if (req.body.eamil === undefined){
		email = null;
	} else {
		var email = '\"' + req.body.eamil.trim() + '\"';
	}
	
	let sql = 'INSERT INTO user(username, password, email) VALUES (?,?,?);';
	db.run(sql, [userName, hashedPassword, email], function (err){
		if (err){
			// Error is due to duplicate username.
			if (err.message == "SQLITE_CONSTRAINT: UNIQUE constraint failed: user.username"){
				result["fail"] = "Username is taken.";
			} else { // other DB error
				result["error"] = err.message;
			}
		}else {
			result[req.params.user] = "new user created: "+this.changes;
		}
		console.log("REGISTER");
		console.log(JSON.stringify(result));
		res.json(result);
	});
});

// Delete an account
app.delete('/api/delete/:user', function (req,res) {
	var user = '\"' + req.params.user + '\"';
	var token = req.body.token;
	var result = {};

	jwt.verify(token, key, function(err, content) {
		if (err) {  // token expires
			res.status(401); //unauthorized
			console.log(err);
		}
		else {
			var credentials = content.username; // get username from the decoded content
			console.log(credentials);
			if (credentials != user) { // username miss match
				result["fail"] = "Fail to validate credentials. Account not deleted."
				res.json(result);
				return;
			} 
			else {
				let sql = 'DELETE FROM user WHERE username=?;';
				db.run(sql, [user], function (err){
					if (err){
						res.status(404);
							result["error"] = err.message;
					} 
					else {
						if(this.changes!=1){
							result["error"] = "Not deleted";
						}
						else {
							result[req.body.user] = "Deleted";
							current_user ="";
						}
					}
					console.log("DELETE ACCOUNT");
					console.log(JSON.stringify(result));
					res.json(result);
				});
			}
		}
	});
});

// Update information of a user
app.put('/api/updateinfo/', function (req,res) {
	var userName = '\"' + req.body.user + '\"';
	var parameter = [];
	var result = {};
	var token = req.body.token;
	var credentials;

	jwt.verify(token, key, function (err, content) {
		if (err) {  // token expires
			console.log(err);
		} else {
			credentials=content.username; // get username from the decoded content
			if (credentials != userName) { // username miss match
				result["fail"] = "Fail to validate credentials. Information not updated."
				res.json(result);
				return;
			}
			else { // credentials checked
				if (req.body.email === undefined){ // updating password
					var password = '\"' + saltHashPassword(req.body.password.trim()) + '\"';
					parameter.push(password);
					parameter.push(userName);
					var sql = 'UPDATE user SET password=? WHERE username=?;';
				}
				else if (req.body.password === undefined) { // updating email
					var email = '\"' + req.body.email.trim() + '\"';
					var sql = 'UPDATE user SET email=? WHERE username=?;';
					parameter.push(email);
					parameter.push(userName);
				}
				else { // email and password are updated
					var email = '\"' + req.body.email.trim() + '\"';
					var password = '\"' + saltHashPassword(req.body.password.trim()) + '\"';
					var sql = 'UPDATE user SET email=?, password=? WHERE username=?;';
					parameter.push(email);
					parameter.push(password);
					parameter.push(userName);
				}
				db.run(sql,parameter,function (err){
					if (err){
						res.status(409);
							result["error"] = err.message;
					} else {
						if (this.changes != 1){
							result["error"] = "fail to update";
						}
						else {
							result[req.body.user] = "user info updated";
						}
					}
					console.log("UPDATE ACCOUNT");
					console.log(JSON.stringify(result));
					res.json(result);
				});
			}
		}
	});
});

app.listen(port, function () {
  console.log('Example app listening on port '+port);
});

var WebSocketServer = require('ws').Server
   ,wss = new WebSocketServer({port: 11138});
const uuid = require('uuid');
const Stage=require('./static-content/serverModel.js');

var updates={};
var update=false;
var stage=new Stage();
var current_bullets=[]
var interval=setInterval(function(){ stage.step(),delete_player(),check_removes(),wss.broadcast(JSON.stringify(updates))},20);

wss.on('close', function() {
    console.log('disconnected');
});

wss.broadcast = function(message){
	if(update){
		for(let ws of this.clients){ 
			ws.send(message); 	
		}
		current_bullets=[];
		updates={};
		update=false;
	}
}
//handling the message from clients
wss.on('connection', function(ws) {
	ws.id= uuid.v4();
	var new_player=stage.newPlayer(ws.id);
	ws.send(JSON.stringify({'id':ws.id}));
	ws.send(JSON.stringify(stage,getCircularReplacer()));
	update=true;
	updates=Object.assign(updates,new_player);
	ws.on('message', function(message) {
		var data=JSON.parse(message);
		var keys=Object.keys(data);
		for(var i = 0; i < keys.length; i++){
			switch(keys[i]){
				case 'shoot':
					update_shoot(stage.getPlayer(ws.id),data.shoot);
					break;
				case 'move':
					update_move(stage.getPlayer(ws.id),data.move);
					break;
				case 'rotate':
					update_rotation(stage.getPlayer(ws.id),data.rotate);
					break;
			}
		}
	});
});

//apply player rotation
function update_rotation(player,rotation){
	update=true;
	player.rotate(rotation[0],rotation[1]);
	updates=Object.assign(updates,{'rotate':[player.rotation,player.id]});
}
//apply player shooting
function update_shoot(player,shoot){
	update=true;
	player.shoot(shoot[0],shoot[1]);
}
//apply player movement
function update_move(player,move){
	update=true;
	player.move(move[0],move[1]);
	updates=Object.assign(updates,{'move':[player.position.x,player.position.y,player.id]});
}
//send the all the removed actor infomation to clients
function check_removes(){
	if(stage.removes.length!=0 ){
		update=true;
		for(var i=0;i<stage.removes.length;i++){
			if(stage.removes[i].owner=="player"){
				updates=Object.assign(updates,{'removePlayer':stage.removes[i].id});
				disconnect_client(stage.removes[i].score,stage.removes[i].id)
			}else{
				updates=Object.assign(updates,{'remove':[stage.removes[i].x,stage.removes[i].y]});
			}
		}
		stage.removes=[];
	}
	if(stage.bullets.length!=0){
		update=true;
		for(var i=0;i<stage.bullets.length;i++){
			current_bullets.push(stage.bullets[i].x);
			current_bullets.push(stage.bullets[i].y);
			current_bullets.push(stage.bullets[i].direction.x);
			current_bullets.push(stage.bullets[i].direction.y);
			current_bullets.push(stage.bullets[i].id);
		}
		updates=Object.assign(updates,{'addActor':current_bullets});
		stage.bullets=[];
	}
	if(stage.refresh===true){
		update=true;
		stage.refresh=false;
		updates=Object.assign(updates,{'refresh':1});
	}
}
//send score to the client of dead player
function disconnect_client(score,id){
	for(let ws of wss.clients){
		if(ws.id==id){
			ws.send(JSON.stringify({'score':score}));
			ws.close();
		} 
	}
}
//delete the player(disconnected)
function delete_player(){
	var ws_id=[];
	for(let ws of wss.clients){
		ws_id.push(ws.id);
	}
	for(var i=0;i<stage.player_id.length;i++){
		if(ws_id.includes(stage.player_id[i])==false){
			stage.removePlayer(stage.getPlayer(stage.player_id[i]));
		}	
	}
}
//reference:https://stackoverflow.com/questions/11616630/how-can-i-print-a-circular-structure-in-a-json-like-format
//delete circular data in object
const getCircularReplacer = () => {
	const seen = new WeakSet();
	return (key, value) => {
	  if (typeof value === "object" && value !== null) {
		if (seen.has(value)) {
		  return;
		}
		seen.add(value);
	  }
	  return value;
	};
  };