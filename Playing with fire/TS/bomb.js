class Bomb extends Phaser.GameObjects.GameObject{

    constructor(scene,x,y){
        super(scene, x, y);
        this.x =x;
        this.y = y;
        this.setPosition(x,y);
        

    }


}