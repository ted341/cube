// this is the testing script
const log = new URL('https://script.google.com/macros/s/AKfycbz9gBHjjgySc9eLQuEQb0ig5LqLYbkcuRWE6eKG/exec');
const bgname = ['darksalmon','tomato','orange','palegreen','dodgerblue','mediumseagreen','slateblue','violet']
//const bghex = ['#e9967a','#ff6347','#ffa500','#98fb98','#1e90ff','#3cb371','#6a5acd','#ee82ee']
const top3 = [0, 3, 8, 1, 2, 7, 4, 5, 6], top4 = [0, 3, 8, 15, 1, 2, 7, 14, 4, 5, 6, 13, 9, 10, 11, 12],
      top5 = [0, 3, 8, 15, 24, 1, 2, 7, 14, 23, 4, 5, 6, 13, 22, 9, 10, 11, 12, 21, 16, 17, 18, 19, 20];

var col, toplist, spl;
function createBoard(){

  toplist = []; // buffer
  arr = []; // list of odds

  col = Array(size*2);
  for (let i = 0; i < size; i++){
    col[i] = i*2 + 1;
    col[i + size] = size*2;
  }

  // create blank element of board
  for (let i = 0; i < size*2; i++){
    for (let j = 0; j < col[i]; j++){

      let newel = $("<div></div>");
      newel.attr("id", i*size*2+j);
      newel.attr("class", "square");
      newel.css("background-color", "white");
      newel.css("height", String(150/size));
      newel.css("width", String(150/size));
      newel.on("click", changeColor);

      if (i < size) toplist.push(newel);
      else if (j < size) $("#LeftFace").append(newel);
      else $("#RightFace").append(newel);
    }
  }

  for (let i = 0; i < toplist.length; i++)
    switch (size){ // raarrange top face element
      case 3: $("#TopFace").append(toplist[top3[i]]); break;
      case 4: $("#TopFace").append(toplist[top4[i]]); break;
      case 5: $("#TopFace").append(toplist[top5[i]]); break;
    }

  fetchBoard().then(q => {
    console.log(q);
    spath = new Array(cnum); // shortest path container
    pass = Array(cnum).fill(0);
    for (let i = 0; i < cnum; i++) spath[i] = [];
    spl = q.spl;
  })

  setBoardStyle();
  constructEdgeList();
}

function destroyBoard(){
  if (size === undefined) return;
  $("#cube>div").removeAttr("style");
  $("#cube>div").empty();
}

var complete;
function resetBoard(){

  if (complete === undefined || complete) return;

  var sq = $(".square");

  for (s in sq){ // s is index of jquery object (string)
    let idx = arr.indexOf(parseInt(sq.eq(s).attr("id")));
    if (idx > -1) sq.eq(s).css("background-color", bgname[Math.floor(idx/2)]);
    else sq.eq(s).css("background-color", "white");
    sq.eq(s).css("border-color", "black");
    if (parseInt(s)+1 == sq.length) break;
  }
}

// unused
function generateBoard(){
  // randomly pick odds
  while(arr.length < cnum*2){

    let a = Math.floor(Math.random()*size*2),
        b = Math.floor(Math.random()*col[a]),
        c = a*size*2+b;

    if(arr.indexOf(c) > -1) continue;
    arr.push(c);
    setOddStyle(c);
  }
}

var board, cnum, arr; // arr: list of odds
async function fetchBoard(){

  try {
    if (board === undefined || board[0].size != size){
      var res = await fetch('data/' + String(size) + '.json');
      if (!res.ok) throw new Error(res.statusText)
      else board = await res.json();
    }
  } catch(e){ return Promise.reject(e); }

  var index = Math.floor(Math.random()*Object.keys(board).length);
  var pairs = board[index].pairs;
  cnum = parseInt(board[index].color);

  for (let i = 0; i < pairs.length; i++){
    let id = parseInt(pairs[i][0])*size*2+parseInt(pairs[i][1]);
    arr.push(id);
    setOddStyle(id);
  }

  return Promise.resolve(board[index]);
}

function setOddStyle(id){

  let e = document.getElementById(id).style;
  e.backgroundImage = 'url("data/frame.png")';
  e.backgroundPosition = "top 50% left 50%";
  e.backgroundRepeat = "no-repeat";
  e.backgroundColor = bgname[Math.floor((arr.length-1)/2)];
  e.backgroundSize = "80%";
  //String(120/size) + " " + String(120/size);
}

function setBoardStyle(){

  var t = document.getElementById("TopFace").style,
      l = document.getElementById("LeftFace").style,
      r = document.getElementById("RightFace").style,
      length;

  switch(size){
    case 3: length = '162px'; break;
    case 4: length = '166px'; break;
    case 5: length = '170px'; break;
  }

  t.height = t.width = r.height = r.width = l.height = l.width = length;
  t.transform = "skew(60deg, -30deg) scale(1, 0.577) rotate(90deg)";
  r.transform = "skew(0deg, -30deg)";
  l.transform = "skew(0deg, 30deg)";

  if (size == 3){ t.left = '33.8%'; t.top = '11.8%'; }
  else{ t.left = '33.1%'; t.top = '12.2%'; }
}

// unused
function setButtonStyle(){}

var edge;
function constructEdgeList(){

  var dsize = size*2;
  edge = Array(dsize**2);

  for (let i = 0; i < dsize**2; i++)
    edge[i] = [];

  for (let i = 1; i < dsize; i++){ // horizontal
    for (let j = 0; j < Math.floor(col[i]/2); j++){
      //console.log((i - 1)*dsize + j);
      edge[(i - 1)*dsize + j].push(i*dsize + j);
      edge[i*dsize + j].push((i - 1)*dsize + j);
      edge[(i - 1)*dsize + col[i-1] - 1 - j].push(i*dsize + col[i] - 1 - j);
      edge[i*dsize + col[i] - 1 - j].push((i - 1)*dsize + col[i-1] - 1 - j);
    }
  }

  for (let i = 0; i < dsize; i++){ // vertical
    for (let j = 0; j < col[i]-1; j++){
      edge[i*dsize + j].push(i*dsize + j + 1);
      edge[i*dsize + j + 1].push(i*dsize + j)
    }
  }
}

var curColor, moves, steps;
function changeColor(){

  var clkColor = this.style.backgroundColor;

  if (complete !== undefined && complete) return;
  if (arr.indexOf(parseInt(this.id)) > -1){
    if (curColor == clkColor) curColor = 'white';
    else curColor = clkColor;
  }
  else if (curColor != clkColor && curColor != 'white'){

    this.style.backgroundColor = curColor;
    moves.push([parseInt(this.id), ticks]); // (pos, time)
    steps++;

    if (checkConnection()){
      let msg = $("<p></p>")
      msg.html("Complete!");
      $("#pass").append(msg);
      $("#pass").fadeIn(1000);
      complete = true;
    }
  }
}

var size, start;
function changeSize(){
  // entrance of the web app
  destroyBoard();

  // reset/initialize
  start = new Date();
  size = parseInt(this.id[0]);
  curColor = "white";
  complete = false;
  ticks = 0;
  steps = 0;
  moves = [];
  $('#pass').hide(0);
  $('#time').show(0);
  $('#intro').hide(0);

  createBoard();

  if (complete == false) clearInterval(timerId);
  timer();
}

var nblocks, spath, pass, ans;
function checkConnection(){

  var finish = true, count = 0;
  nblocks = 3*size**2;
  ans = 0;

  for (let j = 0; j < cnum; j++){

    let que = [], // queue: shift/push
        vis = Array(nblocks).fill(false),
        pre = Array(nblocks),
        dis = Array(nblocks),
        flag = false;

    que.push(arr[j*2]);
    dis[arr[j*2]] = 0;
    vis[arr[j*2]] = true;

    while (spath[j].length)
      document.getElementById(spath[j].pop()).style.borderColor = "black";

    while(que.length > 0 && !flag){

      let tmp = que.shift();
      for (let i = 0; i < edge[tmp].length; i++){

        let next = edge[tmp][i], // cannot use jquery
            color = document.getElementById(next).style.backgroundColor;

        if (!vis[next] && color == bgname[j])
        {
          vis[next] = true;
          dis[next] = dis[tmp] + 1;
          pre[next] = tmp;
          que.push(next);

          if (next == arr[j*2+1])
          {
            ans++;
            while(pre[next] != arr[j*2])
            {
              spath[j].push(pre[next]);
              next = pre[next];
              ans++;
            }
            flag = true;
            break;
          }
        }
      }
    }

    if (flag){ // the color is connected
      for (let k = 0; k < spath[j].length; k++)
        document.getElementById(spath[j][k]).style.borderColor = "white";
      if(pass[count] == 0)
        pass[count] = ticks;
      count++;
    }
    else finish = false;
  }

  if (finish){
    // stop timer when all color is connected
    clearInterval(timerId);
    //console.log(pass);
    postRecord();
    return true;
  }
  return false;
}

function postRecord(){
  ///*
  var form = new FormData();
  form.append('name', name); // name of player
  form.append('spent', time); // total time spent (regular format)
  form.append('size', size); // board size
  form.append('color', cnum); // number of colors
  form.append('pairs', arr); // pairs' id
  form.append('moves', moves); // position $ time in every move
  form.append('ticks', ticks); // total time spent in second(s)
  form.append('steps', steps); // total click times
  form.append('checkpoints', pass); // time spent in connecting numbers of pairs
  form.append('answer', ans); // real total path length
  form.append('spl', spl);

  fetch(log, { method:'post', body:form, mode:'cors' })
  .then(response => {
    if (!response.ok) throw new Error(response.statusText)
    return response.text()
  }).then(t => console.log(t))
  .catch(err => console.log(err))
  //*/
}

var time, timerId, ticks;
function timer(){
  //timerId = setInterval(stringProcessor, 1000);
  /*
  function stringProcessor(){

    var e = $("#time");
    time = e.html().replace(/[^0-9]/g, "");

    var carry = false, // default radix is 10
        hh = parseInt(time.substr(0, 2)),
        mm = parseInt(time.substr(2, 2)),
        ss = parseInt(time.substr(4, 2));

    if (ss < 59) ss = (ss + 1).toString();
    else { ss = "0"; carry = true; }
    ss = ("00" + ss).substr(ss.length);

    if (carry)
      if (mm < 59) { mm = (mm + 1).toString(); carry = false; }
      else { mm = "0"; carry = true; }
    else mm = mm.toString();
    mm = ("00" + mm).substr(mm.length);

    if (carry)
      if (hh < 99) { hh = (hh + 1).toString(); carry = false; }
      else clearInterval(timerId);
    else hh = hh.toString();
    hh = ("00" + hh).substr(hh.length);

    time = "Time: " + hh + ":" + mm + ":" + ss;
    e.html(time);
    ticks++;
  }
  */
  timerId = setInterval(dateDiff, 1);

  function dateDiff(){

    var dt = Date.now() - start.getTime(),
        diff = new Date(dt);

    time = diff.toISOString().substr(11, 12);
    $('#time>p').html(time);
    ticks = diff.getTime()/1000;
  }
}

var name;
$(function(){
  name = prompt("Please enter your name", "anonym");
  $('.Boardsize').on("click", changeSize); // must use "on"
  $('#Clear').click(resetBoard);
  $('#time').hide(0);
})
