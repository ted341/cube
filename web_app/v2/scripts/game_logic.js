const bgname = ['darksalmon','tomato','orange','palegreen','dodgerblue','mediumseagreen','slateblue','violet'];
const root = 'https://people.cs.nctu.edu.tw/~hcchang0701/';

$(function(){
  size = 4;
  /*
  // slider
  $("#sliderSize").slider({
    value: 3,
    range: "min",
    animate: true
  });
  
  $("#sliderColor").slider({
    value: 3,
    range: "min",
    animate: true
  });
  //*/
  // event listeners
  $('.card-header-tabs>li').on("click", switchTab);
  $('#retry').on("click", resetBoard);

  sessionStorage.clear();
  sessionStorage.cursorColor = "white";

  generateNewPuzzle();
})

function switchTab(){
  // caller: .nav-item
  $($(this).find('a').attr('href')).show().siblings('.card-body').hide();
  $(this).find('a').addClass('active');
  $(this).siblings().find('.active').removeClass('active');
}

function startTiming(){

  sessionStorage.startTime = new Date();

  sessionStorage.timerId = setInterval(function(){

    let start = Date.parse(sessionStorage.startTime),
        duration = new Date(Date.now() - start);

    $('#timer').html(duration.toISOString().substr(11, 12));

    if (duration.getSeconds() >= 86400) {
      stopTiming();
    }

    sessionStorage.duration = duration.getSeconds();

  }, 1);
}

function stopTiming(){
  clearInterval(sessionStorage.timerId);
}

async function generateNewPuzzle(){

  createWhiteBoard();
  await fetchPuzzle();
  await fetchMapping();
  setPuzzle();
  setConnections();
}

function destroyBoard(){
  $("#center").empty();
  $("#left").empty();
  $("#right").empty();
}

function resetBoard(){

  var sq = $(".block");
  var arr = JSON.parse(sessionStorage.oddList);

  for (s in sq){ // s is index of jquery object (string)
    let idx = arr.indexOf(parseInt(sq.eq(s).attr("id")));
    if (idx > -1) sq.eq(s).css("background-color", bgname[Math.floor(idx/2)]);
    else sq.eq(s).css("background-color", "white");
    sq.eq(s).css("border-color", "darkslategrey");
    if (parseInt(s)+1 == sq.length) break;
  }

  stopTiming();
  $('#timer').html("00:00:00.000");
  sessionStorage.startGame = "false";
}

function createWhiteBoard(){

  for (let i = 0; i < size; i++)
  {
    for (let j = 0; j < size**2; j++)
    {
      let el = $("<div></div>");
      el.attr("id", i*size**2+j);
      el.attr("class", "block");
      el.css("width", (180/size).toString()+'px');
      el.css("height", (180/size).toString()+'px');
      el.css("border-width", (8-size).toString()+'px');
      el.css("border-radius", (10-2*(size-3)).toString()+'px');
      el.on("click", colorBlock);

      switch(i) {
        case 0: $("#right").append(el); break;
        case 1: $("#center").append(el); break;
        case 2: $("#left").append(el); break;
      }
    }
  }
}

async function fetchPuzzle(){

  let s = size.toString()
  if (sessionStorage.getItem('puzzle' + s) === null)
  {    
    try 
    {
      let data = await fetch('data/' + s + '.json').
      then(res => { return res.json() });
      sessionStorage.setItem('pnum' + s, Object.keys(data).length)
      sessionStorage.setItem('puzzle' + s, JSON.stringify(data));
    } 
    catch(e) { console.log(e) }
  }
}

async function fetchMapping(){

  let s = size.toString()
  if (sessionStorage.getItem('map' + s) === null)
  {    
    try
    {
      let data = await fetch('data/map-' + s + '.json').
      then(res => { return res.text() });
      sessionStorage.setItem('map' + s, data);
    }
    catch(e) { console.log(e) }
  }
}

function setPuzzle(){

  let s = size.toString(),
      index = Math.floor(Math.random()*parseInt(sessionStorage.getItem('pnum' + s))),
      puzzle = JSON.parse(sessionStorage.getItem('puzzle' + s))[index],
      mapping = JSON.parse(sessionStorage.getItem('map' + s)),
      pairs = puzzle.pairs,
      list = new Array(0);

  sessionStorage.cnum = puzzle.color;

  for (let i = 0; i < pairs.length; i++){
    let id = mapping[ pairs[i][0]*size*2+pairs[i][1] ];
    $('#' + String(id)).css('background-color', bgname[Math.floor(i/2)]);
    $('#' + String(id)).addClass('odd');
    list.push(id);
  }

  sessionStorage.oddList = JSON.stringify(list);
}

function setConnections(){

  if (sessionStorage.getItem('conn' + size.toString()) === null)
  {
    var bpp = size * size, // blocks per plane
        blks = 3 * bpp; // total num of blocks

    adj = new Array(blks); // adjacency matrix
    for (let i = 0; i < blks; i++)
      adj[i] = [];

    for (let i = 0; i < blks; i++)
    {
      for (let j = 0; j < blks; j++)
      {
        if(i < j)
        {
          // section Y
          if ((i%bpp < size) && ((j%bpp) == (i%bpp*size) && Math.floor(i/bpp+1) == Math.floor(j/bpp)))
          {
            adj[i].push(j);
            adj[j].push(i);
          }
          else if ((i%bpp%size == 0) && ((i%bpp) == (j%bpp*size) && Math.floor(i/bpp+2) == Math.floor(j/bpp)))
          {
            adj[i].push(j);
            adj[j].push(i);
          }

          // general...
          if (j == (i+1) && Math.floor(j/size) == Math.floor(i/size))
          {
            adj[i].push(j);
            adj[j].push(i);
          }
          else if (j == (i+size) && Math.floor(j/bpp) == Math.floor(i/bpp))
          {
            adj[i].push(j);
            adj[j].push(i);
          }
        }
      }
    }
    sessionStorage.setItem('conn' + size.toString(), JSON.stringify(adj))
  }
}

function colorBlock(){

  if (sessionStorage.startGame != 'true')
  {
    sessionStorage.startGame = true;
    sessionStorage.endGame = false;
    startTiming();
  }

  if (sessionStorage.endGame == 'true') return

  let clkColor = $(this).css('background-color'),
    curColor = sessionStorage.cursorColor,
    list = JSON.parse(sessionStorage.oddList);

  console.log(parseInt(this.id))
  if (list.indexOf(parseInt(this.id)) > -1) // click on odds
  {
    if (curColor == clkColor)
      curColor = 'white';
    else curColor = clkColor;
  }
  else if (curColor != clkColor && curColor != 'white') // click on non-odds
  {
    $(this).css('background-color', curColor);
    //moves.push([parseInt(this.id), ticks]); // (pos, time)
    //steps++;

    if (checkClear()){
      //$("#pass").append($("<p>Complete!</p>"));
      //$("#pass").fadeIn(1000);
      sessionStorage.endGame = true;
      stopTiming();
    }
  }
  sessionStorage.cursorColor = curColor;
}

function checkClear(){

  let eList = JSON.parse(sessionStorage.getItem('conn' + size.toString())),
      oList = JSON.parse(sessionStorage.oddList),
      cnum  = parseInt(sessionStorage.cnum),
      block = 3*size**2,
      finish = true;

  if (sessionStorage.sList === undefined) { // shortest paths
    var sPath = new Array(cnum);
    for (let i=0; i<cnum; i++) sPath[i] = []
  } else sPath = JSON.parse(sessionStorage.sList)

  for (let i=0; i<cnum; i++)
  {
    let que = new Array(0), // queue: shift/push
        vis = new Array(block),
        pre = new Array(block),
        dis = new Array(block),
        flag = false;

    vis.fill(false);
    que.push(oList[i*2]);
    dis[oList[i*2]] = 0;
    vis[oList[i*2]] = true;

    while (sPath[i].length) // reset marker
      $('#' + sPath[i].pop().toString()).css('border-color', 'darkslategrey');

    while(que.length > 0 && !flag)
    {
      let tmp = que.shift();
      for (let j = 0; j < eList[tmp].length; j++)
      {
        let next = eList[tmp][j],
            color = $('#' + next.toString()).css('background-color');

        if (!vis[next] && color == nameToRGB(bgname[i]))
        {
          vis[next] = true;
          dis[next] = dis[tmp] + 1;
          pre[next] = tmp;
          que.push(next);

          if (next == oList[i*2+1]) // reach another endpoint
          {
            //ans++;
            while(next != oList[i*2])
            {
              sPath[i].push(next);
              next = pre[next];
              //ans++;
            }
            sPath[i].push(next);
            flag = true;
            break;
          }
        }
      }
    }

    if (flag){ // the color is connected
      for (let k = 0; k < sPath[i].length; k++)
        $('#' + sPath[i][k].toString()).css('border-color', 'gray');
    }
    else finish = false;
  }
  sessionStorage.sList = JSON.stringify(sPath);
  return finish;
}

function nameToRGB(name) {
  // Create fake div
  let fakeDiv = document.createElement("div");
  fakeDiv.style.color = name;
  document.body.appendChild(fakeDiv);

  // Get color of div
  let cs = window.getComputedStyle(fakeDiv),
      pv = cs.getPropertyValue("color");

  // Remove div after obtaining desired color value
  document.body.removeChild(fakeDiv);

  return pv;
}

