/*
 The MIT License (MIT)

 Copyright (c) 2014 Chris Wilson

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

var audioContext = null;
var meter = null;
var canvasContext = null;
var WIDTH = 1000;
var HEIGHT = 50;
var rafID = null;
var lastColor = "green";
var changing = null;
var analyser = null;

var meterHeight;
var meterWidth;
var meterElement;
var gradient;

$(function () {


      // grab our canvas
      canvasContext = document.getElementById("meter").getContext("2d");

      var meterElement = $("#meter");
      meterElement.attr('width', meterElement.width() );
      meterElement.attr('height', meterElement.height() );

      meterWidth = parseInt(meterElement.width());
      meterHeight = parseInt(meterElement.height());

      gradient = canvasContext.createLinearGradient(0,0,0,meterHeight);

      gradient.addColorStop(0,'#ff0000');
      gradient.addColorStop(0.5,'#ffff00');
      gradient.addColorStop(1,'#00ff00');

      canvasContext.fillStyle = gradient;
      canvasContext.fillRect(0, 0, 1, 130);

      // monkeypatch Web Audio
      window.AudioContext = window.AudioContext || window.webkitAudioContext;

      // grab an audio context
      audioContext = new AudioContext();

      // Attempt to get audio input
      try {
        // monkeypatch getUserMedia
        navigator.getUserMedia =
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia;

        // ask for an audio input
        navigator.getUserMedia({audio: true}, gotStream, didntGetStream);

      } catch (e) {
        alert('getUserMedia threw exception :' + e);
      }

    }
);


function didntGetStream() {
  alert('Stream generation failed.');
}

function gotStream(stream) {

  // setup a javascript node
  javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

  // connect to destination, else it isn't called
  javascriptNode.connect(audioContext.destination);

  javascriptNode.onaudioprocess = function () {
    window.requestAnimationFrame(draw);
  };

  // Create an AudioNode from the stream.
  var mediaStreamSource = audioContext.createMediaStreamSource(stream);

  analyser = audioContext.createAnalyser();
  analyser.smoothingTimeConstant = 0.9;
  analyser.fftSize = 1024;

  mediaStreamSource.connect(analyser);

  // we use the javascript node to draw at a specific interval.
  analyser.connect(javascriptNode);
}

function draw() {
//  canvasContext.clearRect(10, 0, meterWidth, meterHeight);

  var freqData = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(freqData);
  var average = getAverageVolume(freqData);

  var multiplier = 1.9;
  average *= multiplier;

  canvasContext.fillStyle = gradient;

  var increment =  130 / 130;
  var y = increment * (130-average);

  console.log("average", average)
  var p = canvasContext.getImageData(0, y, 1, 1).data;

  var hex = "#" + ("000000" + rgbToHex(p[0], p[1], p[2])).slice(-6);

  if (y <= 0)
    $("body").css("background-color", "red");
  else if (hex != "#000000")
    $("body").css("background-color", hex);

  if (average > 80)
    $("#yes").html("Yes!").css("opacity", "1.0");
  else if (average > 50)
    $("#yes").html("You might be").css("opacity", "1.0");
  else
    $("#yes").css("opacity", "0");

}

function findPos(obj) {
    var curleft = 0, curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
        return { x: curleft, y: curtop };
    }
    return undefined;
}

function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}

function getAverageVolume(array) {
  var values = 0;
  var average;

  var length = array.length;

  // get all the frequency amplitudes
  for (var i = 0; i < length; i++) {
    values += array[i];
  }

  average = values / length;
  return average;
}

//function drawLoop(time) {
//  var meterElement = $("#meter");
//
//  // clear the background
//  var width = parseInt(meterElement.width());
//  var height = parseInt(meterElement.height());
//
//  canvasContext.clearRect(0, 0, width, height);
//
//  var clipping = meter.checkClipping();
//
//  // check if we're currently clipping
//  if (clipping) {
//    canvasContext.fillStyle = "red";
//    if (!changing && lastColor != "red") {
//      $("body").css("background-color", "red");
//      lastColor = "red";
//      changing = setTimeout(function() { changing = null; }, 500);
//    }
//  }
//  else {
//    canvasContext.fillStyle = "green";
//    if (!changing && lastColor != "green") {
//      $("body").css("background-color", "green");
//      lastColor = "green";
//      changing = setTimeout(function() { changing = null; }, 500);
//    }
//  }
//
//  var meterPosition = meter.volume * width * 2;
//  console.log("meterPosition / width", meterPosition / width);
//
//  // draw a bar based on the current volume
//  canvasContext.fillRect(0, 0, meterPosition, height);
//
//  // set up the next visual callback
//  rafID = window.requestAnimationFrame(drawLoop);
//}
