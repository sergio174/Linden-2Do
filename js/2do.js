$(function() {


	/*MODEL DEFINITION*/
	var Task = Backbone.Model.extend({
		defaults: function() {
			return {
				id: "",
				name:"",
				important: "0",
				done:"0",
				cat:""
			}
		},
		validate: function(attributes) {
			
			if ( attributes.name.length < 2 ) 
			{
				console.log( "Not saved because: too short!");
				return "Task name must be a word";
			}
		},
		sync : function(method, model) {
			
			//Verify if it needs to be saved
			var needToAddCat = true;
			var catID = 0;
			for(i in cats)
			{
				if( cats[i].name == model.attributes.cat)
				{
					needToAddCat = false;
					catID = cats[i].id;
					break;
				}
			}
			if(needToAddCat)
			{
				catID = addCat(model.attributes.cat);
			}

			model.set('cat' , catID );
			localStorage[LSprefix+model.attributes.id] = JSON.stringify(model.attributes);
			todos.push(model.attributes.id);
			
			// Save the 2Do
			localStorage[LSkey] = JSON.stringify(todos);
			
			
			addTableRow(model, true);
		}
		
	});



	function addTask(data) {
		

		try {
			var task = new Task({
					id: new Date().getTime(),
					name: $("#newTaskName").val(),
					important: $("#newTaskImportant").hasClass('btn-primary') ? 1 : 0,
					cat:$("#newTaskCat").val() ? $("#newTaskCat").val() : catDefaultName

			}).save();
			
			

		} catch (error) {
			console.log("Not saved because: "+error.message);
		}

	};

	function updateTaskField(id, k, value)
	{
			
		var inLS = JSON.parse( localStorage[ LSprefix + id ] );

		var add  = JSON.parse('{ "'+k+'" : "'+value+'" }');

		// console.log(add);

		localStorage[ LSprefix + id ] = JSON.stringify($.extend(inLS, add) );
	}

	function deleteTask(id)
	{
		for(var i in todos){
		    if(todos[i]==id){
		        todos.splice(i,1);
		        break;
		        }
		}

		localStorage.removeItem(LSprefix+id);
		localStorage[LSkey] = JSON.stringify(todos);
		
		$('#task-'+id).fadeOut({complete:function(){$(this).remove()}});

	}

	function addCat(catname)
	{
		var newCatID = new Date().getTime();
		cats.push ( {id: newCatID,
					name: catname
					});
		addCatRow( cats[cats.length-1] );
		localStorage[LSprefix+"cats"] = JSON.stringify(cats);

		return newCatID;
	}

	function deleteCat(e)
	{
		var idDel = $(this).attr('id').split('-')[1];
		console.log("delete: "+idDel);
		
		var optionTemplate = $("[data-template-name='cat-option']").html();
		var catSelect = $('select#catDelAssign');
		catSelect.html("");
		for(i in cats)
		{
			if(cats[i].id != idDel)
			catSelect.append( Mustache.render(optionTemplate, cats[i] ) );
			else
			{
			$("#catDelName").text(cats[i].name);
			$("#catDelID").val(cats[i].id);
			}
		}



		$('#deleteCatModal').modal();
	}

	function confirmDeleteCat(e)
	{
		var idDel = $("#catDelID").val() ;
		var catDelAssign = $("#catDelAssign").val();

		
		for(var i in cats){
		    if( cats[i].id == idDel )
		    {
		        cats.splice(i,1);
		        break;
		    }
		}
		
		localStorage[LSprefix + "cats"] = JSON.stringify( cats );

		for(i in todos)
		{
			
			var elemData = JSON.parse(localStorage[LSprefix+todos[i]]);

			//Update related Tasks
			if(elemData.cat == idDel)
			{
				console.log("Reasign "+elemData.name + " to "+catDelAssign);
				updateTaskField(elemData.id, 'cat', catDelAssign);
				
				$("tr#task-"+elemData.id).removeClass('cat-'+idDel).addClass('cat-'+catDelAssign);

				$("tr#task-"+elemData.id+ " td.taskCat").html( getCatBy('id' , catDelAssign).name );
			}

		}

		// Remove Category Link
		$('a#cat-' + idDel).parent().remove();

		$('a#cat-' + catDelAssign).trigger('click');


	}


	function addCatRow(data)
	{
		var lista = $('ul#catList')
		var template = $("[data-template-name='cat-row']").html();
				
		lista.append( Mustache.render ( template  , data ) );

		$('a#cat-'+data.id).on('click', showCatTasks);
		$('i#delCat-'+data.id).on('click', deleteCat);
	}


	function showCatTasks(e)
	{
		e.preventDefault();

		var catToShow = "cat-" + $(this).attr('id').split('-')[1];

		$("ul#catList li").removeClass('catSelected');

		$(this).parent().addClass('catSelected');

		if(catToShow != 'cat-0')
			$('table#taskList tr').each(function( index ) {
			  	if( !$(this).hasClass(catToShow))
			  		$(this).hide();
			  	else
			  		$(this).show();

			  	// console.log( index + ": " + $(this).text() );
			});
		else
			$('table#taskList tr').show();
	}







	function addTableRow(model, blink)
	{
		var tabla = $('table#taskList')
		var template = $("[data-template-name='task-row']").html();
		
		var cat = getCatBy("id",model.attributes.cat);
		
		model.attributes.catname = cat.name;

		tabla.prepend( Mustache.render(template,model.toJSON() ) );

		$('tr#task-' + model.attributes.id + ' input[type="checkbox"]').prop('checked', model.attributes.done =="1" ? true : false);

		$('tr#task-' + model.attributes.id + ' input[type="checkbox"]').on('click', function(e){
			
			updateTaskField( model.attributes.id, 'done', $(this).prop('checked') ? 1 : 0 );
			$(this).parent().parent().removeClass('done-0 done-1').addClass($(this).prop('checked') ? 'done-1' : 'done-0');
		});

		$('tr#task-' + model.attributes.id + ' a.taskDelete').on('click', function(e){
			e.preventDefault();
			deleteTask(this.id.split('-')[1]);
		});

		$('tr#task-' + model.attributes.id + ' i.icon-star').on('click', function(e){
			
			$(this).toggleClass('icon-star-0');
			
			updateTaskField( model.attributes.id, 'important', $(this).hasClass('icon-star-0') ? 0 : 1 );

		});

		
		


		$("#newTaskName").val('').focus();
		$("#newTaskImportant").removeClass('btn-primary');
		$("#newTaskCat").val('');

		if(blink)
		{
			$('tr#task-' + model.attributes.id +' td').addClass('inserted');

			setTimeout(function (){$('tr#task-' + model.attributes.id +' td').removeClass('inserted') },100);
			;
	    }

		
	}
	
	function getCatBy(key,value)
	{
		for(i in cats)
		{
			if( cats[i][key] == value )
				return cats[i];
		}


	}





	/*FORM CONTROLS*/
	//Autocomplete for category
	$('#newTaskCat').typeahead({source:getCategories});

	function getCategories(){
		var catsVec = [];
		for(i in cats)
		{
			catsVec.push(cats[i].name);
		}
		return catsVec;
	}

	// Important toggle
	$('#newTaskImportant').on('click', function(e){
		e.preventDefault();
		$(this).toggleClass('btn-primary');
		$(this).find('i').toggleClass('icon-white');
	});

	// Simple introkey
	$('#newTaskName').keydown(function (e){
	    if(e.keyCode == 13){
	        addTask();
	    }
	});



	function showByStatus(e)
	{
		e.preventDefault();

		var newStatus = $(this).attr('id').split("-")[1];
		console.log( newStatus );

		$("ul#statusList li").removeClass('catSelected');

		$(this).parent().addClass('catSelected');

		switch(newStatus)
		{
			case "0":
				$("table#taskList tr.done-0").show();
				$("table#taskList tr.done-1").hide();
			break;
			case "1":
				$("table#taskList tr.done-0").hide();
				$("table#taskList tr.done-1").show();
			break;
			default:
				$("table#taskList tr").show();
			break;
		}
	}




	$('#newTaskCreate').on('click', addTask);

	$('#catDelConfirm').on('click', confirmDeleteCat);


	// Status list
	$('ul#statusList li a').on('click', showByStatus);

	/*VIEW STATE VARS*/

	var currentCat = 0;
	var currentState = 0;
	var LSkey = "linden-todos";
	var LSprefix = LSkey + "_";
	var catDefaultName = "Uncategorized";

	var defaultState = "all";
	var currentState = defaultState;
	

	/*INIT LOCALSTORAGE*/
	var todos;
	var cats = [];
	
	if (localStorage.getItem(LSkey) === null) {
		localStorage[LSkey] = '[]';
	}
	if (localStorage.getItem(LSprefix+"cats") === null) {
		localStorage[LSprefix+"cats"] = '[]';
	}
	
	todos = JSON.parse(localStorage[LSkey]);
	cats = JSON.parse(localStorage[LSprefix+"cats"]);
	
	// Iterate through the saved cats and build the cats menu
	
	addCatRow({id:0, name:'All'});
	
	if(cats.length != 0)
	{
		for(i in cats)
		{
			addCatRow(cats[i]);
		}
		
	}
	else
	{
		// addCatRow({index:0, value:});
		addCat(catDefaultName)
	}

	


	// Iterate the saved data and send to addTableRow to be inserted in the table
	if(todos.length != 0)
	{
		$.each(todos, function(index, value){
			
			var elemData = JSON.parse(localStorage[LSprefix+value]);
			// console.log(LSprefix+value);

			var task = new Task({
					id: elemData.id,
					name: elemData.name,
					important: elemData.important,
					cat: elemData.cat,
					done: elemData.done

			});

			addTableRow(task, false);

		})
	}

	function unique(array)
	{
		return array.filter(function(el,index,arr){
	        return index == arr.indexOf(el);
	    });
	}
	


	// INITIALIZE DEFAULT CATEGORY
	$('ul#catList li a#cat-0').trigger('click');

	$('ul#statusList li a#status-0').trigger('click');


});


