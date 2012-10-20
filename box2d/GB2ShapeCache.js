/****************************************************************************
 Copyright (c) 2012 Dmitry Valov
 http://lemontree-studio.com/

 Loads physics sprites created with http://www.PhysicsEditor.de

 Generic Shape Cache for box2d

 Copyright by Andreas Loew 
      http://www.PhysicsEditor.de
      http://texturepacker.com
      http://www.code-and-web.de
  
 All rights reserved.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

BodyDef = cc.Class.extend({
    _anchorPoint:cc.PointZero(),
    _fixtures:null,

    /**
     * Constructor
     */
    ctor:function () {
        this._fixtures = [];
    },

});

/**
 * Singleton that handles the loading of the shapes. It saves in a cache the shapes.
 * @class
 * @extends cc.Class
 * @example
 * //add Shapes to GB2ShapeCache With File
 * cc.GB2ShapeCache.getInstance().addShapesWithFile(s_shapesPlist);
 */

cc.GB2ShapeCache = cc.Class.extend({
    _bodies:null,
    _loadedFileNames:null,
    _ptm_ratio:32.0,
    /**
     * Constructor
     */
    ctor:function () {
        this._bodies = {};
        this._loadedFileNames = [];
    },

    /**
     * Adds multiple Shapes with a dictionary. 
     * @param {object} dictionary
     */
    _addShapesWithDictionary:function (dictionary) {
        var b2Vec2 = Box2D.Common.Math.b2Vec2
        , b2BodyDef = Box2D.Dynamics.b2BodyDef
        , b2Body = Box2D.Dynamics.b2Body
        , b2FixtureDef = Box2D.Dynamics.b2FixtureDef
        , b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
        , b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;

        var metadataDict = dictionary["metadata"];
        var bodiesDict = dictionary["bodies"];        
        
        var format = parseInt(this._valueForKey("format", metadataDict));
        this._ptm_ratio = parseInt(this._valueForKey("ptm_ratio", metadataDict));

        // check the format
        cc.Assert(format == 1, "format is not supported for cc.GB2ShapeCache _addShapesWithDictionary");
        
        for (var key in bodiesDict) {
            var bodyDict = bodiesDict[key];
            if (bodyDict) {
                var body = this._bodies[key];
                if (body) {
                    continue;
                }
                var bodyDef = new BodyDef();
                bodyDef._anchorPoint = this._pointFromString(bodyDict["anchorpoint"]);
                var fixturesList = bodyDict["fixtures"];
                for(var key2 in fixturesList) {
                    var fixture = fixturesList[key2];
                    var basicData = new b2FixtureDef();
                    basicData.filter.categoryBits = parseInt(fixture["filter_categoryBits"]);
                    basicData.filter.maskBits =  parseInt(fixture["filter_maskBits"]);
                    basicData.filter.groupIndex = parseInt(fixture["filter_groupIndex"]);
                    basicData.friction = parseFloat(fixture["friction"]);
                    basicData.density = parseFloat(fixture["density"]);
                    basicData.restitution = parseFloat(fixture["restitution"]);
                    basicData.isSensor = fixture["isSensor"];
                    basicData.id = parseInt(fixture["id"]);
                    var callbackData = parseInt(fixture["userdataCbValue"]);

                    var fixtureType = fixture["fixture_type"];

                    if(fixtureType == "POLYGON") {
                        var polygonsList = fixture["polygons"];
                        for(var key3 in polygonsList) {
                            var fixtureDef = new b2FixtureDef();
                            fixtureDef.filter.categoryBits = basicData.filter.categoryBits;
                            fixtureDef.filter.maskBits = basicData.filter.maskBits;
                            fixtureDef.filter.groupIndex = basicData.filter.groupIndex;
                            fixtureDef.friction = basicData.friction;
                            fixtureDef.density = basicData.density;
                            fixtureDef.restitution = basicData.restitution;
                            fixtureDef.isSensor = basicData.isSensor;
                            fixtureDef.id = basicData.id;
                            var polygonList = polygonsList[key3];
                            var vertices = [];
                            var i = 1;
                            for(var key4 in polygonList) {
                                var coords = this._pointFromString(polygonList[key4]);
                                vertices[polygonList.length - i] =  new b2Vec2(coords.x / this._ptm_ratio, -coords.y / this._ptm_ratio);
                                ++i;
                            }
                            var polyshape = new b2PolygonShape();
                            polyshape.SetAsArray(vertices);
                            fixtureDef.shape = polyshape;
                            fixtureDef.callbackData = callbackData;
                            bodyDef._fixtures[bodyDef._fixtures.length] = fixtureDef;
                        }
                    }
                    else if(fixtureType == "CIRCLE") {
                        var fixtureDef = new b2FixtureDef();
                        fixtureDef = basicData;
                        var circleData = fixture["circle"];
                        var circleShape = new b2CircleShape();
                        var coords = this._pointFromString(circleData["position"]);
                        circleShape.m_radius = parseFloat(circleData["radius"]) / this._ptm_ratio;
                        circleShape.m_p  = new b2Vec2(coords.x / this._ptm_ratio, -coords.y / this._ptm_ratio);
                        fixtureDef.shape = circleShape;
                        fixtureDef.callbackData = callbackData;
                        bodyDef._fixtures[bodyDef._fixtures.length] = fixtureDef;
                    }
                    else {
                        cc.Assert(0, "unknown shape type for cc.GB2ShapeCache _addShapesWithDictionary");
                    }
                }
                // add body in list
                this._bodies[key] = bodyDef;
            }
        }
    },

    _valueForKey:function (key, dict) {
        if (dict) {
            if (dict.hasOwnProperty(key)) {
                return dict[key].toString();
            }
        }
        return "";
    },

    _pointFromString:function (string) {
        var xCoord = 0;
        var yCoord = 0;
        var theString = string;
        if(theString == null) {
            return cc.PointZero();
        }
        theString = theString.replace(/{ /g,"")
        theString = theString.replace(/ }/g,"")
        var array = theString.split(",");
        if(array.length >= 2) {
            xCoord = parseFloat(array[0]);
            yCoord = parseFloat(array[1]);
        }
        return cc.p(xCoord, yCoord);
    },

    /**
     * Adds shapes to the shape cache from file created by Physics Editor. 
     * @param {String} plist - name of the plist file to load
     * @example
     * // add Shapes to GB2ShapeCache With File
     * cc.GB2ShapeCache.getInstance().addShapesWithFile(s_shapesPlist);
     */
    addShapesWithFile:function (plist) {
        var dict = cc.FileUtils.getInstance().dictionaryWithContentsOfFileThreadSafe(plist);

        cc.Assert(plist, "plist filename should not be NULL");
        if (!cc.ArrayContainsObject(this._loadedFileNames, plist)) {
            this._addShapesWithDictionary(dict);   
        }
    },

    /**
     * Adds fixture data to a body
     * @param {b2Body} body - body to add the fixture to
     * @param {String} bodyName - name of the shape
     * @example
     * // add fixtures to Box2D body by name
     * cc.GB2ShapeCache.getInstance().addFixturesToBody(body, bodyName);
     */
    addFixturesToBody:function (body, bodyName) {
        var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;

        var bodyDef = this._bodies[bodyName];
        for(var key in bodyDef._fixtures) {
            var fixtureDef = bodyDef._fixtures[key];
            body.CreateFixture(fixtureDef);
        }
    },

    /**
    * Returns the anchor point of the given sprite
    * @param shape name of the shape to get the anchorpoint for
    * @return anchorpoint
    */
    anchorPointForShape:function (bodyName) {
        var body = this._bodies[bodyName];
        return body._anchorPoint;
    },

    /**
    * Returns the ptm ratio
    */
    getPtmRatio:function () {
        return this._ptm_ratio;
    }
});

cc.s_sharedGB2ShapeCache = null;

/**
 * Returns the shared instance of the Shape cache
 * @return {cc.GB2ShapeCache}
 */
cc.GB2ShapeCache.getInstance = function () {
    if (!cc.s_sharedGB2ShapeCache) {
        cc.s_sharedGB2ShapeCache = new cc.GB2ShapeCache();
    }
    return cc.s_sharedGB2ShapeCache;
};

/**
 * Purges the cache. It releases all the Shapes and the retained instance.
 */
cc.GB2ShapeCache.purgeSharedShapeCache = function () {
    cc.s_sharedGB2ShapeCache = null;
};
