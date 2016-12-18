var game_type = "";
var game_size = -1;
var game_array = [];

//untuk uji coba
// window.onload = function(){
// 	game_type = 'sudoku';
// 	game_size = 3;
// 	initGame(game_type, game_size);
// }

function back(){
	game_type = "";
	game_size = -1;
	game_array = [];
	var board = document.getElementsByClassName("board")[0];
	board.innerHTML = "";
	document.getElementsByClassName('select-wrapper')[0].style.display = 'block';
	document.getElementsByClassName('wrapper')[0].style.display = 'none';
}

function howShow(){
	var element = document.getElementById('howtopopup');
	element.className += ' show';
}

function howClose(){
	var element = document.getElementById('howtopopup');
	element.className = element.className.replace(' show', '');
}

function selectGame(){
	var type = document.forms["select-game"]["game-type"].value;
	var size = document.forms["select-game"]["size"].value;

	if (type != "semi" && type != "sudoku") {
		showMessage("Mohon pilih tipe sudoku yang ingin dimainkan!", "error");
		return false;
	}

	if (size < 2) {
		showMessage("Pilih ukuran papan minimal 2", "error");
		return false;
	}

	if (type == 'semi' && size > 16) {
		showMessage("Pilih ukuran papan maksimal 16 untuk Semi Sudoku", "error");
		return false;
	}

	if (type == 'sudoku' && size > 5) {
		showMessage("Pilih ukuran papan maksimal 5 untuk Sudoku", "error");
		return false;
	}

	var type_text = type == "semi" ? "Semi Sudoku" : "Sudoku";
	var size_text = size + " x " + size;
	var text = "Masuk ke dalam permainan " + type_text + " dengan ukuran " + size_text;
	showMessage(text, "success");

	game_type = type;
	game_size = parseInt(size);

	initGame();
	return false;
}

function showMessage(message, type){
	var element = document.getElementsByClassName("message")[0];
	element.innerHTML = message;
	element.className = "message active message-" + type;
	setTimeout(function(){
		element.className = "message";
	}, 2000);
}

function cellClick(){
	if(this.className.indexOf('hint') > -1) return;
	var cols = document.getElementsByClassName("selected");
	for (var i = cols.length - 1; i >= 0; i--) {
		cols[i].className = cols[i].className.replace(" selected", "");
	}
	this.className += " selected";
}

function initGame(){
	var board = document.getElementsByClassName("board")[0];
	var size = getSize();

	for(var i = 0; i < size; i++){
		var row = document.createElement('div');
		row.className = 'row';
		var row_arr = [];
		for(var j = 0; j < size; j++){
			var col = document.createElement('div');
			col.className = 'col';
			col.id = getId(i, j);

			if(game_type == 'sudoku'){
				if( ((i+1) / game_size % 1) === 0 && i != size-1)
					col.className += ' bottom_bolder';

				if( ((j+1) / game_size % 1) === 0 && j != size-1)
					col.className += ' right_bolder';
			}

			var div = document.createElement('div');
			div.style.fontSize = (Math.floor(85 / size) - 1) + 'vmin';

			col.appendChild(div);
			col.onclick = cellClick;
			row.appendChild(col);
			row_arr.push(0);
		}
		game_array.push(row_arr);
		board.appendChild(row);
	}

	var total_hint = 0;
	if(game_type == 'semi')
		total_hint = size;
	else{
		if(size == 4) total_hint = 6;
		else if(size == 9) total_hint = 25;
		else if(size == 16) total_hint = 60;
		else if(size == 25) total_hint = 120;
		else total_hint = (size * 2) - 1;
	}
	generateHint(total_hint);

	document.getElementsByClassName('select-wrapper')[0].style.display = 'none';
	document.getElementsByClassName('wrapper')[0].style.display = 'block';
}

function generateHint(total_hint){
	do{
		for(var r = 0; r < game_array.length; r++){
			for(var c = 0; c < game_array[r].length; c++){
				game_array[r][c] = 0;
			}
		}

		var size = getSize();
		for(var i = 0; i < total_hint; i++){
			var val = (i % size) + 1;
			while(true){
				var row = Math.floor((Math.random() * size));
				var col = Math.floor((Math.random() * size));

				if(game_array[row][col] != 0)
					continue;

				game_array[row][col] = val;

				var isNotValid = !isValid(row, col);
				if(game_type == 'sudoku'){
					isNotValid = isNotValid || isFullHorizontal(row, col) ||
					isFullVertical(row, col) || 
					isFullBox(row, col);
				}

				if( isNotValid ){
					game_array[row][col] = 0;
				} else {
					break;
				}
			}
		}
	}while(!isSolveable());

	for(var row = 0; row < game_array.length; row++){
		for(var col = 0; col < game_array[row].length; col++){
			if(game_array[row][col] == 0) continue;
			var id = getId(row,col);
			var element = document.getElementById(id);
			var elementVal = element.childNodes[0];
			elementVal.innerHTML = "" + game_array[row][col];
			element.className += ' hint';
		}
	}
}

function isSolveable(){
	var pencilmark = [];
	var size = getSize();

	for(var i = 0; i < game_array.length; i++){
		var row = [];
		for(var j = 0; j < game_array[i].length; j++){
			if(game_array[i][j] == 0){
				var col = [];
				for(var k = 1; k <= size; k++)
					col.push(k);
				row.push(col);
			} else {
				row.push(-1);
			}
		}
		pencilmark.push(row);
	}

	eliminate(pencilmark);
	propagation(pencilmark);
	for(var row = 0; row < pencilmark.length; row++){
		for(var col = 0; col < pencilmark[row].length; col++){
			if(pencilmark[row][col] == -1) continue;
			if(pencilmark[row][col].length == 0) return false;
		}
	}
	return true;
}

function eliminate(pencilmark){
	for(var row = 0; row < pencilmark.length; row++){
		for(var col = 0; col < pencilmark[row].length; col++){
			if(pencilmark[row][col] == -1) continue;
			for (var mark = pencilmark[row][col].length - 1; mark >= 0; mark--) {
				var val = pencilmark[row][col][mark];
				game_array[row][col] = val;
				if( !isValid(row,col) ){
					pencilmark[row][col].splice(mark, 1);
				}
				game_array[row][col] = 0;
			}
		}
	}
}

function propagation(pencilmark){
	for(var row = 0; row < pencilmark.length; row++){
		for(var col = 0; col < pencilmark[row].length; col++){
			if(pencilmark[row][col] == -1) continue;
			if(pencilmark[row][col].length != 1) continue;
			var val = pencilmark[row][col][0];
			removeFromPeers(pencilmark, row, col, val);
		}
	}
}

function inputNumber(value){
	var selected = document.getElementsByClassName('selected')[0];
	if(selected.className.indexOf('hint') > -1) return;

	var selectedVal = selected.childNodes[0];
	var id = selected.id;

	var size = getSize();
	size = parseInt(size);

	var row = Math.floor(id / size);
	var col = id - (size * row);

	selectedVal.innerHTML += "" + value;
	game_array[row][col] = parseInt(selectedVal.innerHTML);

	if (parseInt(selectedVal.innerHTML) > size) {
		selectedVal.innerHTML = "" + value;
		game_array[row][col] = parseInt(selectedVal.innerHTML);

		if (parseInt(selectedVal.innerHTML) > size) {
			selectedVal.innerHTML = "";
			game_array[row][col] = 0;
		}
	}
	if (selectedVal.innerHTML == 0) {
		selectedVal.innerHTML = "";
		game_array[row][col] = 0;
	}
}

function clearNumber(){
	var selected = document.getElementsByClassName('selected')[0];
	var selectedVal = selected.childNodes[0];
	selectedVal.innerHTML = "";

	var id = selected.id;

	var size = getSize();
	size = parseInt(size);

	var row = Math.floor(id / size);
	var col = id - (size * row);
	game_array[row][col] = 0;
}

window.onkeypress = function(e){
	if(game_type != ""){
		var value = String.fromCharCode(e.keyCode);
		value = parseInt(value, this.id);

		if(e.keyCode >= 48 && e.keyCode <= 57){
			inputNumber(value);
		} else {
			switch(e.keyCode)
			{
			  case 8:
			  case 32:
			  case 46:
			  	clearNumber();
			  	break;
			}
		}

		if( isWin() ){
			showMessage('Menang!', 'success');
		}
	}
}

function isWin(){
	var isWin = true;
	for(var row = 0; row < game_array.length; row++){
		for(var col = 0; col < game_array[row].length; col++){
			var id = getId(row, col);
			var element = document.getElementById(id);
			if(element.className.indexOf('hint') > -1) continue;

			if( !checkHorizontal(row, col) || 
				!checkVertical(row, col) )
				isWin = false;

			if(game_type == 'sudoku'){
				if( !checkBox(row, col) )
					isWin = false;
			}
		}
	}
	return isWin;
}

function isValid(row, col){
	var result = checkHorizontal(row, col) && checkVertical(row, col);
	if(game_type == 'sudoku'){
		result = result && checkBox(row, col);
	}
	return result;
}

function removeFromPeers(pencilmark, row, col, val){
	var pencilmark = removeVertical(pencilmark, row, col, val);
	pencilmark = removeHorizontal(pencilmark, row, col, val);
	if(game_type == 'sudoku'){
		pencilmark = removeBox(pencilmark, row, col, val);
	}
	return pencilmark;
}

function removeVertical(pencilmark, row, col, val){
	var size = getSize();
	for(var r = 0; r < size; r++){
		if(pencilmark[r][col] == -1) continue;
		if(r == row) continue;
		var idx = pencilmark[r][col].indexOf(val);
		if(idx == -1) continue;
		pencilmark[r][col].splice(idx, 1);
	}
	return pencilmark;
}

function removeHorizontal(pencilmark, row, col, val){
	var size = getSize();
	for(var c = 0; c < size; c++){
		if(pencilmark[row][c] == -1) continue;
		if(c == col) continue;
		var idx = pencilmark[row][c].indexOf(val);
		if(idx == -1) continue;
		pencilmark[row][c].splice(idx, 1);
	}
	return pencilmark;
}

function removeBox(pencilmark, row, col, val){
	var rem_row = row % game_size;
	var rem_col = col % game_size;

	var finish_r = row - rem_row + game_size;
	var finish_c = col - rem_col + game_size;

	for(var r = row - rem_row; r < finish_r; r++){
		for(var c = col - rem_col; c < finish_c; c++){
			if(pencilmark[r][c] == -1) continue;
			if(row == r && col == c) continue;
			var idx = pencilmark[r][c].indexOf(val);
			if(idx == -1) continue;
			pencilmark[r][c].splice(idx, 1);
		}
	}
	return pencilmark;
}

function isFullVertical(row, col){
	var size = getSize();
	for(var r = 0; r < size; r++){
		if(game_array[r][col] == 0) return false;
	}
	return true;
}

function isFullHorizontal(row, col){
	var size = getSize();
	for(var c = 0; c < size; c++){
		if(game_array[row][c] == 0) return false;
	}
	return true;
}

function isFullBox(row, col){
	var rem_row = row % game_size;
	var rem_col = col % game_size;

	var finish_r = row - rem_row + game_size;
	var finish_c = col - rem_col + game_size;

	for(var r = row - rem_row; r < finish_r; r++){
		for(var c = col - rem_col; c < finish_c; c++){
			if(game_array[r][c] == 0) return false;
		}
	}
	return true;
}


function checkVertical(row,col){
	var val = game_array[row][col];
	if(val == 0) return false;

	var size = getSize();
	var id = getId(row,col);

	for(var r = 0; r < game_array.length; r++){
		if(r == row) continue;
		var val2 = game_array[r][col];
		if(val2 == 0) continue;

		if(val == val2){
			var d = document.getElementById(id);
			if(d.className.indexOf('wrong_vertical') < 0)
				d.className += ' wrong_vertical';
			return false;
		}
	}
	
	var d = document.getElementById(id);
	d.className = d.className.replace(" wrong_vertical", "");
	return true;
}

function checkHorizontal(row,col){
	var val = game_array[row][col];
	if(val == 0) return false;

	var size = getSize();
	var id = getId(row,col);

	for(var c = 0; c < game_array.length; c++){
		if(c == col) continue;
		var val2 = game_array[row][c];
		if(val2 == 0) continue;

		if(val == val2){
			var d = document.getElementById(id);
			if(d.className.indexOf('wrong_horizontal') < 0)
				d.className += ' wrong_horizontal';
			return false;
		}
	}

	var d = document.getElementById(id);
	d.className = d.className.replace(" wrong_horizontal", "");
	return true;
}

function checkBox(row, col){
	var val = game_array[row][col];
	if(val == 0) return false;


	var rem_row = row % game_size;
	var rem_col = col % game_size;

	var finish_r = row - rem_row + game_size;
	var finish_c = col - rem_col + game_size;

	var size = getSize();
	var id = getId(row,col);

	for(var r = row - rem_row; r < finish_r; r++){
		for(var c = col - rem_col; c < finish_c; c++){
			if(row == r && col == c) continue;
			var val2 = game_array[r][c];
			if(val2 == 0) continue;

			if(val == val2){
				var d = document.getElementById(id);
				if(d.className.indexOf('wrong_box') < 0)
					d.className += ' wrong_box';
				return false;
			}
		}
	}

	var d = document.getElementById(id);
	d.className = d.className.replace(" wrong_box", "");
	return true;
}

function getSize(){
	return game_type == "semi" ? game_size : game_size * game_size;
}

function getId(row, col){
	return row * getSize() + col;
}