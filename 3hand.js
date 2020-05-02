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

// Takes input as a string. Returns it as a list list int.
function parseInput(input) {
  let ret = [];
  let accum = [];  // accumulator for multiplexes
  let parsing_multiplex = false;

  for (let i = 0; i < input.length; i++) {
    if (input[i] == '[') {
      if (parsing_multiplex) {
        console.log("mismatched braces.");
      }
      parsing_multiplex = true;
    } else if (input[i] == ']') {
      if (!parsing_multiplex) {
        console.log("mismatched braces");
        break;
      }
      ret.push(accum);
      accum = [];
      parsing_multiplex = false;
    } else if (parsing_multiplex) {
      accum.push(toInt(input[i]));
    } else {
      ret.push([toInt(input[i])]);
    }
  }

  if (parsing_multiplex) {
    console.log("failed to close brace");
  }
  return ret;
}

// Takes input as a list list int.
// Returns true if it is a valid siteswap and false otherwise.
function validateSiteswap(siteswap) {
  // Compute how many balls land on each beat
  let landings = [];
  for (let i = 0; i < siteswap.length; i++) {
    for (let j = 0; j < siteswap[i].length; j++) {
      let down_pos = (siteswap[i][j] + i) % siteswap.length;
      if (landings[down_pos] === undefined) {
        landings[down_pos] = 1;
      } else {
        landings[down_pos] += 1;
      }
    }
  }
  for (let i = 0; i < siteswap.length; i++) {
    if (landings[i] === undefined) {
      landings[i] = 0;
    }
  }

  // Check that the number of landing each beat matches the number of tosses.
  for (let i = 0; i < siteswap.length; i++) {
    if (landings[i] !== siteswap[i].length) {
      return false;
    }
  }

  return true;
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
  if (i === undefined) {
    return 0;
  }
  i *= 2;
  if (i >= 0 && i <= 9) {
    return String.fromCharCode(i + 48);
  } else if (i >= 10 && i <= 35) {
    return String.fromCharCode(i + 97 - 10);
  }
  // TODO: handle characters larger than this?
}

// returns the suffix for a throw from src_hand to dst_hand.
function suffix(src_hand, dst_hand) {
  if (src_hand === undefined || dst_hand === undefined) {
    return "";
  }
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

// struct for managing tosses
function Toss(height, src, dst) {
  this.height = height;
  this.src = src;
  this.dst = dst;

  this.stringify = function() {
    return String(toToss(this.height)) + suffix(this.src, this.dst);
  }
}

// input is an async siteswap in list list int form.
// hand_seq is a nonempty string consisting of the characters 'l', 'm', and 'r'.
function translate(input, hand_seq, mode) {
  let len = lcm(input.length, hand_seq.length);

  let l = [];
  let m = [];
  let r = [];

  for (let i = 0; i < len; i++) {
    let height = input[i % input.length][0];
    let src_hand = hand_seq[i % hand_seq.length];
    let dst_hand = hand_seq[(i + height) % hand_seq.length];

    if (src_hand == 'l') {
      l.push(new Toss(height, src_hand, dst_hand));
      m.push(new Toss());
      r.push(new Toss());
    } else if (src_hand == 'm') {
      l.push(new Toss());
      m.push(new Toss(height, src_hand, dst_hand));
      r.push(new Toss());
    } else if (src_hand == 'r') {
      l.push(new Toss());
      m.push(new Toss());
      r.push(new Toss(height, src_hand, dst_hand));
    } else {
      console.log("unexpected hand seq char " + src_hand);
    }
  }

  if (mode === "two-pad") {
    return toTwoPaddedSiteswap(l, m, r);
  } else if (mode === "light-two-pad") {
    let reduction_amount = reductionAmount(hand_seq, input);
    return toLightlyPaddedSiteswap(l, m, r, reduction_amount);
  } else {
    return toSiteswap(l, m, r);
  }
}

function reductionAmount(hand_seq, input) {
  let min = 2;
  for (let i = 0; i < input.length; i++) {
    if (input[i][0] === 1) {
      min = 1;
    }
  }


  for (let i = 0; i < hand_seq.length; i++) {
    min = Math.min(min, nextOccurrence(hand_seq, i));
  }

  // TODO(jmerm): if input has any 0s or 1's, the might limit how much we can
  // reduce.

  return min;
}

// takes a hand seq and index, returns how many steps before that hand happens
// again.
function nextOccurrence(hand_seq, index) {
  let i = 0;
  while(true) {
    if (hand_seq[(index + i + 1) % hand_seq.length] === hand_seq[index]) {
      return i;
    }
    i++;
  }
  console.log("this should never happen");
}

function twoPadHand(src_hand, l, m, r) {
  let lookup = {};
  lookup['l'] = l;
  lookup['m'] = m;
  lookup['r'] = r;

  for (let i = 0; i < src_hand.length; i++) {
    if (src_hand[i].height === undefined) {
      continue;
    }
    let dst_pos = (src_hand[i].height + i) % src_hand.length;
    let dst_hand = lookup[src_hand[i].dst];

    dst_pos += src_hand.length - 1;
    dst_pos %= src_hand.length;
    while (dst_hand[dst_pos].height === undefined && src_hand[i].height > 1) {
      src_hand[i].height -= 1;
      dst_hand[dst_pos].height = 1;
      dst_hand[dst_pos].src = src_hand[i].dst;
      dst_hand[dst_pos].dst = src_hand[i].dst;
      dst_pos += src_hand.length - 1;
      dst_pos %= src_hand.length;
    }
  }
}

function toTwoPaddedSiteswap(l, m, r) {
  twoPadHand(l, l, m, r);
  twoPadHand(m, l, m, r);
  twoPadHand(r, l, m, r);

  return toSiteswap(l, m, r);
}

function lightlyTwoPadHand(src_hand, l, m, r, amount) {
  let lookup = {};
  lookup['l'] = l;
  lookup['m'] = m;
  lookup['r'] = r;

  for (let i = 0; i < src_hand.length; i++) {
    if (src_hand[i].height === undefined) {
      continue;
    }
    let dst_pos = (src_hand[i].height + i) % src_hand.length;
    let dst_hand = lookup[src_hand[i].dst];

    dst_pos += src_hand.length - 1;
    dst_pos %= src_hand.length;
    // while (dst_hand[dst_pos].height === undefined && src_hand[i].height > 1) {
    if (src_hand[i].height > 1) {
      for (let j = 0; j < amount; j++) {
        // TODO(jmerm): check that src_hand[i].height > 1
        src_hand[i].height -= 1;
        dst_hand[dst_pos].height = 1;
        dst_hand[dst_pos].src = src_hand[i].dst;
        dst_hand[dst_pos].dst = src_hand[i].dst;
        dst_pos += src_hand.length - 1;
        dst_pos %= src_hand.length;
      }
    }
  }
}

function toLightlyPaddedSiteswap(l, m, r, amount) {
  lightlyTwoPadHand(l, l, m, r, amount);
  lightlyTwoPadHand(m, l, m, r, amount);
  lightlyTwoPadHand(r, l, m, r, amount);

  return toSiteswap(l, m, r);

}

// Takes a list of tosses that happen in each hand on each beat.
// Returns a string representation of that 3-handed siteswap.
function toSiteswap(l, m, r) {
  if (l.length != m.length || l.length != r.length) {
    console.log("Length mismatch converting to siteswap");
  }
  let ret = '<';
  for (let i = 0; i < l.length; i++) {
    ret += '(' + l[i].stringify() + ',' + m[i].stringify() + ')';
  }

  ret += '|';
  for (let i = 0; i < r.length; i++) {
    ret += '(' + r[i].stringify() + ',0)';
  }
  ret += '>';

  return ret;
}

// Takes a sitswap in string form
// returns a link to animate it on jugglinglab.org.
function linkify(siteswap, lower) {
  let ret = "http://jugglinglab.org/anim?pattern=" + 
    siteswap + 
    ";body=<(0,-60).|(0,60).>;dwell=0.7";
  if (lower) {
    ret += ";bps=8";
  }
  return ret;
}
