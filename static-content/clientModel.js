function randint(n){ return Math.round(Math.random()*n); }
function rand(n){ return Math.random()*n; }

class Stage {
	constructor(canvas){
		this.canvas = canvas;
	
		this.actors=[]; // all actors on this stage (monsters, player, boxes, ...)
		this.players=[];
		this.bullets=[];
		this.player=null;
		//the width and height of the canvas
		this.width=canvas.width;
		this.height=canvas.height;

		//the width and height of the map
		this.map_width=3000;
		this.map_height=3000;
		this.map=[];
		
	}
	addPlayer(player){
		this.addActor(player);
		this.players.push(player);
	}
	getPlayer(id){
		for(var i=0;i<this.players.length;i++){
			if(this.players[i].id==id){
				return this.players[i]
			}
		}
		return null
	}
	removePlayer(player) {
        var index = this.players.indexOf(player);
        if (index !== -1) {
            this.players.splice(index, 1);
        }
        this.removeActor(player);
	}
	addActor(actor){
		this.actors.push(actor);
	}
	removeActor(actor){
		var index=this.actors.indexOf(actor);
		if(index!=-1){
			this.actors.splice(index,1);
		}
	}
	removeBullet(actor){
		console.log("here");
		var index=this.bullets.indexOf(actor);
		if(index!=-1){
			this.bullets.splice(index,1);
		}
	}
	draw(){
		var context = this.canvas.getContext('2d');
		for(var i=0;i<this.actors.length;i++){
			this.actors[i].draw(context);
		}
	}
	getBullet(x,y){
		for(var i=0;i<this.bullets.length;i++){
			if(this.bullets[i].x==x && this.bullets[i].y==y){
				return this.bullets[i];
			}
		}
		return null;
	}
	// return the first actor at coordinates (x,y) return null if there is no such actor
	getActor(x, y){
		for(var i=0;i<this.actors.length;i++){
			if(this.actors[i].x==x && this.actors[i].y==y){
				return this.actors[i];
			}
		}
		return null;
	}
	
} // End Class Stage

class Pair {
	constructor(x,y){
		this.x=x; this.y=y;
	}

	toString(){
		return "("+this.x+","+this.y+")";
	}

	normalize(){
		var magnitude=Math.sqrt(this.x*this.x+this.y*this.y);
		this.x=this.x/magnitude;
		this.y=this.y/magnitude;
	}
}

//actor of the game
class actor{
    constructor(stage, position){
        this.stage = stage;
		this.position=position;
		this.intPosition();
    }
    intPosition(){
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}
	
	//distance between two points
    distance(one,another) {
        var diff_x = one.x - another.x;
        var diff_y = one.y - another.y;
        return Math.floor(Math.sqrt(diff_x * diff_x + diff_y * diff_y));
	}
	
	//collision detection of two circles
    collision(one,another,d){
        if( d >= this.distance(one,another.position)){
            return true
        }else{
            return false
        }
	}
	
	//collision detection of a circle and a square
    square_collision(point,box,radius,d){
        //d is used to detect collision smoothly
        var corners=[];
        corners.push(new Pair(box.x,box.y));
        corners.push(new Pair(box.x+box.width,box.y));
        corners.push(new Pair(box.x,box.y+box.width));
        corners.push(new Pair(box.x+box.width,box.y+box.width));
        corners.push(new Pair(box.x+box.width*1/2,box.y+box.width*1/2));
        // console.log(point.x,point.y);
        for(var i=0;i<4;i++){
            if(this.distance(point,corners[i]) <= radius+d){
                // console.log(i);
                return true
            }
        }
        if(this.distance(point,corners[4]) <= (radius+box.width*1/2+d)){
    
            return true
        }else{
            return false
        }
	}
	
	//dirtion momentum
    headTo(){
		this.direction.x=(this.direction.x-this.position.x);
		this.direction.y=(this.direction.y-this.position.y);
		this.direction.normalize();
		this.direction.x=this.direction.x*this.speed;
		this.direction.y=this.direction.y*this.speed;
	}
	
	//change the current health of the actor
    changeHealth(value){
		this.health+=value;
		if(this.health>=100){
			this.health=100;
		}
        if(this.health<=0){
            this.dead=true;
        }
	}
	
	//check whether an actor is dead
    isDead(){
        if(this.dead){
			this.stage.removeActor(this);
			return true
		}
	}
	//calculate the canvas coordinates according to the map coordinates
    canvas_xy(x,y){
		var new_x=this.x-this.stage.player.x+this.stage.width/2;
		var new_y=this.y-this.stage.player.y+this.stage.height/2;
		return new Pair(new_x,new_y);
	}
	//whether an actor should be drawn
	//if it is not on the canvas, then it should not be drawn
	isdrawn(point){
		if(point.x < (0-this.radius) || point.x > (this.stage.width+this.radius) || point.y < (0-this.radius) || point.y > (this.stage.height+this.radius)){
			return false
		}
		return true
	}
	//all the objects that inherite this class should have these two methods
    step(){}
    draw(context){}
}

//bullets are actors and they inherit actor class
class bullet extends actor{
	constructor(stage, position, direction,id){
		super(stage,position);
		this.direction=direction;
		this.id=id;
	}
	
	draw(context){
		var point=this.canvas_xy();
		context.beginPath();
		context.lineWidth=3;
		context.strokeStyle = "#000000";
		context.moveTo(point.x,point.y);
		context.lineTo(point.x+this.direction.x,point.y+this.direction.y);
		context.stroke();
		this.stage.removeActor(this);
	}
}

//fireballs are actors and they inherit bullet class
class fireball extends bullet{
	constructor(stage, position, direction,speed,range,damage,owner,color){
		super(stage, position, direction,speed,range,damage,owner);
		this.radius=5;
		this.color=color;
	}

	//difference between fireball and bullet is that fireballs are drawn in different ways
	draw(context){
		var point=this.canvas_xy();
		context.beginPath();
		context.fillStyle = this.color;
		context.arc(point.x,point.y, this.radius, 0, Math.PI * 2);
        context.fill();	
	}
}

//explosives are actors and they inherit fireball class
class explosive extends fireball{
	constructor(stage, position, direction,speed,shoot_range,explosive_range,damage,owner,color){
		super(stage, position, direction,speed,shoot_range,damage,owner,color);
		this.radius=5;
		this.shoot_range=shoot_range;
		this.explosive_range=explosive_range;
		this.shoot_count=0;
		this.explosive_count=0;
	}
}

//shrinkages are actors and they inherit actor class
class Shrink extends actor{
	constructor(stage, position,radius){
		super(stage,position);
		this.radius=radius;
		this.player_count=0;
		this.shrink_counter=0
		this.damage=10;
	}
	
	//check whether player is inside shrinking area
	outside(){
		return this.distance(this.position,this.stage.player.position) > this.radius
	}

	//draw the shrinking circle
	draw(context){
		var point=this.canvas_xy();
		if(this.radius>0){
			context.beginPath();
			context.strokeStyle="#000000";
			context.lineWidth = 10;
			context.arc(point.x,point.y,this.radius, 0, 2 * Math.PI, false);
			context.stroke();
		}
	}
}

//zombies are actors and they inherit actor class
class zombie extends actor{
	constructor(stage, position,name,image){
        super(stage, position);
		this.speed=1;
		this.damage=10;
		this.radius=20;
		this.health=100;
		this.dead=false;
        this.attack_count=0;
		this.owner="zombie";
		this.name=name;
		this.image=image;
	}
	draw(context){
		var point=this.canvas_xy();
		if(this.isdrawn(point)){
			context.save();
			context.beginPath();
			context.arc(point.x, point.y,this.radius, 0, 2 * Math.PI, false);
			context.clip();
			context.drawImage(this.image,point.x-this.radius, point.y-this.radius,this.radius*2,this.radius*2);
			context.closePath();
			context.restore();
		}
	}
}

//circles on the map are actors and they inherit actor class
//example:trees, rocks
class map_circle extends actor{
	constructor(stage, position,radius,image){
		super(stage,position);
		// console.log(this.x,this.y);
		this.radius=radius;
		this.image=image;
		this.owner="map_circle";
	}
	draw(context){
		var point=this.canvas_xy();
		if(this.isdrawn(point)){
			context.save();
			context.beginPath();
			context.arc(point.x, point.y,this.radius, 0, 2 * Math.PI, false);
			context.clip();
			var my_image=new Image();
			my_image.src=this.image;

			context.drawImage(my_image,point.x-this.radius, point.y-this.radius,this.radius*2,this.radius*2);
			context.closePath();
			context.restore();
		}
	}
}

//squares on the map are actors and they inherit actor class
class map_rect extends actor{
	constructor(stage, position,width,height,image){
		super(stage,position);
		// console.log(this.x,this.y);
		this.width=this.width;
		this.height=this.height;
		this.image=image;
		this.owner="map_rect";
	}
	draw(context){
		var point=this.canvas_xy();
		if(this.isdrawn(point)){
			context.save();
			context.beginPath();
			context.rect(point.x, point.y,this.width,this.height);
			context.clip();
			context.drawImage(this.image,point.x, point.y,this.width,this.height);
			context.closePath();
			context.restore();
		}
	}
}

//amunitions are actors and they inherit actor class
class amunition extends actor{
	constructor(stage, position,type,image){
		super(stage,position);
        this.ammo=50;
        this.width=50;
        this.type=type;
		this.owner="amunition";
		this.image=image;
	}
	
	draw(context){
		var point=this.canvas_xy();
		if(this.isdrawn(point)){
			var my_image=new Image();
			my_image.src=this.image;
			context.drawImage(my_image,point.x,point.y,this.width,this.width);
		}
	}
}

//guns on the map are actors and they inherit actor class
//weapons have different types
//its owner is its parent category
//eg. pistol type:pistol owner:gun
//eg. grenade type:grenade owner:explosive
class gun extends actor{
    constructor(stage, position,type,owner,image){
		super(stage,position);
        this.type=type;
        this.width=50;
        this.owner=owner;
        this.image=image;
	}
	
	
    draw(context){
		var point=this.canvas_xy();
		if(this.isdrawn(point)){
			var my_image=new Image();
			my_image.src=this.image;
            context.drawImage(my_image,point.x,point.y,50,50);
		}
	}
}

//boxes on the map are actors and they inherit actor class
//eg. wood obstacle
//it has its own health and it can be destroyed
class box extends actor{
    constructor(stage, position,image){
		super(stage,position);
		this.health=100;
		this.width=100;
		this.image=image;
		this.owner="box";
	}
	draw(context){
		var point=this.canvas_xy();
		if(this.isdrawn(point)){
			context.beginPath();
			context.save();
			
			context.scale(this.scale/10,this.scale/10);
			var my_image=new Image();
			my_image.src=this.image;
			context.drawImage(my_image,point.x,point.y,this.width,this.width);
			context.restore();
		}
	}
}

//map itself is an actor and it inherits actor class
//it is not being used right now
class Map extends actor{
	constructor(stage, position){
		super(stage,position);
		this.stuff=[];
		this.owner="map";
	}
	draw(context){
		for(var i=0;i<this.stuff.length;i++){
			this.stuff[i].draw(context);
		}
	}
}

//boarder itself is an actor and it inherits actor class
//eg. desert terrain
//eg. ice terrain
class boarder extends actor{
	constructor(stage, position,width,height,check,speed,owner,color){
		super(stage,position);
		this.width=width;
		this.height=height;
		this.speed=speed;
		this.owner=owner;
		this.check_inside=check;
		this.color=color;
	}
	draw(context){
		var point=this.canvas_xy();
		context.beginPath();
		context.fillStyle=this.color;
        context.rect(point.x, point.y,this.width,this.height);
		context.fill();
	}
}

//player is an actor and it inherits actor class
class Player extends actor{
    constructor(stage, position,id){
		super(stage,position);
		this.id=id;
        this.speed=10;
        this.ammo={
            "pistol":0,
            "rifile":0,
			"shotgun":0,
			"grenade":0,
			"nuclear":0,
			"medical":0
        };
        this.health=100;
		this.dead=false;
		this.rotation=0;
		this.radius=30;
		this.score=0;
        this.owner="player";
        this.weapons=[];
        for(var i = 0; i < 5; i++) {
            this.weapons.push(0);
        }
        this.current=-1;
	}

    draw(context){	
		context.setTransform(1,0,0,1,this.stage.width/2,this.stage.height/2);
		// console.log([this.x,this.y]);
		context.translate(this.x - this.stage.player.x, this.y - this.stage.player.y);

        context.rotate(this.rotation);
		
		//body
        context.beginPath();
        context.fillStyle = "#66ff33";
		context.arc(0,0, 30, 0, Math.PI * 2);
        context.fill();
        context.lineWidth = 5;
        context.strokeStyle = '#ff0000';
        context.stroke();

		//hands
        context.fillStyle = "#e600ac";
        context.beginPath();
        context.arc(+30/Math.sqrt(2), -30/Math.sqrt(2),10, 0, 2 * Math.PI, false);
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = '#1a53ff';
        context.stroke();

        context.beginPath();
        context.arc(30/Math.sqrt(2), 30/Math.sqrt(2),10, 0, 2 * Math.PI, false);
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = '#1a53ff';
		context.stroke();
		
		context.translate(-(this.x - this.stage.player.x),-(this.y - this.stage.player.y));
		context.setTransform(1,0,0,1,0,0);
		
	}
	//drawing player health, inventory, ammo here
	player_status(context){
        
        for(var i=0;i<this.weapons.length;i++){//draw weapons
            context.beginPath();
            context.strokeStyle = "#000000";
            if(this.current==i){
                // console.log(i);
                context.strokeStyle = "#cc0000";
            }
            context.lineWidth = 3;
            context.strokeRect(597+i*60,530,56,56);
            context.stroke();
            if(this.weapons[i]!=0){
                var image=new Image();
                // console.log(this.weapons[i]);
                image.src="source/"+this.weapons[i]+".jpg";
                context.drawImage(image,600+i*60,533,50,50);
            }
        }
        if(this.current!=-1){
            context.fillStyle = "#000000";
            context.font = "30px Arial";
            context.fillText(this.weapons[this.current]+": "+this.ammo[this.weapons[this.current]],900, 573);
        }
        
		context.fillStyle = "#000000";
        context.font = "30px Arial";
        context.fillText("Score:"+this.score, 10, 50);

        context.fillStyle = "#000000";
        context.font = "30px Arial";
        context.fillText("Health:", 220, 573);

        context.beginPath();
        context.strokeStyle = "#000000";
        context.lineWidth = 1;
        context.strokeRect(329,550,202,30);
        context.stroke();
    
        var health_length=this.health/100*200;
        context.beginPath();
        context.fillStyle = "#00b300";
        context.rect(330,551,health_length,28);
		context.fill();
	}
}