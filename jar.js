// Seal, Scratch, raw, repaired, Download, Open, Rot, and .mjar pack and unpack.
(function () {
      var HAMMING_PARITY = { 1: true, 2: true, 4: true };
      var note = document.getElementById('note');
      var sealed = document.getElementById('sealed');
      var scratched = document.getElementById('scratched');
      var flip = document.getElementById('flip');
      var flipValue = document.getElementById('flip-value');

      function blockFromNibble(nibble) {
        var d3 = (nibble >> 3) & 1;
        var d5 = (nibble >> 2) & 1;
        var d6 = (nibble >> 1) & 1;
        var d7 = nibble & 1;
        var p1 = d3 ^ d5 ^ d7;
        var p2 = d3 ^ d6 ^ d7;
        var p4 = d5 ^ d6 ^ d7;
        var hamming = [p1, p2, d3, p4, d5, d6, d7];
        var p0 = 0;
        hamming.forEach(function (bit) { p0 ^= bit; });
        return [p0].concat(hamming);
      }

      function renderBlocks(container, blocks) {
        container.replaceChildren();
        blocks.forEach(function (bits) {
          var block = document.createElement('div');
          block.className = 'sealed-block';
          bits.forEach(function (bit, i) {
            var cell = document.createElement('div');
            var kind = i === 0 ? 'overall parity' : (HAMMING_PARITY[i] ? 'parity' : 'data');
            cell.className = 'sealed-bit ' + kind;
            cell.setAttribute('data-v', String(bit));
            cell.textContent = String(bit);
            block.appendChild(cell);
          });
          container.appendChild(block);
        });
      }

      function readBlocks(container) {
        return Array.prototype.map.call(container.children, function (block) {
          return Array.prototype.map.call(block.children, function (cell) {
            return cell.textContent === '1' ? 1 : 0;
          });
        });
      }

      function nibbleFrom(bits) {
        return (bits[3] << 3) | (bits[5] << 2) | (bits[6] << 1) | bits[7];
      }

      function syndrome(bits) {
        var hamming = bits.slice(1);
        var check1 = hamming[0] ^ hamming[2] ^ hamming[4] ^ hamming[6];
        var check2 = hamming[1] ^ hamming[2] ^ hamming[5] ^ hamming[6];
        var check4 = hamming[3] ^ hamming[4] ^ hamming[5] ^ hamming[6];
        return (check4 << 2) | (check2 << 1) | check1;
      }

      function overallOdd(bits) {
        var sum = 0;
        bits.forEach(function (bit) { sum ^= bit; });
        return sum === 1;
      }

      function repairBlock(bits) {
        var next = bits.slice();
        var syn = syndrome(next);
        var odd = overallOdd(next);
        if (syn === 0 && !odd) return { bits: next, ok: true };
        if (syn >= 1 && syn <= 7 && odd) {
          next[syn] ^= 1;
          return { bits: next, ok: true };
        }
        if (syn === 0 && odd) {
          next[0] ^= 1;
          return { bits: next, ok: true };
        }
        return { bits: bits.slice(), ok: false };
      }

      function charFrom(byte) {
        if (byte < 32 || byte === 127) return '?';
        return String.fromCharCode(byte);
      }

      function decodeRaw(blocks) {
        var text = '';
        for (var i = 0; i < blocks.length; i += 2) {
          if (i + 1 >= blocks.length || blocks[i].length !== 8 || blocks[i + 1].length !== 8) {
            text += '?';
            break;
          }
          var byte = (nibbleFrom(blocks[i]) << 4) | nibbleFrom(blocks[i + 1]);
          text += charFrom(byte);
        }
        return text;
      }

      function decodeRepaired(blocks) {
        var text = '';
        for (var i = 0; i < blocks.length; i += 2) {
          if (i + 1 >= blocks.length || blocks[i].length !== 8 || blocks[i + 1].length !== 8) {
            text += '?';
            break;
          }
          var a = repairBlock(blocks[i]);
          var b = repairBlock(blocks[i + 1]);
          if (!a.ok || !b.ok) {
            text += '?';
            continue;
          }
          var byte = (nibbleFrom(a.bits) << 4) | nibbleFrom(b.bits);
          text += charFrom(byte);
        }
        return text;
      }

      document.getElementById('seal').addEventListener('click', function () {
        var text = note.value.slice(0, 8);
        var blocks = [];
        for (var c = 0; c < text.length; c++) {
          var byte = text.charCodeAt(c) & 255;
          blocks.push(blockFromNibble((byte >> 4) & 15));
          blocks.push(blockFromNibble(byte & 15));
        }
        renderBlocks(sealed, blocks);
      });

      flip.addEventListener('input', function () {
        flipValue.textContent = flip.value;
      });

      document.getElementById('scratch').addEventListener('click', function () {
        var chance = Number(flip.value);
        var copy = readBlocks(sealed).map(function (bits) {
          return bits.map(function (bit) {
            return Math.random() < chance ? bit ^ 1 : bit;
          });
        });
        renderBlocks(scratched, copy);
        document.getElementById('raw').textContent = decodeRaw(copy);
        document.getElementById('repaired').textContent = decodeRepaired(copy);
      });

      function packBlock(bits) {
        var value = 0;
        for (var pos = 0; pos < 8; pos++) value |= (bits[pos] & 1) << (7 - pos);
        return value;
      }

      function unpackBlock(value) {
        var bits = [];
        for (var pos = 0; pos < 8; pos++) bits.push((value >> (7 - pos)) & 1);
        return bits;
      }

      function buildMjar(blocks) {
        var bytes = new Uint8Array(6 + blocks.length);
        bytes[0] = 77;
        bytes[1] = 74;
        bytes[2] = 65;
        bytes[3] = 82;
        bytes[4] = 1;
        bytes[5] = Math.floor(blocks.length / 2) & 255;
        for (var i = 0; i < blocks.length; i++) bytes[6 + i] = packBlock(blocks[i]);
        return bytes;
      }

      function parseMjar(bytes) {
        if (!bytes || bytes.length < 6) return null;
        if (bytes[0] !== 77 || bytes[1] !== 74 || bytes[2] !== 65 || bytes[3] !== 82) return null;
        if (bytes[4] !== 1) return null;
        var count = bytes[5] * 2;
        if (bytes.length < 6 + count) return null;
        var blocks = [];
        for (var i = 0; i < count; i++) blocks.push(unpackBlock(bytes[6 + i]));
        return blocks;
      }

      function showOpened(bytes) {
        var blocks = parseMjar(bytes);
        document.getElementById('opened').textContent = blocks ? decodeRepaired(blocks) : '?';
      }

      function flipCodedBits(bytes, count) {
        var total = (bytes.length - 6) * 8;
        var n = Math.min(count, total);
        var seen = {};
        var got = 0;
        while (got < n) {
          var bitIndex = Math.floor(Math.random() * total);
          if (seen[bitIndex]) continue;
          seen[bitIndex] = true;
          got++;
          bytes[6 + Math.floor(bitIndex / 8)] ^= 1 << (bitIndex % 8);
        }
      }

      document.getElementById('download').addEventListener('click', function () {
        var bytes = buildMjar(readBlocks(sealed));
        var blob = new Blob([bytes], { type: 'application/octet-stream' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = 'note.mjar';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      });

      var openFile = document.getElementById('open-file');
      document.getElementById('open').addEventListener('click', function () {
        openFile.click();
      });
      openFile.addEventListener('change', function () {
        var file = openFile.files && openFile.files[0];
        if (!file) return;
        file.arrayBuffer().then(function (buf) {
          showOpened(new Uint8Array(buf));
          openFile.value = '';
        });
      });

      function rot(count) {
        var bytes = buildMjar(readBlocks(sealed));
        flipCodedBits(bytes, count);
        showOpened(bytes);
      }

      document.getElementById('rot1').addEventListener('click', function () { rot(1); });
      document.getElementById('rot8').addEventListener('click', function () { rot(8); });
    })();
