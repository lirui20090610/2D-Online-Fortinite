stage=null;
view = null;
interval=null;
mouse_x=600;
mouse_y=300;

var socket;
var stage;//game model
var updates={};//dictionary for all the updates
var update=false;//boolean to decide whether send data to server
var id=[];//player id
var score=0;//player score

function setupGame(){
    socket = new WebSocket("ws://142.1.200.148:11138");
    // document.addEventListener('keydown', moveByKey);
    socket.onopen = function (event) {
    	$('#sendButton').removeAttr('disabled');
    	console.log("connected");
    	stage=new Stage(document.getElementById('theCanvas'));
    };
    socket.onclose = function (event) {
    	alert("Your score is " + score);
    };
    socket.onmessage = function (event) {
    	var data=JSON.parse(event.data);
    	var keys=Object.keys(data);
    	setInterval(function(){ check_send()},20);
    	for(var i = 0; i <keys.length; i++){
    		switch(keys[i]){
    			//server only send minimal messages
    			//client needs to handle different types of messages
    			case 'move':
    				var current_player=stage.getPlayer(data.move[2]);
    				current_player.x=data.move[0];
    				current_player.y=data.move[1];
    				stage.draw();
    				break;
    			case 'rotate':
    				var current_player=stage.getPlayer(data.rotate[1]);
    				current_player.rotation=data.rotate[0];
    				stage.draw();
    				break;
    			case 'id':
    				console.log("id");
    				id.push(data.id);
    				break;
    			case 'actors':
    				create_game(data);
    				stage.draw();
    				break;
    			case 'addPlayer':
    				if(data.addPlayer.id!=id[0]){
    					var new_player=new Player(stage,new Pair(data.addPlayer.position[0],data.addPlayer.position[1]),data.addPlayer.id);
    					console.log(new_player);
    					stage.addPlayer(new_player);
    					stage.draw();
    				}
    				break;
    			case 'remove':
    				stage.removeActor(stage.getActor(data.remove[0],data.remove[1]));
    				stage.draw();
    				break;
    			case "removePlayer":
    				console.log("imdead");
    				stage.removePlayer(stage.getPlayer(data.removePlayer));
    				stage.draw();
    				break;
    			case 'addActor':
    				for(var i=0;i<data.addActor.length;i+=5){
    					var b =new bullet(stage,new Pair(data.addActor[i],data.addActor[i+1]),new Pair(data.addActor[i+2],data.addActor[i+3]),data.addActor[i+4]);
    					stage.addActor(b);
    				}
    				stage.draw();
    				break;
    			case 'score':
    				score=data.score;
    				break;
    		}
    		if(keys.includes("refresh")){
    			stage.draw();
    		}
    	}
    }
    //send player's rotation coordinates to the server
    $('#theCanvas').mousemove(function(event){
    	var x=event.pageX-this.offsetLeft;
    	var y=event.pageY-this.offsetTop;
    	// console.log([x,y]);
    	updates=Object.assign(updates,{ 'rotate':[x,y]});
    	update=true;
    });
    //send player's movement to the server
    //by dragging the player
    document.getElementById('theCanvas').addEventListener('touchmove', function (event) {
    	var x=event.touches[0].clientX-this.offsetLeft;
    	var y=event.touches[0].clientY-this.offsetTop;
    	var dx=0;
    	var dy=0;
    	if(x<((this.width/5)*2)){
    		dx=-1;
    	}else if(x>=((this.width/5)*2) && x<=((this.width/5)*3)){
    		dx=0
    	}
    	else{
    		dx=1;
    	}
    	if(y<((this.height/5)*2)){
    		dy=-1;
    	}else if(y>=((this.height/5)*2) && y<=((this.height/5)*3)){
    		dy=0
    	}
    	else{
    		dy=1;
    	}
    	updates=Object.assign(updates,{ 'move':[dx,dy]});
    	update=true;
    });
    //detect the orientation of mobile devices
    //auto fix the screen
    window.addEventListener('orientationchange',function (event){
    	document.getElementById('theCanvas').width=window.innerWidth;
    	document.getElementById('theCanvas').height=window.innerHeight;
    	stage.draw();
    });
    //detect single touch
    //one touch means rotate and shoot
    document.getElementById('theCanvas').addEventListener('touchstart', function (event) {
    	if(event.touches.length==2){
    		var x=event.touches[0].clientX-this.offsetLeft;
    		var y=event.touches[0].clientY-this.offsetTop;
    		console.log(x,y);
    		updates=Object.assign(updates,{ 'rotate':[x,y]});
    		updates=Object.assign(updates,{ 'shoot':[x,y]});
    		update=true;
    	}
    });

    // send player's shooting aim to the server
    $('body').mousedown(function(event){
    	var x=event.pageX-this.offsetLeft;
    	var y=event.pageY-this.offsetTop;
    	updates=Object.assign(updates,{ 'shoot':[x,y]});
    	update=true;
    });

    //send the corresponding data of the key that client pressed to the server
    $('body').keydown(function(event){
    	var key = event.key;
    	var moveMap = { 
    		'a': { "dx": -1, "dy": 0},
    		's': { "dx": 0, "dy": 1},
    		'd': { "dx": 1, "dy": 0},
    		'w': { "dx": 0, "dy": -1},
    	};
    	var weaponMap = {
    		'1':0,
    		'2':1,
    		'3':2,
    		'4':3,
    		"5":4
    	}
    	if(key in moveMap){	
    		updates=Object.assign(updates,{ 'move': [moveMap[key].dx, moveMap[key].dy]});
    		update=true;
    	}
    });
}
//send all the info in updates list
function check_send(){
	if(update){
		socket.send(JSON.stringify(updates));
		updates={};
		update=false;
	}
}

//create local model according to the info from server
function create_game(data){
	var actors=data.actors;
	for(var i = 0; i < actors.length; i++){
		switch(actors[i].owner){
			case 'border':
				var terrain=new boarder(stage,new Pair(actors[i].x,actors[i].y),actors[i].width,actors[i].height,actors[i].check_indeside,actors[i].speed,actors[i].owner,actors[i].color);
				stage.addActor(terrain);
				stage.map.push(terrain);
				break;
			case "map_circle":
				var circle=new map_circle(stage,new Pair(actors[i].x,actors[i].y),actors[i].radius,actors[i].image);
				stage.addActor(terrain);
				break;
			case "amunition":
				var ammo=new amunition(stage,new Pair(actors[i].x,actors[i].y),actors[i].type,actors[i].image);
				stage.addActor(ammo);
				break;
			
			case "gun":
			case "explosive":
			case "medical":
				var item=new gun(stage,new Pair(actors[i].x,actors[i].y),actors[i].type,actors[i].owner,actors[i].image);
				stage.addActor(item);
				break;
			
			case "box":
				var obstacle=new box(stage,new Pair(actors[i].x,actors[i].y),actors[i].image);
				stage.addActor(obstacle);
				break;
			case "player":
				var user=new Player(stage,new Pair(actors[i].x,actors[i].y),actors[i].id);
				stage.addPlayer(user);
				if(actors[i].id==id[0]){
					stage.player=user;
				}
		}
	}
}
