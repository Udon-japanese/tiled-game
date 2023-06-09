const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 900,
  height: 600,
  scene: {
    preload,
    create,
    update,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 500 },
      debug: true,
    },
  },
};

const game = new Phaser.Game(config);

function preload() {
  this.load.image("background", "assets/images/background.png");
  this.load.image("spike", "assets/images/spike.png");
  // At last image must be loaded with its JSON
  this.load.atlas(
    "player",
    "assets/images/kenney_player.png",
    "assets/images/kenney_player_atlas.json"
  );
  this.load.image("tiles", "assets/tilesets/map_tileset.png");
  // Load the export Tiled JSON
  this.load.tilemapTiledJSON("map", "assets/tilemaps/map.json");
}

function create() {
  const backgroundImage = this.add.image(0, 0, "background").setOrigin(0, 0);
  const map = this.make.tilemap({ key: "map" });
  const tileset = map.addTilesetImage("map", "tiles");
  const platforms = map.createLayer("map", tileset, 0, 0);

  platforms.setCollisionByExclusion(-1, true);

  this.player = this.physics.add.sprite(820, 6, "player");
  this.player.setBounce(0.1);
  this.player.setScale(0.3);
  this.player.setCollideWorldBounds(true);
  this.physics.add.collider(this.player, platforms);
  this.player.body
    .setSize(this.player.width - 10, this.player.height - 17)
    .setOffset(5, 17);

  this.anims.create({
    key: "walk",
    frames: this.anims.generateFrameNames("player", {
      prefix: "robo_player_",
      start: 2,
      end: 3,
    }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "idle",
    frames: [{ key: "player", frame: "robo_player_0" }],
    frameRate: 10,
  });

  this.anims.create({
    key: "jump",
    frames: [{ key: "player", frame: "robo_player_1" }],
    frameRate: 10,
  });

  this.cursors = this.input.keyboard.createCursorKeys();
  // Create a sprite group for all spikes, set common properties to ensure that
  // sprites in the group don't move via gravity or by player collisions
  this.spikes = this.physics.add.group({
    allowGravity: false,
    immovable: true,
  });

  // Let's get the spike objects, these are NOT sprites
  // We'll create spikes in our sprite group for each object in our map
  map.getObjectLayer("spikes").objects.forEach((spike) => {
    // Add new spikes to our sprite group
    const spikeSprite = this.spikes
      .create(spike.x, spike.y - spike.height, "spike")
      .setOrigin(0);
    spikeSprite.body
      .setSize(spike.width, spike.height)
  });

  this.physics.add.collider(this.player, this.spikes, playerHit, null, this);
}

function update() {
  // Control the player with left or right keys
  if (this.cursors.left.isDown) {
    this.player.setVelocityX(-200);
    if (this.player.body.onFloor()) {
      this.player.play("walk", true);
    }
  } else if (this.cursors.right.isDown) {
    this.player.setVelocityX(200);
    if (this.player.body.onFloor()) {
      this.player.play("walk", true);
    }
  } else {
    // If no keys are pressed, the player keeps still
    this.player.setVelocityX(0);
    // Only show the idle animation if the player is footed
    // If this is not included, the player would look idle while jumping
    if (this.player.body.onFloor()) {
      this.player.play("idle", true);
    }
  }

  // Player can jump while walking any direction by pressing the space bar
  // or the 'UP' arrow
  if (
    (this.cursors.space.isDown || this.cursors.up.isDown) &&
    this.player.body.onFloor()
  ) {
    this.player.setVelocityY(-350);
    this.player.play("jump", true);
  }

  // x座標向きの速度によって、画像を反転させている
  if (this.player.body.velocity.x > 0) {
    this.player.setFlipX(false);
  } else if (this.player.body.velocity.x < 0) {
    // otherwise, make them face the other side
    this.player.setFlipX(true);
  }
}

function playerHit(player, spike) {
  player.setVelocity(0, 0);
  player.setX(820);
  player.setY(6);
  player.play("idle", true);
  player.setAlpha(0);
  let tw = this.tweens.add({
    targets: player,
    alpha: 1,
    duration: 100,
    ease: "Linear",
    repeat: 5,
  });
}
