const bgname = ['darksalmon','tomato','orange','palegreen','dodgerblue','mediumseagreen','slateblue','violet'];

$(function(){
    size = 3;
    $block = $('div[class^="block-"]');
    $('.card-header-tabs>li').on("click", switchTab);
    startTimer();
    generateNewPuzzle()
    .then(() => {
        $block.on("click", colorBlock);
        $block.on("click", checkClear);
    })
})

function switchTab(){
    // caller: .nav-item
    $($(this).find('a').attr('href')).show()
        .siblings('.card-body').hide();
    $(this).find('a').addClass('active');
    $(this).siblings().find('.active').removeClass('active');
}

function startTimer(){
    
    sessionStorage.startTime = new Date();
    sessionStorage.timerId = setInterval(function(){
        
        var startObj = Date.parse(sessionStorage.startTime),
            dt = Date.now() - startObj,
            diff = new Date(dt);

        timeStr = diff.toISOString().substr(11, 12);
        durationInSec = diff.getTime()/1000;
        $('#timer').html(timeStr);
        
        if (timeStr == '23:59:59.999') stopTimer();
        
    }, 1); // by milisecond
}

function stopTimer(){
    clearInterval(sessionStorage.timerId);
}

async function generateNewPuzzle(){
    await createWhiteBoard();
    await fetchPuzzle();
    await fetchIdMapping();
    await setPuzzle();
    await setConnections();
}

function createWhiteBoard(){
    
    for (let i = 0; i < size; i++){
        for (let j = 0; j < size**2; j++){

            let el = $("<div></div>");
            el.attr("id", i*size**2+j);
            el.attr("class", "block-" + String(size));

            switch(i){
            case 0: $("#right").append(el); break;
            case 1: $("#center").append(el); break;
            case 2: $("#left").append(el); break;
            }
        }
    }
}

const fetchPuzzle = async () => {
    
    if (sessionStorage.getItem('puzzle_'+String(size)) === null)
    {    
        try {
            let raw = await fetch('data/'+String(size)+'.json'),
                data = await raw.text();
            await sessionStorage.setItem('puzzle_'+String(size), data);
        } catch(e) { console.log(e) }
    }
}

const fetchIdMapping = async () => {
    
    if (sessionStorage.getItem('map_'+String(size)) === null)
    {    
        try {
            let raw = await fetch('data/map-'+String(size)+'.json'),
                data = await raw.text();
            await sessionStorage.setItem('map_'+String(size), data);
        } catch(e) { console.log(e) }
    }
}

function setPuzzle(){
    
    let puzzle = JSON.parse(sessionStorage.getItem('puzzle_'+String(size))),
        map = JSON.parse(sessionStorage.getItem('map_'+String(size)));
    
    let index = Math.floor(Math.random()*Object.keys(puzzle).length),
        pairs = puzzle[index].pairs;
    
    cnum = parseInt(puzzle[index].color);
    
    for (let i = 0; i < pairs.length; i++){
        let id = parseInt(pairs[i][0])*size*2+parseInt(pairs[i][1]);
        $('#' + String(map[id])).css('background-color', bgname[Math.floor(i/2)]);
        $('#' + String(map[id])).addClass('odd');
    }
}

function setConnections(){
    
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
				if ((i%bpp < size) && ((j%bpp) == (i%bpp*size) && Math.floor(i/bpp+1) == Math.floor(j/bpp))){
                    adj[i].push(j);
                    adj[j].push(i);
                }
				else if ((i%bpp%size == 0) && ((i%bpp) == (j%bpp*size) && Math.floor(i/bpp+2) == Math.floor(j/bpp))){
                    adj[i].push(j);
                    adj[j].push(i);
                }

				// general...
				if (j == (i+1) && Math.floor(j/size) == Math.floor(i/size)){
                    adj[i].push(j);
                    adj[j].push(i);
                }
				else if (j == (i+size) && Math.floor(j/bpp) == Math.floor(i/bpp)){
                    adj[i].push(j);
                    adj[j].push(i);
                }
			}
		}
	}
}

function colorBlock(){
    
}

function checkClear(){
    
}

