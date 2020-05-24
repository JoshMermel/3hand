// TODO(jmerm): validate hand_seq 
// TODO(jmerm) neutral movement on middle hand.

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
  } else if (i === -1) {
    // This is a hack that let's me use -1's to indicate added 2's when padding.
    return 2;
  } else if (i < -1) {
    // This is worse hack for notating multiplexed added twos.
    return '[' + '2'.repeat(-1 * i) + ']';
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

function stringify(tosslist) {
  if (tosslist.length === 1) {
    return tosslist[0].stringify();
  }

  return '['
    + tosslist.map(function(toss) {return toss.stringify();}).join(' ')
    + ']';
}

// input is an async siteswap in list list int form.
// hand_seq is a nonempty string consisting of the characters 'l', 'm', and 'r'.
function translate(input, hand_seq, mode) {
  let len = lcm(input.length, hand_seq.length);

  let l = [];
  let m = [];
  let r = [];

  for (let i = 0; i < len; i++) {
    let tosses = input[i % input.length];
    let accum = [];
    let src_hand = hand_seq[i % hand_seq.length];
    for (let height of tosses) {
      let dst_hand = hand_seq[(i + height) % hand_seq.length];
      accum.push(new Toss(height, src_hand, dst_hand));
    }
    if (src_hand == 'l') {
      l.push(accum);
      m.push([new Toss()]);
      r.push([new Toss()]);
    } else if (src_hand == 'm') {
      l.push([new Toss()]);
      m.push(accum);
      r.push([new Toss()]);
    } else if (src_hand == 'r') {
      l.push([new Toss()]);
      m.push([new Toss()]);
      r.push(accum);
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
    for (let j = 0; j < input[i].length; j++) {
      if (input[i][j] === 1 || input[i][j] === 0) {
        return 0;
      } else if (input[i][j] === 2) {
        min = 1;
      }
    }
  }

  for (let i = 0; i < hand_seq.length; i++) {
    min = Math.min(min, nextOccurrence(hand_seq, i));
  }

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
    for (let j = 0; j < src_hand[i].length; j++) {
      if (src_hand[i][j].height === undefined || src_hand[i][j].height < 0) {
        continue;
      }
      let dst_pos = (src_hand[i][j].height + i) % src_hand.length;
      let dst_hand = lookup[src_hand[i][j].dst];
      dst_pos += src_hand.length - 1;
      dst_pos %= src_hand.length;

      while ((dst_hand[dst_pos][0].height === undefined || dst_hand[dst_pos][0].height < 0) && src_hand[i][j].height > 1) {
        src_hand[i][j].height -= 1;
        if (dst_hand[dst_pos][0].height === undefined) {
          dst_hand[dst_pos][0].height = 0;
          dst_hand[dst_pos][0].src = src_hand[i].dst;
          dst_hand[dst_pos][0].dst = src_hand[i].dst;
        }
        dst_hand[dst_pos][0].height -= 1;

        dst_pos += src_hand.length - 1;
        dst_pos %= src_hand.length;

      }
    }
  }
}

function toTwoPaddedSiteswap(l, m, r) {
  twoPadHand(l, l, m, r);
  twoPadHand(m, l, m, r);
  twoPadHand(r, l, m, r);

  return toSiteswap(l, m, r);
}

function lightlyTwoPadHand(src_hand, amount) {
  for (let i = 0; i < src_hand.length; i++) {
    // -1 indicated added two padding and the padding doesn't need to be padded
    // again.
    if (src_hand[i][0].height === undefined || src_hand[i][0].height === -1) {
      continue;
    }
    // decrement the throws
    for (let j = 0; j < src_hand[i].length; j++) {
      src_hand[i][j].height -= amount;
    }
    // count back the right number of 1s as a runway into the throws.
    for (let countback = 1; countback < amount+1; countback++) {
      index = (((i - countback) % src_hand.length) + src_hand.length) % src_hand.length;
      src_hand[index] = Array(src_hand[i].length).fill(new Toss(-1, src_hand[i][0].dst, src_hand[i][0].dst));
    }
  }
}

function toLightlyPaddedSiteswap(l, m, r, amount) {
  lightlyTwoPadHand(l, amount);
  lightlyTwoPadHand(m, amount);
  lightlyTwoPadHand(r, amount);

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
    ret += '(' + stringify(l[i]) + ',' + stringify(m[i]) + ')';
  }

  ret += '|';
  for (let i = 0; i < r.length; i++) {
    ret += '(' + stringify(r[i]) + ',0)';
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
