// The 7-bit demo block: checks, syndrome, and Correct.
(function () {
      // positions 1..7, stored in array index 0..6
      var PARITY_POS = { 1: true, 2: true, 4: true };

      // initial data bits: pos3=1, pos5=0, pos6=1, pos7=1
      var bits = [0, 0, 0, 0, 0, 0, 0];
      bits[2] = 1;  // pos 3
      bits[4] = 0;  // pos 5
      bits[5] = 1;  // pos 6
      bits[6] = 1;  // pos 7

      // fill parity on load
      bits[0] = bits[2] ^ bits[4] ^ bits[6];  // p1: pos 1,3,5,7
      bits[1] = bits[2] ^ bits[5] ^ bits[6];  // p2: pos 2,3,6,7
      bits[3] = bits[4] ^ bits[5] ^ bits[6];  // p4: pos 4,5,6,7

      var row = document.getElementById('row');
      var labels = document.getElementById('labels');

      // check groups (array indices)
      var checks = [
        { name: 'check₁ (1,3,5,7)', idx: [0, 2, 4, 6] },
        { name: 'check₂ (2,3,6,7)', idx: [1, 2, 5, 6] },
        { name: 'check₄ (4,5,6,7)', idx: [3, 4, 5, 6] }
      ];

      // build buttons
      for (var i = 0; i < 7; i++) {
        (function (i) {
          var pos = i + 1;
          var isParity = PARITY_POS[pos] === true;

          var btn = document.createElement('button');
          btn.className = 'bit-btn ' + (isParity ? 'parity' : 'data');
          btn.setAttribute('data-v', bits[i]);
          btn.textContent = bits[i];
          btn.id = 'bit-' + i;

          btn.addEventListener('click', function () {
            bits[i] = bits[i] ^ 1;
            updateBtn(i);
            updateChecks();

            btn.classList.remove('flipping');
            void btn.offsetWidth;
            btn.classList.add('flipping');
          });

          row.appendChild(btn);

          var lbl = document.createElement('div');
          lbl.className = 'lbl' + (isParity ? ' parity-lbl' : '');
          lbl.textContent = isParity ? 'p' + pos : 'd' + pos;
          labels.appendChild(lbl);
        })(i);
      }

      // build check display
      var checksDiv = document.getElementById('checks');
      var checkEls = [];
      checks.forEach(function (c) {
        var r = document.createElement('div');
        r.className = 'check-row';

        var nm = document.createElement('span');
        nm.className = 'check-name';
        nm.textContent = c.name;

        var val = document.createElement('span');
        val.className = 'check-val';

        r.appendChild(nm);
        r.appendChild(val);
        checksDiv.appendChild(r);
        checkEls.push(val);
      });

      // syndrome display
      var syndrome = 0;
      var synDiv = document.getElementById('syndrome');
      synDiv.innerHTML =
        '<span class="syndrome-label">syndrome</span>' +
        '<span class="syndrome-bits" id="syn-bits"></span>' +
        '<span class="syndrome-dec" id="syn-dec"></span>';

      document.getElementById('correct').addEventListener('click', function () {
        if (syndrome < 1 || syndrome > 7) return;
        var i = syndrome - 1;
        bits[i] = bits[i] ^ 1;
        updateBtn(i);
        updateChecks();

        var btn = document.getElementById('bit-' + i);
        btn.classList.remove('flipping');
        void btn.offsetWidth;
        btn.classList.add('flipping');
      });

      function updateBtn(i) {
        var btn = document.getElementById('bit-' + i);
        btn.setAttribute('data-v', bits[i]);
        btn.textContent = bits[i];
      }

      function updateChecks() {
        var synBits = [0, 0, 0]; // check4, check2, check1

        checks.forEach(function (c, ci) {
          var sum = 0;
          c.idx.forEach(function (j) { sum += bits[j]; });
          var even = sum % 2 === 0;
          checkEls[ci].textContent = even ? 'even' : 'odd';
          checkEls[ci].className = 'check-val ' + (even ? 'even' : 'odd');

          // syndrome bit: 1 if odd (fail)
          // checks order: check1=ci0, check2=ci1, check4=ci2
          // syndrome bits order: check4 check2 check1
          if (ci === 0) synBits[2] = even ? 0 : 1; // check1
          if (ci === 1) synBits[1] = even ? 0 : 1; // check2
          if (ci === 2) synBits[0] = even ? 0 : 1; // check4
        });

        var synStr = '' + synBits[0] + synBits[1] + synBits[2];
        var synDec = synBits[0] * 4 + synBits[1] * 2 + synBits[2] * 1;
        syndrome = synDec;

        document.getElementById('syn-bits').textContent = synStr;
        var decEl = document.getElementById('syn-dec');
        decEl.textContent = '= ' + synDec;
        decEl.className = 'syndrome-dec ' + (synDec === 0 ? 'ok' : 'err');
      }

      updateChecks();
    })();
