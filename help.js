// The six How this works paragraphs, and opening and closing the panel.
(function () {
  var paragraphs = [
    'A note is a row of tiny switches, each on or off. A scratch flips a switch. If you only store the note, you cannot tell which switch flipped.',
    'This page adds check switches. A check switch is set so its group has an even number of ons. Flip any one switch in the group and the count turns odd. That is how the page knows something broke. One check can only say "broken," not where.',
    'The purple switches are three checks on the same block. Each watches a different half. The yes/no from the three checks is a number, and that number is the position of the one flipped switch. Correct flips that switch back. That is the demo block at the top.',
    'Two flips in one block make the number point at the wrong switch. The smaller bit in front of a sealed block is a fourth check on the whole block. One flip: the number names it, and the fourth check agrees, so it is undone. Two flips: the fourth check does not agree, so the page refuses and shows ? instead of a wrong letter.',
    'Download stores those checked blocks in note.mjar. Rot flips switches inside the file, not on the sealed row. Open reads the file and does the same repair. There is no fix button on that path. The file already carries the checks.',
    'This hides nothing. Anyone can read the note. It only survives a scratch.'
  ];

  var body = document.getElementById('how-body');
  paragraphs.forEach(function (text) {
    var p = document.createElement('p');
    p.textContent = text;
    body.appendChild(p);
  });

  var dialog = document.getElementById('how-dialog');
  document.getElementById('help').addEventListener('click', function () {
    dialog.showModal();
  });
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    dialog.addEventListener('click', function (event) {
      if (event.target !== dialog) return;
      var rect = dialog.getBoundingClientRect();
      var inside = rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX && event.clientX <= rect.left + rect.width;
      if (!inside) dialog.close();
    });
  }
})();
