var game = new Phaser.Game(800, 600, Phaser.AUTO, 'viewport', {
    preload: preload,
    create: create,
    update: update
});

var paddle;
var ball;
var ballOnPaddle = true;

var scoreText;
var livesText;
var introText;

var lives = 3;
var score = 0;

var bricks;
var s;
var music;
var paddleHit;
var brickBreak;

function preload() {
    game.load.atlas('breakout', 'assets/breakout.png', 'assets/breakout.json');
    game.load.image('starfield', 'assets/starfield.jpg');
    game.load.audio('music', ['assets/Eric_Skiff-07-We_are_the_Resistors.mp3']);
    game.load.audio('paddleHit', ['assets/paddle_hit.mp3']);
    game.load.audio('brickBreak', ['assets/glass_break.mp3']);
}

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.checkCollision.down = false;

    s = game.add.tileSprite(0, 0, 800, 600, 'starfield');

    bricks = game.add.group();
    // If true all Sprites created by, or added to this group, will have a physics body enabled on them.
    // If there are children already in the Group at the time you set this property, they are not changed.
    // The default body type is controlled with physicsBodyType.
    bricks.enableBody = true;
    bricks.physicsBodyType = Phaser.Physics.ARCADE;

    var brick;
    for (var y = 0; y < 4; y++) {
        for (var x = 0; x < 15; x++) {
            // Creates a new Phaser.Sprite object and adds it to the top of this group.
            brick = bricks.create(120 + (x * 36), 100 + (y * 52), 'breakout', 'brick_' + (y + 1) + '_1.png');
            // The elasticity of the Body when colliding. bounce.x/y = 1 means full rebound, bounce.x/y = 0.5 means 50% rebound velocity.
            brick.body.bounce.set(1);
            // An immovable Body will not receive any impacts from other bodies. Two immovable Bodies can't separate or exchange momentum and will pass through each other.
            brick.body.immovable = true;
        }
    }

    paddle = game.add.sprite(game.world.centerX, 500, 'breakout', 'paddle_big.png');
    // The anchor sets the origin point of the texture. The default (0, 0) is the top left. (0.5, 0.5) is the center. (1, 1) is the bottom right.
    paddle.anchor.setTo(0.5, 0.5);
    // This will create a default physics body on the given game object or array of objects.
    game.physics.enable(paddle, Phaser.Physics.ARCADE);

    // A Body can be set to collide against the World bounds automatically and rebound back into the World if this is set to true. Otherwise it will leave the World.
    paddle.body.collideWorldBounds = true;
    paddle.body.bounce.set(1);
    paddle.body.immovable = true;

    ball = game.add.sprite(game.world.centerX, paddle.y - 16, 'breakout', 'ball_1.png');
    ball.anchor.set(0.5);
    ball.checkWorldBounds = true;

    game.physics.enable(ball, Phaser.Physics.ARCADE);

    ball.body.collideWorldBounds = true;
    ball.body.bounce.set(1);

    // add(name [, frames] [, frameRate] [, loop] [, useNumericIndex])
    ball.animations.add('spin', [ 'ball_1.png', 'ball_2.png', 'ball_3.png', 'ball_4.png', 'ball_5.png' ], 50, true, false);

    ball.events.onOutOfBounds.add(ballLost, this);

    scoreText = game.add.text(32, 550, 'score: 0', { font: "20px Arial", fill: "#ffffff", align: "left" });
    livesText = game.add.text(680, 550, 'lives: 3', { font: "20px Arial", fill: "#ffffff", align: "left" });
    introText = game.add.text(game.world.centerX, 400, '- click to start -', { font: "40px Arial", fill: "#ffffff", align: "center" });
    introText.anchor.setTo(0.5, 0.5);

    game.input.onDown.add(releaseBall, this);

    game.input.keyboard.addKeyCapture([Phaser.Keyboard.P]);
    //game.input.keyboard.

    music = game.add.audio('music', 0.5, true);
    music.play();

    paddleHit = game.add.audio('paddleHit');

    brickBreak = game.add.audio('brickBreak');
}

function update() {
    //  Fun, but a little sea-sick inducing :) Uncomment if you like!
    // s.tilePosition.x += (game.input.speed.x / 2);
    paddle.x = game.input.x;

    if (paddle.x < 24)
    {
        paddle.x = 24;
    }
    else if (paddle.x > game.width - 24)
    {
        paddle.x = game.width - 24;
    }

    if (ballOnPaddle)
    {
        ball.body.x = paddle.x;
    }
    else
    {
        game.physics.arcade.collide(ball, paddle, ballHitPaddle, null, this);
        game.physics.arcade.collide(ball, bricks, ballHitBrick, null, this);
    }

}

function releaseBall () {
    if (ballOnPaddle)
    {
        ballOnPaddle = false;
        ball.body.velocity.y = -300;
        ball.body.velocity.x = -75;
        ball.animations.play('spin');
        introText.visible = false;
    }

}

function ballLost () {
    lives--;
    livesText.text = 'lives: ' + lives;
    if (lives === 0)
    {
        gameOver();
    }
    else
    {
        ballOnPaddle = true;
        // Resets the Game Object.
        // This moves the Game Object to the given x/y world coordinates and sets fresh, exists, visible and renderable to true.
        // If this Game Object has the LifeSpan component it will also set alive to true and health to the given value.
        // If this Game Object has a Physics Body it will reset the Body.
        ball.reset(paddle.body.x + 16, paddle.y - 16);
        ball.animations.stop();
    }

}

function gameOver () {
    ball.body.velocity.setTo(0, 0);
    introText.text = 'Game Over!';
    introText.visible = true;
}

function ballHitBrick (_ball, _brick) {
    // Kills a Game Object. A killed Game Object has its alive, exists and visible properties all set to false.
    brickBreak.play();

    _brick.kill();

    score += 10;

    scoreText.text = 'score: ' + score;

    //  Are they any bricks left?
    // Get the number of living children in this group.
    if (bricks.countLiving() == 0)
    {
        //  New level starts
        score += 1000;
        scoreText.text = 'score: ' + score;
        introText.text = '- Next Level -';

        //  Let's move the ball back to the paddle
        ballOnPaddle = true;
        ball.body.velocity.set(0);
        ball.x = paddle.x + 16;
        ball.y = paddle.y - 16;
        ball.animations.stop();

        //  And bring the bricks back from the dead :)
        // Calls a function, specified by name, on all on children.
        // revive: Brings a 'dead' Game Object back to life, optionally resetting its health value in the process.
        bricks.callAll('revive');
    }

}

function ballHitPaddle (_ball, _paddle) {
    var diff = 0;

    paddleHit.play();

    if (_ball.x < _paddle.x)
    {
        //  Ball is on the left-hand side of the paddle
        diff = _paddle.x - _ball.x;
        _ball.body.velocity.x = (-10 * diff);
    }
    else if (_ball.x > _paddle.x)
    {
        //  Ball is on the right-hand side of the paddle
        diff = _ball.x -_paddle.x;
        _ball.body.velocity.x = (10 * diff);
    }
    else
    {
        //  Ball is perfectly in the middle
        //  Add a little random X to stop it bouncing straight up!
        _ball.body.velocity.x = 2 + Math.random() * 8;
    }
}