var PTM_RATIO = 32.0;

cc.MySprite = cc.Sprite.extend({
    _typeObject:0,
    /**
     * Constructor
     */
    ctor:function () {
            this._super();
            this._typeObject = 1;
    },

    /**
     * HACK: optimization
     */
    SET_DIRTY_RECURSIVELY:function () {
        if (this._batchNode && !this._recursiveDirty) {
            this._recursiveDirty = true;
            //this.setDirty(true);
            this._dirty = true;
            if (this._hasChildren)
                this.setDirtyRecursively(true);
        }
    },

    /**
     * position setter (override cc.Node )
     * @param {cc.Point} pos
     * @override
     */
    setPosition:function (pos) {
        cc.Node.prototype.setPosition.call(this, pos);
        this.SET_DIRTY_RECURSIVELY();
    },

    /**
     * Rotation setter (override cc.Node )
     * @param {Number} rotation
     * @override
     */
    setRotation:function (rotation) {
        cc.Node.prototype.setRotation.call(this, rotation);
        this.SET_DIRTY_RECURSIVELY();
    },

        /**
     * <p>The scale factor of the node. 1.0 is the default scale factor. <br/>
     * It modifies the X and Y scale at the same time. (override cc.Node ) <p/>
     * @param {Number} scale
     * @override
     */
    setScale:function (scale, scaleY) {
        cc.Node.prototype.setScale.call(this, scale, scaleY);
        this.SET_DIRTY_RECURSIVELY();
    },

    /**
     * VertexZ setter (override cc.Node )
     * @param {Number} vertexZ
     * @override
     */
    setVertexZ:function (vertexZ) {
        cc.Node.prototype.setVertexZ.call(this, vertexZ);
        this.SET_DIRTY_RECURSIVELY();
    },

    /**
     * AnchorPoint setter  (override cc.Node )
     * @param {cc.Point} anchor
     * @override
     */
    setAnchorPoint:function (anchor) {
        cc.Node.prototype.setAnchorPoint.call(this, anchor);
        this.SET_DIRTY_RECURSIVELY();
    },

    /**
     * visible setter  (override cc.Node )
     * @param {Boolean} visible
     * @override
     */
    setVisible:function (visible) {
        cc.Node.prototype.setVisible.call(this, visible);
        this.SET_DIRTY_RECURSIVELY();
    },

    setFlipX:function (flipX) {
        cc.Sprite.prototype.setFlipX.call(this, flipX);
        this.SET_DIRTY_RECURSIVELY();
    }

});

/**
 * Creates a sprite with a sprite frame.
 * @param {cc.SpriteFrame|String} spriteFrame or spriteFrame name
 * @return {cc.Sprite}
 * @example
 * //get a sprite frame
 * var spriteFrame = cc.SpriteFrameCache.getInstance().spriteFrameByName("grossini_dance_01.png");
 *
 * //create a sprite with a sprite frame
 * var sprite = cc.Sprite.createWithSpriteFrameName(spriteFrame);
 *
 * //create a sprite with a sprite frame
 * var sprite = cc.Sprite.createWithSpriteFrameName('rossini_dance_01.png');
 */
cc.MySprite.createWithSpriteFrameName = function (spriteFrame) {
    if (typeof(spriteFrame) == 'string') {
        var pFrame = cc.SpriteFrameCache.getInstance().getSpriteFrame(spriteFrame);
        if (pFrame) {
            spriteFrame = pFrame;
        } else {
            cc.log("Invalid spriteFrameName: " + spriteFrame);
            return null;
        }
    }
    var sprite = new cc.MySprite();
    if (sprite && sprite.initWithSpriteFrame(spriteFrame)) {
        return sprite;
    }
    return null;
};


var GameField = cc.Layer.extend(
{
    world: null,
    groundBody:null,
    
    ctor:function () {
        //cc.associateWithNative( this, cc.Layer );
    },
    
    init:function () 
    {
        var bRet = false;
        if (this._super) 
        {
            var screenSize = cc.Director.getInstance().getWinSize();

            //Box2d initialization
            var b2Vec2 = Box2D.Common.Math.b2Vec2
            , b2BodyDef = Box2D.Dynamics.b2BodyDef
            , b2Body = Box2D.Dynamics.b2Body
            , b2FixtureDef = Box2D.Dynamics.b2FixtureDef
            , b2World = Box2D.Dynamics.b2World
            , b2DebugDraw = Box2D.Dynamics.b2DebugDraw
            , b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
            , b2ContactListener = Box2D.Dynamics.b2ContactListener;            

            var back = cc.Sprite.create(s_background);
            back.setAnchorPoint(cc.PointZero());
            back.setPosition(cc.PointZero());
            this.addChild(back, -10);

            // Construct a world object, which will hold and simulate the rigid bodies.
            this.world = new b2World(new b2Vec2(0, 10), true);
            this.world.SetContinuousPhysics(true);
            
             //setup debug draw
            var debugDraw = new b2DebugDraw();
            debugDraw.SetSprite(document.getElementById("gameCanvas").getContext("2d"));
            debugDraw.SetDrawScale(PTM_RATIO);
            debugDraw.SetFillAlpha(0.3);
            debugDraw.SetLineThickness(1.0);
            debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
            this.world.SetDebugDraw(debugDraw);

            //setup contact listener
            var listener = new b2ContactListener;
            listener. BeginContact = function(contact) 
            {
                // var obj1 = contact.GetFixtureA().GetBody().GetUserData();                
                // var obj2 = contact.GetFixtureB().GetBody().GetUserData();

                // if((obj1 instanceof cc.MySprite) && (obj1._typeObject == 1)) 
                // {
                //     var fix = contact.GetFixtureA();
                //     if(fix.m_id == 1)
                //     {
                //     }
                // }
                // else if((obj2 instanceof cc.MySprite) && (obj2._typeObject == 1)) 
                // {
                //     var fix = contact.GetFixtureB();
                //     if(fix.m_id == 1)
                //     {
                //     }
                // }
            }
            listener. EndContact = function(contact) 
            {
            }
            this.world.SetContactListener(listener);

            // Define the ground body.
            var fixDef = new b2FixtureDef;
            fixDef.density = 1.0;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.2;

            var groundBodyDef = new b2BodyDef;
            groundBodyDef.position.Set(0, 0); // bottom-left corner
            this.groundBody = this.world.CreateBody(groundBodyDef);

            var bodyDef = new b2BodyDef;

            //create ground
            bodyDef.type = b2Body.b2_staticBody;
            fixDef.shape = new b2PolygonShape;
            fixDef.shape.SetAsBox(screenSize.width / 2 / PTM_RATIO, 2 / PTM_RATIO);
            // upper
            bodyDef.position.Set(screenSize.width / 2 / PTM_RATIO, -screenSize.height / PTM_RATIO);
            this.world.CreateBody(bodyDef).CreateFixture(fixDef);
            // bottom
            bodyDef.position.Set(screenSize.width / 2 / PTM_RATIO, 1 / PTM_RATIO);
            this.world.CreateBody(bodyDef).CreateFixture(fixDef);

            fixDef.shape.SetAsBox(2 / PTM_RATIO, screenSize.height / 2 / PTM_RATIO);
            // left
            bodyDef.position.Set(0, -screenSize.height / 2 / PTM_RATIO);
            this.world.CreateBody(bodyDef).CreateFixture(fixDef);
            // right
            bodyDef.position.Set(screenSize.width / PTM_RATIO, -screenSize.height / 2 / PTM_RATIO);
            this.world.CreateBody(bodyDef).CreateFixture(fixDef);

            // Load atlas with sprites
            cc.SpriteFrameCache.getInstance().addSpriteFrames(s_objects_plist, s_objects);

            // Load Box2d shapes
            cc.GB2ShapeCache.getInstance().addShapesWithFile(s_object_bodies_plist);

            // accept touch now!
            this.setTouchEnabled(true);

            // schedule
            this.schedule(this.update);
            
            //accept keypad
            this.setKeyboardEnabled(true);

            bRet = true;
        }
        return bRet;
    },
    
    onEnter:function() {
        this._super();
    },

    onTouchesBegan:function (touches, event) 
    {
        var touch = touches[0];
        var location = touch.getLocation();
        this.createBodyAndSprite(location);
    },

    onTouchesMoved:function (touches, event) 
    {
    },

    onTouchesEnded:function () 
    {
    },

    onKeyDown:function (e) 
    {
        if(e == cc.KEY.r)
        {
            this.restartGame();           
        }
    },
    
    onKeyUp:function (e) 
    {
    },

    draw:function() {
       this.world.DrawDebugData();
    },

    update:function (dt) {
        //It is recommended that a fixed time step is used with Box2D for stability
        //of the simulation, however, we are using a variable time step here.
        //You need to make an informed choice, the following URL is useful
        //http://gafferongames.com/game-physics/fix-your-timestep/
        var velocityIterations = 8;
        var positionIterations = 1;

        // Instruct the world to perform a single step of simulation. It is
        // generally best to keep the time step and iterations fixed.
        this.world.Step(dt, velocityIterations, positionIterations);

        //Iterate over the bodies in the physics world
        for (var b = this.world.GetBodyList(); b; b = b.GetNext()) {
            if (b.GetUserData() != null) {
                //Synchronize the AtlasSprites position and rotation with the corresponding body
                var myActor = b.GetUserData();
                myActor.setPosition(cc.PointMake(b.GetPosition().x * PTM_RATIO, -b.GetPosition().y * PTM_RATIO));
                myActor.setRotation(cc.RADIANS_TO_DEGREES(b.GetAngle()));
            }
        }
    },

    createBodyAndSprite:function (position) {
        //cross_100х100.png
        //gear_big.png
        var spriteName = "gear_big.png";
        var angle = 0;
        var sprite = cc.MySprite.createWithSpriteFrameName(spriteName);
        sprite._typeObject = 2;
        this.addChild(sprite, 10);

        var b2BodyDef = Box2D.Dynamics.b2BodyDef
            , b2Body = Box2D.Dynamics.b2Body
            , b2FixtureDef = Box2D.Dynamics.b2FixtureDef
            , b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;

        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.Set(position.x / PTM_RATIO * 2, -position.y / PTM_RATIO * 2);
        bodyDef.fixedRotation = false;
        bodyDef.angle = cc.DEGREES_TO_RADIANS(-angle);
        bodyDef.userData = sprite;
        var body = this.world.CreateBody(bodyDef);
        body.SetSleepingAllowed(false);

        var shapeName = spriteName.replace(/.png/g,"");

        // Add fixture and anchor pointfrom GB2ShapeCashe
        cc.GB2ShapeCache.getInstance().addFixturesToBody(body, shapeName);
        sprite.setAnchorPoint(cc.GB2ShapeCache.getInstance().anchorPointForShape(shapeName));

        var myjoint = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
        myjoint.bodyA = this.groundBody;
        myjoint.bodyB = body;
        myjoint.localAnchorA.Set(position.x / PTM_RATIO, -position.y / PTM_RATIO);
        myjoint.enableMotor = true;
        myjoint.maxMotorTorque = 5500;
        myjoint.motorSpeed = -1;
        myjoint.collideConnected = false;
        this.world.CreateJoint(myjoint);
    },

    restartGame:function (pSender) 
    {
        var scene = cc.Scene.create();
        scene.addChild(GameField.create());
        cc.Director.getInstance().replaceScene(cc.TransitionFade.create(1.2, scene));
    },
});

GameField.create = function () 
{
    var sg = new GameField();
    if (sg && sg.init()) 
    {
        return sg;
    }
    return null;
};

GameField.scene = function () 
{
    var scene = cc.Scene.create();
    var layer = GameField.create();
    layer.setAnchorPoint(cc.PointZero());
    scene.addChild(layer);
    return scene;
};