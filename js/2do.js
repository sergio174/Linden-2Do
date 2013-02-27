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
			
			
			addTableRow(model);
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
		
		$('#task-'+id).fadeOut();

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

	function addCatRow(data)
	{
		// console.log('CatData:' + JSON.stringify(data) );
		var lista = $('ul#catList')
		var template = $("[data-template-name='cat-row']").html();

		lista.append( Mustache.render ( template  , data ) );
	}








	function addTableRow(model)
	{
		var tabla = $('table#taskList')
		var template = $("[data-template-name='task-row']").html();
		// console.log(JSON.stringify( model.attributes));

		// model.attributes.important = model.attributes.important ? "star" : "";

		tabla.append( Mustache.render(template,model.toJSON() ) );

		$('tr#task-' + model.attributes.id + ' input[type="checkbox"]').prop('checked', model.attributes.done =="1" ? true : false);

		$('tr#task-' + model.attributes.id + ' input[type="checkbox"]').on('click', function(e){
			
			updateTaskField( model.attributes.id, 'done', $(this).prop('checked') ? 1 : 0 );
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


	$('#newTaskCreate').on('click', addTask);




	/*VIEW STATE VARS*/

	var currentCat = 0;
	var currentState = 0;
	var LSkey = "linden-todos";
	var LSprefix = LSkey + "_";
	var catDefaultName = "Uncategorized";
	

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

			addTableRow(task);

		})
	}

	function unique(array)
	{
		return array.filter(function(el,index,arr){
	        return index == arr.indexOf(el);
	    });
	}
	// alert(todos);

	// alert(todos);




});


