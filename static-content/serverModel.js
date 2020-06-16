function randint(n){ return Math.round(Math.random()*n); }
function rand(n){ return Math.random()*n; }

class Stage {
	constructor(){	
		this.actors=[]; // all actors on this stage (monsters, player, boxes, ...)
		this.players=[];
		this.removes=[];
		this.bullets=[];
		this.player_id=[];
		this.refresh=false;
		//the width and height of the canvas
		this.width=1200;
		this.height=600;
		// this.run=false;

		//the width and height of the map
		this.map_width=3000;
		this.map_height=3000;
		this.map=[];

		var sea=new boarder(this,new Pair(-this.width/2,-this.height/2),this.map_width+this.width,this.map_width+this.height,false,0,"border","#0000b3");
		var land=new boarder(this,new Pair(0,0),this.map_width,this.map_height,false,0,"border","#397B48");
		var ice=new boarder(this,new Pair(800,200),1200,900,true,20,"border","#6666ff");
		var desert=new boarder(this,new Pair(2300,200),500,1800,true,-5,"border","#b38600");
		// var shrink=new Shrink(this,new Pair(this.map_width/2,this.map_height/2),1000);

		// var tree=new map_circle(this,new Pair(800,1500),80,"source/tree.jpg");
		// var rock=new map_circle(this,new Pair(800,1300),80,"source/rock.jpg");

		this.map.push(land);
		this.map.push(ice);
		this.map.push(desert);
		// this.map.push(shrink);

		this.addActor(sea);
		this.addActor(land);
		this.addActor(ice);
		this.addActor(desert);
		
        var ammo_rifile=new amunition(this,new Pair(1400,1300),"rifile","source/amunition.jpg");
        this.addActor(ammo_rifile);
       
        var rifile_1=new gun(this,new Pair(1300,1200),"rifile","gun","source/rifile.jpg");
		this.addActor(rifile_1);
		var rifile_2=new gun(this,new Pair(1200,1200),"rifile","gun","source/rifile.jpg");
		this.addActor(rifile_2);
		var rifile_2=new gun(this,new Pair(1100,1200),"rifile","gun","source/rifile.jpg");
        this.addActor(rifile_2);

		var total=50;
		while(total>0){
			if(total %2==0){
				var x=Math.floor((Math.random()*this.map_width)); 
				var y=Math.floor((Math.random()*this.map_height));
				var rifile=new gun(this,new Pair(x,y),"rifile","gun","source/rifile.jpg");
				this.addActor(rifile);
				
			}else {
				// var x=Math.floor((Math.random()*this.map_width)); 
				// var y=Math.floor((Math.random()*this.map_height));
				// var a=new amunition(this,new Pair(x,y),"pistol");
				// this.addActor(a);
				// x=Math.floor((Math.random()*this.map_width)); 
				// y=Math.floor((Math.random()*this.map_height));
				// a=new amunition(this,new Pair(x,y),"shotgun");
				// this.addActor(a);
				var x=Math.floor((Math.random()*this.map_width)); 
				var y=Math.floor((Math.random()*this.map_height));
				var a=new amunition(this,new Pair(x,y),"rifile","source/amunition.jpg");
                this.addActor(a);
				
			}
			total--;
		}
		// this.addActor(shrink);
	}
	newPlayer(id){
		while (true) {
            var x=Math.floor((Math.random()*this.map_width)); 
			var y=Math.floor((Math.random()*this.map_height));
            if (this.getActor(x, y) === null) {
				this.run=true;
				this.addPlayer(new Player(this, new Pair(x, y), id));
				this.player_id.push(id);
                return {'addPlayer':{'position':[x,y],'id':id}};
            }
        }
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
			this.removeActor(player);
			var id_index=this.player_id.indexOf(player.id);
			if (id_index !== -1) {
				this.player_id.splice(id_index, 1);
			}
        }
        
	}
	
	addActor(actor){
		this.actors.push(actor);
	}
	removeActor(actor){
		// if(actor.owner!='player'){
		if(actor.owner!=='player_bullet'){
			// console.log("removenot bullet");
			this.removes.push(actor);
		}
		var index=this.actors.indexOf(actor);
		if(index!=-1){
			this.actors.splice(index,1);
			// return 'delete';
		}
		// }
	}
	removeBullet(actor){
		var index=this.bullets.indexOf(actor);
		if(index!=-1){
			this.bullets.splice(index,1);
			// return 'deletebullet';
		}
	}

	// Take one step in the animation of the game.  Do this by asking each of the actors to take a single step. 
	// NOTE: Careful if an actor died, this may break!
	step(){
		if(this.run){
			for(var i=0;i<this.actors.length;i++){
				this.actors[i].step();
			}
		}
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
        if(this.dead==true){
			this.stage.removePlayer(this);
			return true
		}
		return false
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
}

//bullets are actors and they inherit actor class
class bullet extends actor{
	constructor(stage, position, direction,speed,range,damage,owner,id){
		super(stage,position);
		this.direction=direction;
		this.speed=speed;
		this.range=range;
		this.damage=damage;
		this.count=0;
		this.radius=0;
		this.headTo();
		this.owner=owner;
		this.id=id;
		this.bullet_count=this.stage.bullet_count;
		this.stage.bullet_count++;
	}
	//check whether a bullet hits an actor
	//different actors would have different affects
	hit(){
		for(var i=0;i<this.stage.actors.length;i++){
			switch(this.stage.actors[i].owner){
				case "player":
					if(this.id!=this.stage.actors[i].id){
						if(this.collision(this.position,this.stage.actors[i],this.stage.actors[i].radius+this.radius)){
							this.stage.actors[i].changeHealth(-this.damage);
							if(this.stage.actors[i].isDead()){
								this.stage.getPlayer(this.id).changeScore(1);
							}
							// this.stage.removeActor(this);
							return true
							

						}
					}
					break;
			}
		}
	}
	step(){
		// this.stage.removeActor(this);
		// this.stage.removeBullet(this);
		this.position.x=this.position.x+this.direction.x;
		this.position.y=this.position.y+this.direction.y;
		// console.log(this.map_position.x,this.map_position.y);
		this.intPosition();
		// this.stage.addActor(this);
		this.stage.bullets.push(this);
		if(this.hit()){
			this.stage.removeActor(this);
			this.stage.refresh=true;
			return null
		}
		this.count++;
		if(this.count==this.range){
			// this.stage.removeBullet(this);
			this.stage.removeActor(this);
			this.stage.refresh=true;
		}
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

	//map shrinks every 20s
	//if player is inside the shrinking zone, impacts player's health
	step(){
		this.shrink_counter++;
		if(this.outside()){
			this.player_count++;
			
			if(this.player_count==100){//2s
				this.stage.player.changeHealth(-this.damage);
				this.player_count=0;
			}
		}
		if(this.shrink_counter==1000){//20s
			this.radius-=100;
			this.damage+=5;
			this.shrink_counter=0;
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
		this.image=image;
		this.owner="amunition";
	}
	//if the amunition collides with player, it would be picked up and player's ammo increases
	step(){
		for(var i=0;i<this.stage.players.length;i++){
			if(this.square_collision(this.stage.players[i].position,this,this.stage.players[i].radius,0)){
				this.stage.players[i].changeAmmo(this.type,this.ammo);
				this.stage.removeActor(this);	
			}
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
	
	//if the weapon collides with player, it would be picked up and player's would have weapon
    step(){
		for(var i=0;i<this.stage.players.length;i++){
			if(this.square_collision(this.stage.players[i].position,this,this.stage.players[i].radius,3)){
				if(this.stage.players[i].pickWeapon(this.type,this.owner)){
        	        this.stage.removeActor(this);
        	    }	
			}
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

	//everytime it is attacked, scaling it by recalculating its coordinates and size
	changeHealth(value){
		this.health+=value;
		this.position.x+=this.width/20;
		this.position.y+=this.width/20;
		this.width=this.width*9/10;
		this.intPosition()
        if(this.health<=0){
            this.dead=true;
        }
    }
	step(){
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

	add(actor){
		this.stuff.push(actor);
	}

	step(){
		for(var i=0;i<this.stuff.length;i++){
			this.stuff[i].step();
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
	//check whether a player is inside it 
	inside(point){
		if(point.x>=this.x && point.x<=this.x+this.width && point.y>=this.y && point.y<=this.y+this.height){
			return true;
		}
		return false
	}

	//if the player is inside it, it would impact player's speed
	step(){
		if(this.check_inside){
			for(var i=0;i<this.stage.players.length;i++){
				if(this.inside(this.stage.players[i].position)){
					if(this.stage.players[i].speed==10){
						this.stage.players[i].changeSpeed(this.speed);
					}
				}else{
					if(this.stage.players[i].speed==this.speed+10){
						this.stage.players[i].changeSpeed(-this.speed);
					}
				}
			}
		}	
	}
}

//player is an actor and it inherits actor class
class Player extends actor{
    constructor(stage, position,id){
        super(stage,position);
        this.ammo={
            "pistol":0,
            "rifile":0,
			"shotgun":0,
			"grenade":0,
			"nuclear":0,
			"medical":0
		};
		this.id=id;
		this.speed=10;
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

	//edit player's score
	changeScore(value){
		this.score+=value;
	}

	// edit player's speed
	changeSpeed(value){
		this.speed+=value;
	}
	
	//player can pick weapon and put it into the inventory
    pickWeapon(type,owner){
        switch(owner){
            case "gun":
                var index=0;
                while(index<2){
                    if(this.weapons[index]===0 && this.weapons.includes(type)===false){
                        this.weapons[index]=type;
                        if(this.current==-1){
                            this.current=0;
                        }
                        return true
                    }
                    index++;
				}
				break;
		}
		return false
	}
	
	//player can pick up ammo
    changeAmmo(type,value){
        this.ammo[type]+=value;
	}
	
	//player can use the weapons/explosives/medicals in his inventory
	//if player uses guns, create bullet actors
	//if player uses explosives, create explosives actors
	//if player uses medical, edit player's health
	shoot(mouse_x,mouse_y){
		if(this.ammo[this.weapons[this.current]]>0){
			this.changeAmmo(this.weapons[this.current],-1);
			var postion=new Pair(this.x,this.y);
			var direction=this.direction_xy(mouse_x,mouse_y);
			var type=this.weapons[this.current];
			switch(type){
				case "rifile":
					var speed=50;
					var range=100;
					var damage=20;
					var owner="player_bullet";
					var b=new bullet(this.stage,postion,direction,speed,range,damage,owner,this.id);
					// this.stage.bullets.push(b);
					this.stage.addActor(b);
					break;
			}
		}
	}

	//check whether the player is near the border of the map
    border_check(dx,dy){//true for not on border
        return ((this.x+this.speed*dx-this.radius)>=0 && (this.x+this.speed*dx+this.radius)<=this.stage.map_width && (this.y+this.speed*dy-this.radius)>=0 && (this.y+this.speed*dy+this.radius)<=this.stage.map_height)
	}
	
	//player can change current weapon
    changeWeapon(index){
        if(this.weapons[index]!=0){
            this.current=index;
        }
	}

	//return player's score
	getScore(){
		return this.score;
	}
	//remove player from the stage
	remove(){
		this.stage.removePlayer(this);
	}

	//players can move according to the key pressed
    move(dx,dy){
        if(this.border_check(dx,dy) ){
			this.position.x+=this.speed*dx;
			this.position.y+=this.speed*dy;
			this.intPosition();
		}else{	
		}
    }

	//calculate the rotation angle
	rotate(mouse_x,mouse_y){
		var diff_x= mouse_x -this.stage.width/2;
        var diff_y=mouse_y-this.stage.height/2;
        this.rotation=Math.atan2(diff_y, diff_x);
	}
	//calculate the mouse map coordinates
	direction_xy(x,y){
		var new_x=x-this.stage.width/2+this.x;
		var new_y=y-this.stage.height/2+this.y;
		return new Pair(new_x,new_y);
	}
}

module.exports = Stage;