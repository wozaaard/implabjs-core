// Typescript port of the uuid.js
//  Copyright (c) 2018 Sergey Smirnov
//  BSD-2-Clause License https://opensource.org/licenses/BSD-2-Clause
//
// uuid.js
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

declare var window: any;

let _window: any = 'undefined' !== typeof window ? window : null;

// Unique ID creation requires a high quality random # generator. We
// feature
// detect to determine the best RNG source, normalizing to a function
// that
// returns 128-bits of randomness, since that's what's usually required
let _rng;

function setupBrowser() {
    // Allow for MSIE11 msCrypto
    let _crypto = _window.crypto || _window.msCrypto;

    if (!_rng && _crypto && _crypto.getRandomValues) {
        // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
        //
        // Moderately fast, high quality
        try {
            let _rnds8 = new Uint8Array(16);
            _rng = function whatwgRNG() {
                _crypto.getRandomValues(_rnds8);
                return _rnds8;
            };
            _rng();
        } catch (e) { /**/ }
    }

    if (!_rng) {
        // Math.random()-based (RNG)
        //
        // If all else fails, use Math.random(). It's fast, but is of
        // unspecified
        // quality.
        let _rnds = new Array(16);
        _rng = function () {
            for (var i = 0, r; i < 16; i++) {
                if ((i & 0x03) === 0) {
                    r = Math.random() * 0x100000000;
                }
                _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
            }

            return _rnds;
        };
        if ('undefined' !== typeof console && console.warn) {
            console.warn("[SECURITY] node-uuid: crypto not usable, falling back to insecure Math.random()");
        }
    }
}

function setupNode() {
    // Node.js crypto-based RNG -
    // http://nodejs.org/docs/v0.6.2/api/crypto.html
    //
    // Moderately fast, high quality
    if ('function' === typeof require) {
        try {
            let _rb = require('crypto').randomBytes;
            _rng = _rb && function () {
                return _rb(16);
            };
            _rng();
        } catch (e) { /**/ }
    }
}

if (_window) {
    setupBrowser();
} else {
    setupNode();
}

// Buffer class to use
let BufferClass = ('function' === typeof Buffer) ? Buffer : Array;

// Maps for number <-> hex string conversion
let _byteToHex = [];
let _hexToByte = {};
for (let i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
}

// **`parse()` - Parse a UUID into it's component bytes**
function _parse(s, buf?, offset?): Array<string> {
    let i = (buf && offset) || 0, ii = 0;

    buf = buf || [];
    s.toLowerCase().replace(/[0-9a-f]{2}/g, function (oct) {
        if (ii < 16) { // Don't overflow!
            buf[i + ii++] = _hexToByte[oct];
        }
    });

    // Zero out remaining bytes if string was short
    while (ii < 16) {
        buf[i + ii++] = 0;
    }

    return buf;
}

// **`unparse()` - Convert UUID byte array (ala parse()) into a string**
function _unparse(buf, offset?): string {
    let i = offset || 0, bth = _byteToHex;
    return bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] +
        bth[buf[i++]] + '-' + bth[buf[i++]] + bth[buf[i++]] + '-' +
        bth[buf[i++]] + bth[buf[i++]] + '-' + bth[buf[i++]] +
        bth[buf[i++]] + '-' + bth[buf[i++]] + bth[buf[i++]] +
        bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]];
}

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

// random #'s we need to init node and clockseq
let _seedBytes = _rng();

// Per 4.5, create and 48-bit node id, (47 random bits + multicast bit =
// 1)
let _nodeId = [
    _seedBytes[0] | 0x01,
    _seedBytes[1],
    _seedBytes[2],
    _seedBytes[3],
    _seedBytes[4],
    _seedBytes[5]
];

// Per 4.2.2, randomize (14 bit) clockseq
let _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

// Previous uuid creation time
let _lastMSecs = 0, _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function _v1(options?, buf?, offset?): string {
    let i = buf && offset || 0;
    let b = buf || [];

    options = options || {};

    let clockseq = (options.clockseq != null) ? options.clockseq : _clockseq;

    // UUID timestamps are 100 nano-second units since the Gregorian
    // epoch,
    // (1582-10-15 00:00). JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and
    // 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01
    // 00:00.
    let msecs = (options.msecs != null) ? options.msecs : new Date()
        .getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current
    // clock
    // cycle to simulate higher resolution clock
    let nsecs = (options.nsecs != null) ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    let dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs) / 10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq == null) {
        clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto
    // a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
        nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
        throw new Error(
            'uuid.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    let tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    let tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    let node = options.node || _nodeId;
    for (let n = 0; n < 6; n++) {
        b[i + n] = node[n];
    }

    return buf ? buf : _unparse(b);
}

// **`v4()` - Generate random UUID**

// See https://github.com/broofa/node-uuid for API details
function _v4(options?, buf?, offset?): string {
    // Deprecated - 'format' argument, as supported in v1.2
    let i = buf && offset || 0;

    if (typeof (options) === 'string') {
        buf = (options === 'binary') ? new BufferClass(16) : null;
        options = null;
    }
    options = options || {};

    let rnds = options.random || (options.rng || _rng)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
        for (let ii = 0; ii < 16; ii++) {
            buf[i + ii] = rnds[ii];
        }
    }

    return buf || _unparse(rnds);
}

export function Uuid() {

}

export namespace Uuid {
    export const v4 = _v4;
    export const v1 = _v1;
    export const empty = "00000000-0000-0000-0000-000000000000";
    export const parse = _parse;
    export const unparse = _unparse;
}