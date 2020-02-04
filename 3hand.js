// TODO(jmerm): validate hand_seq 


// Takes a char in the siteswap range [0-9a-z]
// Returns an int representing a throw of that height
function toInt(c) {
  if (c.match(/^[0-9]$/)) {
    return parseInt(c, 10);
  } else if (c.match(/^[a-i]$/i)) {
    return c.charCodeAt(0) - "a".charCodeAt(0) + 10;
  } else {
    // TODO: something better here.
    throw c;
  }
}

// TODO(jmerm): multiplex support
// TODO(jmerm): establish limit on input height so max height fits under limit.
function parseInput(input) {
  let ret = [];
  for (let i = 0; i < input.length; i++) {
    ret.push([toInt(input[i])]);
  }
  return ret;
}

// Compute greatest common divisor using the Euclidean algorithm.
// Expects nonzero positive integers.
function gcd(x, y) {
  x = Math.abs(x);
  y = Math.abs(y);
  while(y) {
    let t = y;
    y = x % y;
    x = t;
  }
  return x;
}

// Computes leas common multuple.
// Expects nonzero positive integers.
function lcm(x, y) {
  return  x * y / gcd(x, y);
}

// Takes an integer value in the siteswap range
// returns a char representing a throw of that height
function toToss(i) {
  i *= 2;
  if (i >= 0 && i <= 9) {
    return String.fromCharCode(i + 48);
  } else if (i >= 10 && i <= 35) {
    return String.fromCharCode(i + 97 - 10);
  }
  // TODO: handle characters larger than this?
}


function suffix(src_hand, dst_hand) {
  switch (src_hand + dst_hand) {
    case "ll":
      return "";
    case "lm":
      return "x";
    case "lr":
      return "p";
    case "ml":
      return "x";
    case "mm":
      return "";
    case "mr":
      return "xp";
    case "rl":
      return "p";
    case "rm":
      return "xp";
    case "rr":
      return "";
  }
}

// input is an async siteswap in list list int form.
// hand_seq is a nonempty string consisting of the characters 'l', 'm', and 'r'.
function translate(input, hand_seq) {
  let len = lcm(input.length, hand_seq.length);
  // juggler 1 manages 'l' and 'm'. juggler2 manages 'r'.
  let juggler1 = "";
  let juggler2 = "";

  for (let i = 0; i < len; i++) {
    let height = input[i % input.length][0];
    let src_hand = hand_seq[i % hand_seq.length];
    let dst_hand = hand_seq[(i + height) % hand_seq.length];

    if (src_hand == 'l') {
      juggler1 += "(" + toToss(height) + suffix('l', dst_hand) + ",0)";
      juggler2 += "(0,0)";
    } else if (src_hand == 'm') {
      juggler1 += "(0," + toToss(height) + suffix('m', dst_hand) + ")";
      juggler2 += "(0,0)";
    } else if (src_hand == 'r') {
      juggler1 += "(0,0)";
      juggler2 += "(" + toToss(height) + suffix('r', dst_hand) + ",0)";
    } else {
      console.log("unexpected hand seq char " + src_hand);
    }
  }
  return '<' + juggler1 + '|' + juggler2 + '>';
}

function linkify(siteswap) {
  return "http://jugglinglab.org/anim?pattern=" + 
    siteswap + 
    ";body=<(0,-60).|(0,60).>;dwell=0.7;bps=8";
}
