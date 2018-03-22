    /*To use any of Mapbox’s tools, APIs, or SDKs, you need a Mapbox access token.*/
    L.mapbox.accessToken = 'pk.eyJ1Ijoic2Nob2xhcnNsYWIiLCJhIjoiY2oxdzlqNDh1MDAwMTMzcW96MGxtajZxNSJ9.8I1zZymMKofR_FbOiazznw';

    /* L.map function creates a map on a page and manipulates it. "l." is a prefix for Leaflet methods.
    Mapbox created Leaflet. L.mapbox.map extends L.map to mapbox API.
    Requires an argument (aka parameter) that is an id of an element.
    In this case, it is "map" which is the id of the div element above.
    Can also take other arguments/options.
    See: https://www.mapbox.com/mapbox.js/api/v3.1.1/l-mapbox-map/
    In this case, function includes argument for mapbox map id "mapbox.light."
    For other mapbox map IDs, see https://www.mapbox.com/api-documentation/#maps.
    "setView" is a method for setting map view (center and zoom).
    "setView" method is here https://www.mapbox.com/mapbox.js/api/v3.1.1/all/#map-set-methods.*/
    var map = L.mapbox.map('map', 'mapbox.dark', {minZoom:4})
      .setView([42.5, -92], 5);

      map.addControl(new L.Control.Fullscreen())
    /*This creates attribution text at bottom of map.
    Created automoatically and attribution data pulled automatically.
    Can be disabled or added to.*/
    var credits = L.control.attribution({prefix:false})
      .addAttribution("Map: Leif Fredrickson, Ammon Shepherd. Resources: Leaflet")
      .addTo(map);

    /* Function creating a lake layer, and allowing different data and stylings to be passed.
    Also creates popup and tooltip interaction. */
    function showlakes(lakedata, c1, c2) {
      var lakesLayer = L.mapbox.featureLayer(lakedata);
      lakesLayer.setStyle({
        color: c1,
        fillColor: c2,
        weight: 1,
      });
      lakesLayer.addTo(map);
      lakesLayer.bindPopup(function (lakesLayer) {
        return lakesLayer.feature.properties.name
        + ", "
        + lakesLayer.feature.properties.state
        + ".<br><u>Note</u>: "
        + lakesLayer.feature.properties.note;
      });
      lakesLayer.bindTooltip(function (lakesLayer) {
        return lakesLayer.feature.properties.name;
       })
       .addTo(map);
    };

    // Add a layer of lakes, styling them blue. This style is changed later with onclicks.
    showlakes(nativeSource, 'rgb(0, 10, 255)', 'rgb(0, 10, 255)');
    showlakes(destination, 'rgb(227, 255, 0)', 'rgb(227, 255, 0)');
    showlakes(nonnativeSource, 'rgb(0, 255, 33)', 'rgb(0, 255, 33)');
    showlakes(unintentSource, 'rgb(255, 0, 0)', 'rgb(255, 0, 0)');
    showlakes(unintentDestination, 'rgb(255, 107, 0)', 'rgb(255, 107, 0)');


    // Create the pairs array (creates an empty array to be filled later)
    var pairs = [];

    /* data comes from the mysis_northamerica.geojson file sourced above
    data.features.forEach loops through all of the objects in the features object only.
    Apparently "data" automatically selects the geojson file (unclear to me).
    So this says: select geojson, select features array within geojson.
    Then run the "forEach" function, which runs a "callback function" for each element in array.\
    (A callback function is a function passed into another function as an argument;
    it does not need to be named callbackfn or anything at all).
    The forEach function is often used instead of a "for loop."
    The callback function used here uses curVal as argument.
    So for each element of the "features" array (the array of lakes basically),
    the function will perform everything in the curly brackets.
    It takes the current value of each element in the array of lakes.
    Then its selects the "geometry" object and the "coordinates" variable
    within "geometry," and then the first and second values for "coordinates,"
    which it assignes to the variables destinationLon and destinationLat respectively.
    And so on for the values assigned to the source lat/lon variables.
    Every time these four sets of variables are assigned values for a given array element,
    those variable-value pairs are "pushed" to the pairs variable created earlier.
    Finally, it adds the variables amount, year, fish and assigns them values from array.
    So we end up with a pairs variable that contains three arrays.
    The third array includes an object that has three variables. */
    data.features.forEach(function callbackfn(curVal) {
      // Grab the origin values and set to a variable
      var destinationLon = curVal.geometry.coordinates[0];
      var destinationLat = curVal.geometry.coordinates[1];

      // Grab the source lat/long and store as variable
      var sourceLon = curVal.properties.long_source;
      var sourceLat = curVal.properties.lat_source;

      /* this creates an object containing the origin and destination lat/longs,
      and then puts that into the points array created earlier.*/
      pairs.push([
        [
          sourceLat,
          sourceLon
        ],
        [
          destinationLat,
          destinationLon
        ],
        [{
          'amount': curVal.properties.amount,
          'year': curVal.properties.year,
          'fish': curVal.properties.fish,
        }]
      ]);

    });

    /* From mapbox: "This is an advanced example that is compatible withmodern browsers and IE9+ -
    the trick it uses is animation of SVG properties,
    which makes it relatively efficient for the effect produced.
    That said, the same trick means that theanimation is non-geographical -
    lines interpolate in the same amount of time regardless of trip length."*/

    /* In original code, drag and zoom are disabled,
    because animation effect does not work well zoomed (dashes instead of moving lines).
    But I want people to be able to zoom after animation, so re-enabled these.
    map.dragging.disable();
    map.touchZoom.disable();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();*/
    /*ap.scrollWheelZoom.disable();
    map.on('focus', () => { map.scrollWheelZoom.enable(); });
    map.on('blur', () => { map.scrollWheelZoom.disable(); });*/
    if (map.tap) map.tap.disable();

    /* Transform the short [lat,lng] format in our data into the {x, y} expected by arc.js.
    What this does is create a function "obj" which takes an argument (aka parameter)
    and extracts the first [0] and second [1] values of the array of that parameter.
    Those values are placed where ll[0] and ll[1] would be,
    so the end product is {y: some latitude, x: some longitude}.
    This is the format need to by arc.js to create an arc --
    i.e., two sets of longitude and latitude numbers in curly brackets.*/
    function obj(ll) {
      return {
        y: ll[0],
        x: ll[1]
      };
    }

    /* Rather than adding directly to map, as in original example, we make a feature layer.
    That way we can have different layers for different fish, etc.
    featureLayer is a method that allows use of geojson data.*/
    var featureLayer = L.mapbox.featureLayer().addTo(map);

    /*In the original, this was a "for loop," not a function.
    But since need to repeat the loop with different layers,
    made this into a function that can pass data on specific fish.
    Whatever is put in the function brackets will be placed where "fishes" is in
    the code contained in the function. So later, we call the function for "pairs,"
    by writing "showfish(pairs). When that is run, the "for loop" will run until
    i < pairs.length, the amount variable will be equal to "pairs[i][2][0]" and so on.
    If we were only working with one set of lat/long variables (as in the original example),
    we wouldn't need a function and would just input pairs.length, etc. in code block below.*/
    function showfish(fishes) {
      /*This is a "for loop" that executes code blocks over and over.
      This says that for the given data/array (which is passed to the loop via the
      function argument above), start with the first variable in the array
      (i.e., set the counter variable, i, to zero) and run the loop.
      After the loop, increment the counter variable value by one.
      If the second statement, i<fish.length, is ever untrue, then the loop stops.
      The .length property is the number of variables in the array.*/
      for (var i = 0; i < fishes.length; i++) {
        /*Since our data is in slightly different form than original example,
        we need to extract it and put it into form that can be used to make arcs,
        and to visualize those arcs in different ways.
        For each of the below, we create and name a variable.
        The variable's value changing with the argument (i.e., data set) passed in the showfish() function,
        and the specific objects and values referenced.
        For example, var fish = fishes[1][2][0].fish does the following:
        The "for loop" cycles through each i value starting with 0.
        So for the given data set, it picks out the first object (the zero position).
        In this case, that means it is picking out one of the instances of a lake introduciton.
        Then it picks out the third object (position two) located in the first object (the lake).
        In the geojson data set, the first object is "type" with value "feature."
        The second object is "geometry," which includes other objects and values.
        The third object is "properties," with contains an array (an object)
        with many variables and values. So the [2] after [i] selects the "properties" object.
        Then the [0] selects the first (and in this case, only) object within the "properties"
        object, which is an array. Within that array, it selects a variable, "fish" and returns
        the value of that variable.
        This is a loop, so it loops through and does this for all the objects in the data set.*/
        var amount = fishes[i][2][0].amount;
        var year = fishes[i][2][0].year;
        var fish = fishes[i][2][0].fish;
        var secs = year - 1945;

        var colorChange = '';
        if (fish === "kokanee") {
          colorChange = 'var(--kokanee)';
        } else if (fish === "lake") {
          colorChange = 'var(--lake)';
        } else if (fish === "whitebass-steelhead") {
          colorChange = 'var(--whitebass-steelhead)';
        } else if (fish === "unintentional") {
          colorChange = 'var(--unintentional)';
        } else if (fish === "rainbow") {
          colorChange = 'var(--rainbow)';
        } else if (fish === "trout") {
          colorChange = 'var(--trout)';
        } else if (fish === "kokanee-trout") {
          colorChange = 'var(--kokanee-trout)';
        } else {
          colorChange = "";
        }

        var opacityChange = '';
        if (fish === "kokanee") {
          opacityChange = 0.6;
        } else if (fish === "lake") {
          opacityChange = 0.4;
        } else if (fish === "whitebass-steelhead") {
          opacityChange = 0.8;
        } else if (fish === "unintentional") {
          opacityChange = 0.8;
        } else if (fish === "rainbow") {
          opacityChange = 0.4;
        } else if (fish === "trout") {
          opacityChange = 0.4;
        } else if (fish === "kokanee-trout") {
          opacityChange = 0.4;
        } else {
          opacityChange = "";
        }

        var weightChange = 2

        /* Transform each pair of coordinates into a great circle using Arc.js.
        So below, we are taking the data set passed from the showfish() function.
        No variable named "fishes" is actually passed in this code, but "pairs"
        and perhaps other are passed below. For the argument passed, we grab each
        of the main objects/arrays (lakes) in it iteratively (with [i]),
        then grab the first and second arrays within those main objects.
        The obj() function has been defined above as obj(ll) { return { y: ll[0], x: ll[1] }; }
        So for each of the two arrays grabbed from the lake arrays,
        it takes the first and second values in the array. Which are lat and long coordinates.
        It puts these in the form acceptable to arc.js, after they are flipped (see below) */
        var generator = new arc.GreatCircle(
          obj(fishes[i][0]),
          obj(fishes[i][1]));
        var line = generator.Arc(100, {
          offset: 10
        });
        /* Leaflet expects [lat,lng] arrays, but a lot of software does the opposite,
        including arc.js, so we flip here. */
        var newLine = L.polyline(line.geometries[0].coords.map(function(c) {
            return c.reverse();
          }), {
            color: colorChange,
            weight: weightChange,
            opacity: opacityChange,
          })
          .addTo(featureLayer);
        var totalLength = newLine._path.getTotalLength();
        newLine._path.classList.add('path-start');
        // This pair of CSS properties hides the line initially
        // See http://css-tricks.com/svg-line-animation-works/
        // for details on this trick.
        newLine._path.style.strokeDashoffset = totalLength;
        newLine._path.style.strokeDasharray = totalLength;
        // Offset the timeout here: setTimeout makes a function
        // run after a certain number of milliseconds - in this
        // case we want each flight path to be staggered a bit.
        setTimeout((function(path) {
          return function() {
            // setting the strokeDashoffset to 0 triggers
            // the animation.
            path.style.strokeDashoffset = 0;
          };
        })(newLine._path), secs * 1000);
      }
    } /* This is the end of the showfish(fishes) function*/

    function staticfish(fishes) {

      for (var i = 0; i < fishes.length; i++) {
        var amount = fishes[i][2][0].amount;
        var year = fishes[i][2][0].year;
        var fish = fishes[i][2][0].fish;
        var secs = year - 1948;

        var colorChange = '';
        if (fish === "kokanee") {
          colorChange = 'var(--kokanee)';
        } else if (fish === "lake") {
          colorChange = 'var(--lake)';
        } else if (fish === "whitebass-steelhead") {
          colorChange = 'var(--whitebass-steelhead)';
        } else if (fish === "unintentional") {
          colorChange = 'var(--unintentional)';
        } else if (fish === "rainbow") {
          colorChange = 'var(--rainbow)';
        } else if (fish === "trout") {
          colorChange = 'var(--trout)';
        } else if (fish === "kokanee-trout") {
          colorChange = 'var(--kokanee-trout)';
        } else {
          colorChange = "";
        }

        var opacityChange = '';
        if (fish === "kokanee") {
          opacityChange = 0.6;
        } else if (fish === "lake") {
          opacityChange = 0.4;
        } else if (fish === "whitebass-steelhead") {
          opacityChange = 0.8;
        } else if (fish === "unintentional") {
          opacityChange = 0.8;
        } else if (fish === "rainbow") {
          opacityChange = 0.4;
        } else if (fish === "trout") {
          opacityChange = 0.4;
        } else if (fish === "kokanee-trout") {
          opacityChange = 0.4;
        } else {
          opacityChange = "";
        }

        var weightChange = 1

        var generator = new arc.GreatCircle(
          obj(fishes[i][0]),
          obj(fishes[i][1]));
        var line = generator.Arc(100, {
          offset: 10
        });
        var newLine = L.polyline(line.geometries[0].coords.map(function(c) {
            return c.reverse();
          }), {
            color: colorChange,
            weight: weightChange,
            opacity: opacityChange
          })
          .addTo(featureLayer);
        var arrowHead = L.polylineDecorator(newLine, {
          patterns: [{
            offset: '100%',
            repeat: 0,
            symbol: L.Symbol.arrowHead({
              pixelSize: 5,
              polygon: true,
              pathOptions: {
                stroke: true,
                weight: 1,
                opacity: opacityChange,
                color: colorChange
              }
            })
          }]
        }).addTo(featureLayer);
        var arrowHead = L.polylineDecorator(newLine, {
          patterns: [{
            offset: "20%",
            repeat: 0,
            symbol: L.Symbol.arrowHead({
              pixelSize: 4,
              polygon: false,
              pathOptions: {
                stroke: true,
                weight: 1,
                opacity: 1,
                color: colorChange
              }
            })
          }]
        }).addTo(featureLayer);
      }
    }



    var all = document.getElementById('filter-all'),
      allstatic = document.getElementById('filter-all-static'),
      kokaneefilter = document.getElementById('filter-kokanee'),
      rainbowfilter = document.getElementById('filter-rainbow'),
      lakefilter = document.getElementById('filter-lake'),
      troutfilter = document.getElementById('filter-trout'),
      kokaneetroutfilter = document.getElementById('filter-kokaneetrout'),
      whitebasssteelheadfilter = document.getElementById('filter-whitebasssteelhead'),
      unintentionalfilter = document.getElementById('filter-unintentional');


    // Date counter. Starts at 1945 and counts up one every second, until  1990.
    var counter = 1945;
    var timer;

    function countUP(cancel) {

      if (cancel == 1) {
        document.getElementById("timer_container").innerHTML = 'Year: 1945';
        counter = 1945;
      } else if (cancel == 0 && counter < 1982) {
        counter = counter + 1;
        //increment the counter by 1, display the new value in the div
        document.getElementById("timer_container").innerHTML = 'Year: ' + counter;
      }
      //if counter less than 1982, countup, otherwise
      else {
        featureLayer.clearLayers();
        staticfish(pairs);
      }
    }

    var test = true;


    all.onclick = function() {
      // remove all points and lines
      featureLayer.clearLayers();
      clearInterval(timer);
      countUP(1);
      timer = setInterval("countUP(0)", 1000);
      //countUP(){return 'Year: 1925'};
      //document.getElementById("timer_container").innerHTML = 'Year: 1945';
      //timer = setInterval("countUP(1)");

      // Changes the a tag with the following id class to nothing
      allstatic.className = '';
      kokaneefilter.className = '';
      rainbowfilter.className = '';
      lakefilter.className = '';
      troutfilter.className = '';
      kokaneetroutfilter.className = '';
      whitebasssteelheadfilter.className = '';
      unintentionalfilter.className = '';
      // Make only "this" class ("all") active
      this.className = 'active';

      showfish(pairs);
      return false;
    };

    allstatic.onclick = function() {

      featureLayer.clearLayers();
      clearInterval(timer);
      countUP(1);
      document.getElementById("timer_container").innerHTML = 'Years: 1949-1982';

      all.className = '';
      kokaneefilter.className = '';
      rainbowfilter.className = '';
      lakefilter.className = '';
      troutfilter.className = '';
      kokaneetroutfilter.className = '';
      whitebasssteelheadfilter.className = '';
      unintentionalfilter.className = '';
      this.className = 'active';

      staticfish(pairs);
      return false;

    };

    kokaneefilter.onclick = function(e) {
      featureLayer.clearLayers();
      clearInterval(timer);
      countUP(1);
      document.getElementById("timer_container").innerHTML = 'Years: 1965-1980';

      all.className = '';
      allstatic.className = '';
      rainbowfilter.className = '';
      lakefilter.className = '';
      troutfilter.className = '';
      kokaneetroutfilter.className = '';
      whitebasssteelheadfilter.className = '';
      unintentionalfilter.className = '';
      this.className = 'active';
      // find only the kokanee
      var kokaneepairs = pairs.filter(function(obj) {
        return obj[2][0].fish === 'kokanee'
      });
      staticfish(kokaneepairs);
      return false;

    };

    rainbowfilter.onclick = function(e) {
      featureLayer.clearLayers();
      clearInterval(timer);
      countUP(1);
      document.getElementById("timer_container").innerHTML = 'Years: 1949-1970';

      all.className = '';
      allstatic.className = '';
      kokaneefilter.className = '';
      lakefilter.className = '';
      troutfilter.className = '';
      kokaneetroutfilter.className = '';
      whitebasssteelheadfilter.className = '';
      unintentionalfilter.className = '';
      this.className = 'active';
      var rainbowpairs = pairs.filter(function(obj) {
        return obj[2][0].fish === 'rainbow'
      });
      staticfish(rainbowpairs);
      return false;

    };

    lakefilter.onclick = function(e) {
      featureLayer.clearLayers();
      clearInterval(timer);
      countUP(1);
      document.getElementById("timer_container").innerHTML = 'Years: 1957-1982';

      all.className = '';
      allstatic.className = '';
      kokaneefilter.className = '';
      rainbowfilter.className = '';
      troutfilter.className = '';
      kokaneetroutfilter.className = '';
      whitebasssteelheadfilter.className = '';
      unintentionalfilter.className = '';
      this.className = 'active';
      var lakepairs = pairs.filter(function(obj) {
        return obj[2][0].fish === 'lake'
      });
      staticfish(lakepairs);
      return false;

    };

    troutfilter.onclick = function(e) {
      featureLayer.clearLayers();
      clearInterval(timer);
      countUP(1);
      document.getElementById("timer_container").innerHTML = 'Years: 1963-1976';

      all.className = '';
      allstatic.className = '';
      kokaneefilter.className = '';
      rainbowfilter.className = '';
      lakefilter.className = '';
      kokaneetroutfilter.className = '';
      whitebasssteelheadfilter.className = '';
      unintentionalfilter.className = '';
      this.className = 'active';
      var troutpairs = pairs.filter(function(obj) {
        return obj[2][0].fish === 'trout'
      });
      staticfish(troutpairs);
      return false;

    };

    kokaneetroutfilter.onclick = function(e) {
      featureLayer.clearLayers();
      clearInterval(timer);
      countUP(1);
      document.getElementById("timer_container").innerHTML = 'Years: 1965-1979';

      all.className = '';
      allstatic.className = '';
      kokaneefilter.className = '';
      rainbowfilter.className = '';
      lakefilter.className = '';
      troutfilter.className = '';
      whitebasssteelheadfilter.className = '';
      unintentionalfilter.className = '';
      this.className = 'active';
      var kokaneetroutpairs = pairs.filter(function(obj) {
        return obj[2][0].fish === 'kokanee-trout'
      });
      staticfish(kokaneetroutpairs);
      return false;

    };

    whitebasssteelheadfilter.onclick = function(e) {
      featureLayer.clearLayers();
      clearInterval(timer);
      countUP(1);
      document.getElementById("timer_container").innerHTML = 'Years: 1981';

      all.className = '';
      allstatic.className = '';
      kokaneefilter.className = '';
      rainbowfilter.className = '';
      lakefilter.className = '';
      troutfilter.className = '';
      kokaneetroutfilter.className = '';
      unintentionalfilter.className = '';
      this.className = 'active';
      var whitebasssteelheadpairs = pairs.filter(function(obj) {
        return obj[2][0].fish === 'whitebass-steelhead'
      });
      staticfish(whitebasssteelheadpairs);
      return false;

    };

    unintentionalfilter.onclick = function(e) {
      featureLayer.clearLayers();
      clearInterval(timer);
      countUP(1);
      document.getElementById("timer_container").innerHTML = 'Years: circa 1980';

      all.className = '';
      allstatic.className = '';
      kokaneefilter.className = '';
      rainbowfilter.className = '';
      lakefilter.className = '';
      troutfilter.className = '';
      kokaneetroutfilter.className = '';
      whitebasssteelheadfilter.className = '';
      this.className = 'active';
      var unintentionalpairs = pairs.filter(function(obj) {
        return obj[2][0].fish === 'unintentional'
      });
      staticfish(unintentionalpairs);
      return false;

    };
