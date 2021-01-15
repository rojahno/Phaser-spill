
var config = {
    type: Phaser.AUTO,

    width: 500,
    height: 500,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update,

    },
    scale: {
        zoom: 2.5,
        width: '100%',
        height: '100%'
    },
};

var player;
var bombs;
var stars;
var cursors;
var gameOver = false;
var scoreText;
var keys;
var total;
var score;
var time;
var tile;

// Layers
var map;
var walls;
var floor;
var vaseLayer;
var explosionLayer;
var itemLayer;

var debug = false;

var playerItems = {
    hearths: 3,
    canTakeDamage: true,
    lightning: 3,
    bombs: 1,
    canThrow: false,
    canPush: true,
}


var game = new Phaser.Game(config);


function preload() {
    this.load.image('bomb', 'assets/bomb.png');
    this.load.image('eskil', 'assets/eskil.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 16, frameHeight: 16 });
    this.load.image('star', 'assets/star.png');
    this.load.image('tiles', 'assets/dungeon-crawler-objects.png');
    this.load.tilemapTiledJSON('map', 'assets/dungeon.json');
}

function create() {

    time = this.time;

    map = this.make.tilemap({ key: 'map' });
    const tiles = map.addTilesetImage('dungeon-crawler-objects', 'tiles');

    walls = map.createLayer("walls", tiles, 0, 0);
    floor = map.createLayer('floor', tiles, 0, 0).setDepth(-1);
    vaseLayer = map.createLayer('dynamic', tiles, 0, 0);
    explosionLayer = map.createLayer('explosions', tiles, 0, 0);
    itemLayer = map.getObjectLayer('items');
    console.log(itemLayer);

    walls.setCollisionByProperty({ collides: true });
    vaseLayer.setCollisionByProperty({ collides: true });


    // The items added
    bombs = this.physics.add.group();
    stars = this.physics.add.group({
        setSize: {x:16, y:16}
    });
    
    // The player and its settings
    player = this.physics.add.sprite(25, 25, 'dude');
    player.body.setSize(10, 10, true);
    
    // The colliders and overlaps
    this.physics.add.collider(player, walls);
    this.physics.add.overlap(player, stars, collectItem, null, this);

    // this.physics.add.collider(player, vaseLayer);

    // player.setCollideWorldBounds(true);

    if (debug) {
        const debugGraphics = this.add.graphics().setAlpha(0.75);
        walls.renderDebug(debugGraphics, {
            tileColor: null, // Color of non-colliding tiles
            collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
            faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
        })
    }

    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();
    keys = this.input.keyboard.addKeys({ e: 'E', left: 'A', down: 'S', right: 'D' });

    //  The score
    scoreText = this.add.text(12, 3, 'score: 0', { fontSize: '10px', fill: '#000' });

}

function update() {
    if (!gameOver) {
        handleMovementInput();
        handleItemInput();
        printTileIndex();
        //console.log('player position: ' + '\n' +  player.x + '\n' + player.y);
    }
}

function printTileIndex() {
    var tile1 = vaseLayer.getTileAtWorldXY(player.x, player.y, false);

    //console.log(tile1);
    if (tile1 != null) {
        //vaseLayer.putTileAt(0,tile1.x, tile1.y);
        //console.log(tile1);

    }
    var tile2 = floor.getTileAtWorldXY(player.x, player.y, false);

    /*
    if(tile2 != null){
        console.log("floor x: " + tile2.x);
        console.log("floor y: " + tile2.y);
    }
    */

    /* var tile3 = walls.getTileAtWorldXY(player.x, player.y, false);
 
     if (tile3 != null && debug) {
         console.log("floor x: " + tile3.x);
         console.log("floor y: " + tile3.y);
     }
     */


}

function hitBomb(player, bomb) {
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play('turn');

    gameOver = true;
}

function handleMovementInput() {


    if (cursors.left.isDown) {
        player.setVelocityX(-100);
        player.setVelocityY(0);

        player.anims.play('left', true);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(100);
        player.setVelocityY(0);

        player.anims.play('right', true);
    }
    else if (cursors.up.isDown) {
        player.setVelocityY(-100);
        player.setVelocityX(0);

        player.anims.play('right', true);
    }
    else if (cursors.down.isDown) {
        player.setVelocityY(100);
        player.setVelocityX(0);

        player.anims.play('right', true);
    }
    else {
        player.setVelocityX(0);
        player.setVelocityY(0);
        player.anims.play('turn');
    }
}

function handleItemInput() {

    if (Phaser.Input.Keyboard.JustDown(keys.e)) {
        var x = player.x;
        var y = player.y;
        createBomb(x, y);
    }
}

function createBomb(x, y) {

    var bomb = bombs.create(x, y, 'bomb');
    bomb.setCollideWorldBounds(true);
    time.delayedCall(3000, updateCounter, [bomb], this);
}

function createBlast(bomb) {

    var tile = floor.getTileAtWorldXY(bomb.x, bomb.y, true);
    var explosionArray = [];
    var i;

    var canSpawnRight = true;
    var canSpawnLeft = true;
    var canSpawnUp = true;
    var canSpawnDown = true;


    explosionArray.push(map.putTileAt(214, (tile.x), tile.y, explosionLayer));

    for (i = 1; i <= playerItems.lightning; i++) {

        if (checkTileSpawn((tile.x + i), tile.y) && canSpawnRight) {
            if (checkForVase((tile.x + i), tile.y)) {
                vaseLayer.removeTileAt((tile.x + i), tile.y, false);
                spawnItem((tile.x + i), tile.y);
                canSpawnRight = false;
            }
            else {
                explosionArray.push(map.putTileAt(214, (tile.x + i), tile.y, explosionLayer));
            }
        }
        else {
            canSpawnRight = false;
        }

        if (checkTileSpawn((tile.x - i), tile.y) && canSpawnLeft) {
            if (checkForVase((tile.x - i), tile.y)) {
                vaseLayer.removeTileAt((tile.x - i), tile.y, false);
                spawnItem((tile.x - i), tile.y);
                canSpawnLeft = false;
            }
            else {
                explosionArray.push(map.putTileAt(214, (tile.x - i), tile.y, explosionLayer));
            }

        }
        else {
            canSpawnLeft = false;
        }

        if (checkTileSpawn(tile.x, (tile.y - i)) && canSpawnUp) {
            if (checkForVase(tile.x, (tile.y - i))) {
                vaseLayer.removeTileAt(tile.x, (tile.y - i), false);
                spawnItem((tile.x), tile.y - i);
                canSpawnUp = false;
            }
            else {
                explosionArray.push(map.putTileAt(214, tile.x, (tile.y - i), explosionLayer));
            }
        }
        else {
            canSpawnUp = false;
        }

        if (checkTileSpawn(tile.x, (tile.y + i)) && canSpawnDown) {
            if (checkForVase(tile.x, (tile.y + i))) {
                vaseLayer.removeTileAt(tile.x, (tile.y + i), false);
                spawnItem((tile.x), tile.y + i);
                canSpawnDown = false;
            }
            else {
                explosionArray.push(map.putTileAt(214, tile.x, (tile.y + i), explosionLayer));
            }
        }
        else {
            canSpawnDown = false;
        }
    }
    if (explosionArray.length != 0) {
        time.delayedCall(2000, removeTile, [explosionArray], this);
    }
}

function updateCounter(bomb) {
    createBlast(bomb);
    bomb.destroy();

}

function removeTile(tileArray) {
    var i = 0;
    for (i; i < tileArray.length; i++) {
        var tile = tileArray[i];
        if (tile != null) {
            map.putTileAt(0, tile.x, tile.y, explosionLayer);
        }
    }
}

function checkTileSpawn(x, y) {
    var canSpawn = false;

    if ((x < 14 && x >= 0) && (y < 14) && y >= 0) {
        var tileCheck = map.hasTileAt(x, y, walls);
        if (!tileCheck) {
            canSpawn = true;
        }
    }
    return canSpawn;
}

function checkForVase(x, y) {

    var hasVase = false;
    var tileCheck = map.hasTileAt(x, y, vaseLayer);

    if (tileCheck) {
        hasVase = true;
    }

    return hasVase;
}
function collectItem(player, item) {


    item.destroy();
    //alert(index);


    //  Add and update the score

}


function spawnItem(x, y) {
    var chance = Math.floor(Math.random() * 10) + 1;
    if (chance < 9) {
        var vector2 = vaseLayer.tileToWorldXY(x, y);
        stars.create(vector2.x, vector2.y, 'star');
    }
}