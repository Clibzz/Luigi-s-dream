var config = {
    width: 800,
    height: 600,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { 
                y: 250 
            },
            debug: false,
        },
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
}

var luigi;
var goomba;
var floors;
var inputs;
var coins;
var score;
var currentScore;
var gameOver;

var game = new Phaser.Game(config);

function preload() {
    this.load.image("background", "./src/images/background.png");
    this.load.image("ground", "./src/images/ground.png");
    this.load.image("bricks", "./src/images/bricks.png");
    this.load.image("coin", "./src/images/coin.png");
    this.load.image("enemy", "./src/images/enemy.png");
    this.load.image("block", "./src/images/block.png");
    this.load.image("pillar", "./src/images/pillar.png");
    this.load.image("smallPlatform", "./src/images/smallPlatform.png");
    this.load.image("teleporter", "./src/images/teleporter.png");
    this.load.image("fire", "./src/images/fire.png");
    this.load.image("bouncer", "./src/images/bouncer.png");
    this.load.image("button", "./src/images/button.png");
    this.load.spritesheet("goomba", "./src/images/goomba.png", {
        frameWidth: 32,
        frameHeight: 48
    });
    this.load.spritesheet("luigi", "./src/images/character.png", {
        frameWidth: 32,
        frameHeight: 48
    });
}

function create() {
    this.add.image(400, 300, "background");

    bouncers = this.physics.add.staticGroup();
    bouncers.create(390, 270, "bouncer");

    teleporters = this.physics.add.staticGroup();
    teleporters.create(770, 475, "teleporter");

    utilities = this.physics.add.staticGroup();
    utilities.create(465, 390, "fire");
    utilities.create(600, 165, "fire");
    utilities.create(225, 35, "fire");
    utilities.create(600, 20, "fire");
    utilities.create(480, 115, "fire");

    luigi = this.physics.add.sprite(50, 450, "luigi");
    luigi.setCollideWorldBounds(true);

    floors = this.physics.add.staticGroup();
    floors.create(400, 555, "ground").setScale(1.5).refreshBody();
    floors.create(600, 425, "bricks");
    floors.create(185, 325, "block");
    floors.create(300, 250, "block");
    floors.create(585, 290, "block");
    floors.create(500, 200, "block");
    floors.create(425, 275, "block");
    floors.create(395, 300, "block");
    floors.create(150, 120, "pillar");
    floors.create(625, 70, "pillar");
    floors.create(450, 70, "pillar");
    floors.create(625, 120, "pillar");
    floors.create(97, 200, "smallPlatform");
    floors.create(800, 100, "smallPlatform");
    floors.create(300, 70, "smallPlatform");

    blocked = this.physics.add.staticGroup();
    blocked.create(720, 457, "block");
    blocked.create(720, 490, "block");
    
    coins = this.physics.add.group({
        key: "coin",
        repeat: 10,
        setXY: {
            x: 25,
            y: 0,
            stepX: 80
        }
    });

    coins.children.iterate(function(child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.1, 0.2));
    });

    score = 0;
    currentScore = this.add.text(10, 10, "Current score: " + score, { 
        fontSize: 25,
        fontWeight: "bold",
        fill: "#FF0000" 
    });

    var movingPlatform = this.physics.add.image(700, 375, 'block').setImmovable(true).setVelocity(100, -100);
    movingPlatform.body.setAllowGravity(false);

    this.tweens.timeline({
        targets: movingPlatform.body.velocity,
        loop: -1,
        tweens: [
          { x:    0, y: -100, duration: 2000, ease: 'Stepped' },
          { x:    0, y: 100, duration: 2000, ease: 'Stepped' }
        ]
      });

    this.anims.create({
        key: "left",
        frames: this.anims.generateFrameNames("luigi", {
            start: 0, 
            end: 3
        }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: "right",
        frames: this.anims.generateFrameNames("luigi", {
            start: 5, 
            end: 8
        }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: "stand",
        frames: this.anims.generateFrameNames("luigi", {
            start: 4, 
            end: 4
        }),
        frameRate: 10,
        repeat: -1
    });

    inputs = this.input.keyboard.createCursorKeys();

    /**
     * Colliders for when two objects touch
     */
    this.physics.add.collider(luigi, floors);
    this.physics.add.collider(coins, floors);
    wallCollider = this.physics.add.collider(luigi, blocked);
    this.physics.add.collider(luigi, movingPlatform);
    this.physics.add.collider(coins, movingPlatform);

    /**
     * Overlaps between two objects with functions
     */
    this.physics.add.overlap(luigi, coins, collectCoins, null, this);
    this.physics.add.overlap(luigi, teleporters, teleportPlayer, null, this);
    this.physics.add.overlap(luigi, utilities, burnPlayer, null, this);
    this.physics.add.overlap(luigi, bouncers, bouncePlayer, null, this);
}

function update() {
    if (inputs.left.isDown) {
        luigi.setVelocityX(-150);
        luigi.anims.play("left", true);
    } else if (inputs.right.isDown) {
        luigi.setVelocityX(150);
        luigi.anims.play("right", true);
    } else {
        luigi.setVelocityX(0);
        luigi.anims.play("stand", true);
    }

    if (inputs.up.isDown && luigi.body.touching.down) {
        luigi.setVelocityY(-250);
    }
}

/**
 * Function for collecting coins
 * @param {*} luigi 
 * @param {*} coin 
 */
function collectCoins(luigi, coin) {
    coin.disableBody(true, true);
    score += 1;
    currentScore.setText("Current score: " + score);

    if (score == 1) {
        destroyBlockage();
    }

    if (score == 10) {
        this.physics.pause();
        winner = this.add.text(160, 100, "You win!", { 
        align: "center",
        fontSize: 100,
        fill: "#4CBB17" 
        });
        achievedScore = this.add.text(75, 185, "You scored " + score + " points!", {
            align: "center",
            fontSize: 50,
            fill: "#000000" 
        });
    }
}

/**
 * Function for teleporting the player
 * @param {*} luigi
 */
function teleportPlayer(luigi) {
    luigi.setPosition(50, 155);
    console.log("overlapping");
}

/**
 * Function for destroying the blockage at the teleporter
 */
function destroyBlockage() {
    blocked.setVisible(false);
    wallCollider.active = false;
}

/**
 * Function for burning the player when touching fire
 * @param {*} luigi 
 */
function burnPlayer(luigi) {
    this.physics.pause();
    luigi.setTint(0xff0000);
    gg = this.add.text(160, 100, "Game Over", { 
        align: "center",
        fontSize: 100,
        fill: "#FF0000" 
    });
    achievedScore = this.add.text(165, 185, "Score: " + score, {
        align: "center",
        fontSize: 50,
        fill: "#000000" 
    });
    currentScore.destroy();
    gameOver = true;
}

/**
 * Function for making the player jump higher when touching a bouncer
 * @param {*} luigi 
 */
function bouncePlayer(luigi) {
    luigi.setVelocityY(-500);
}
