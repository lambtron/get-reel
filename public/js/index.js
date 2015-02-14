(function() {
  // check if mobile
  // if mobile, listen for gyro shit
  // save gyro shit to firebase
  // if not mobile
  // get data from firebase
  // show it on screen

  main();

  function main() {
    if (isMobile.any) return mobile();
    desktop();
  }

  function mobile() {
    var firebase = new Firebase('https://moonbutter.firebaseio.com/');
    var rod = {
      alpha: 0,
      beta: 0,
      reel: false,
      release: false
    };

    gyro.frequency = 150;
    gyro.startTracking(function(o) {
      rod.alpha = o.alpha;
      rod.beta = o.beta;
      firebase.child('player').set(rod);
    });

    $('#desktop').remove();
    $(window).resize(function() {
      $('#mobile').width($(window).width());
      $('#mobile').height($(window).height());
    }).trigger('resize')
    $('#mobile').bind('touchstart', function(e) {
      e.preventDefault();
      rod.release = true;
    });
    $('#mobile').bind('touchend', function(e) {
      e.preventDefault();
      rod.release = false;
    });
  }

  function desktop() {
    $('#mobile').remove();
    $('#desktop').width($(window).width());
    $('#desktop').height($(window).height());
    var canvas = document.getElementById('canvas');
    var WIDTH = $(canvas).width();
    var HEIGHT = $(canvas).height();
    $(window).resize(function() {
      $(canvas).width($(window).width());
      $(canvas).height($(window).height());
      // WIDTH = $(canvas).width();
      // HEIGHT = $(canvas).height();
    }).trigger('resize')

    var context = canvas.getContext("2d");

    var rod = {
      tip: {
        x: 0,
        y: 0,
        z: 0,
        width: 4 // not static
      },
      length: Math.min(WIDTH, HEIGHT) * 1 / 3,
      base: {
        x: WIDTH / 2,
        y: HEIGHT * 4 / 3,
        width: 20 // static
      },
      reel: false,
      release: false,
      update: function(state) {
        var p = degreesToCartesian(state.alpha, state.beta, this.length);
        var c = translateToCanvas(p);
        this.tip.x = c.x;
        this.tip.y = c.y;
        this.tip.z = p.z;
      },
      draw: function() {
        // take x, y, z
        // need to find angle between x, y, z and base
        // x_delta = baseX - x
        // y_detal = baseY - y
        // angle of rod =
        // SOH CAH TOA // y_delta / x_delta = tan(angle)
        // 90 - arctan( y_delta / x_delta ) (deg) = connector deg
        // draw rod.
        //

        this.tip.width = this.base.width - 16 * this.tip.z / this.length;
        context.save();
        if (this.tip.z < 0) context.globalAlpha = 1 + (this.tip.z / this.length);
        context.beginPath();
        context.moveTo(this.base.x, this.base.y);
        context.lineTo(this.base.x + this.base.width, this.base.y);
        context.lineTo(this.tip.x + this.tip.width, this.tip.y);
        context.lineTo(this.tip.x, this.tip.y);
        context.lineTo(this.base.x, this.base.y);
        context.closePath();
        context.fill();
        context.restore();
      }
    };

    var firebase = new Firebase('https://moonbutter.firebaseio.com/');
    firebase.child('player').on('value', function(snapshot) {
      var state = snapshot.val();
      if (!state) return;
      rod.update(state);
      draw();
    });

    /**
     * Calibrate the rod.
     */

    var LEFT, RIGHT;

    // get entire circular motion into array
    // find alpha is most left and make that the left part of the screen
    // find alpha is most right and make that the right part of the screen

    /**
     * Physics of casting.
     */

     // lets get the x,y,z velocity from state (dynamic forces at all time)
     // when 'release' is hit, then move from rod input to gravity input (x,y,z => x, -9.8m/s^2, z)
     // until it hits the 'water', then only do 'y' velocity until length of line or floatiness

     // angular displacement => angular velocity => tangential velocity (radius)
     // at release, Beta => tangential velocity => x, y, z
     // listen for release. then calculate x y z velocity.
     //
     // render flight path.

    /**
     * Rendering images.
     */

    function draw() {
      context.clearRect(0, 0, 600, 600);
      rod.draw();
      // draw water and shit.
    }

    /**
     * Helper functions.
     */

    function degreesToCartesian(a, b, r) {
      var p = {};
      a = toRadians(a);
      b = toRadians(b);
      p.x = Math.cos(b) * Math.sin(a) * r;
      p.y = Math.sin(b) * r;
      p.z = Math.cos(b) * Math.cos(a) * r;
      return p;
    }

    function toRadians(d) {
      return d * (Math.PI / 180);
    }

    function translateToCanvas(p) {
      //
      //     1             0
      //            =>
      // -1  0  1       0  1  2
      //
      return { x: WIDTH / 2 - p.x, y: HEIGHT / 2 - p.y };
    }
  }

})();