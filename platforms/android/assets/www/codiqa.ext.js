(function () {
    "use strict";

    document.addEventListener( 'deviceready', onDeviceReady.bind( this ), false );
    
    function onDeviceReady() {
		navigator.splashscreen.hide();
		
        document.addEventListener( 'pause', onPause.bind( this ), false );
        document.addEventListener( 'resume', onResume.bind( this ), false );

		$("#btnName").on("click", function(){getName()});
		function getName() {
			navigator.notification.prompt("Enter name:", gotNameOk, "Customize", ["Save", "Cancel"]);
			
			function gotNameOk(data) {
				localStorage.userName = data.input1;
			
				if(data.buttonIndex === 2) {
				} else if((localStorage.userName === undefined) || (localStorage.userName === "null") || (localStorage.userName === "")) { 
					switch(localStorage.userName) {
						case "":
							alert("Please enter a valid name!");;
							break;
						case "null":
							console.log("No name saved yet");
							break;
						case undefined:
							console.log("No name saved yet");
							break;
						default:
							console.log(localStorage.userName);
							break;
					}
				} else {
					$(".welcomeMsg").html(", " + localStorage.userName.replace(/[^a-zA-Z0-9\s]/g,"") + "!");
				}
				
				return localStorage.userName;
			} // END getNameOK()
			
			
		} // END getName()

		function showName() {
			if((localStorage.userName === undefined) || (localStorage.userName === "null") || (localStorage.userName === "")) { 
				console.log("No name saved yet");
			} else {
				$(".welcomeMsg").html(", " + localStorage.userName.replace(/[^a-zA-Z0-9\s]/g,"") + "!");
			}
		} // END showName()

		showName();
		
		$(".btnURL").on("click", function(){loadURL($(this))});
		function loadURL(theObj) {
			cordova.InAppBrowser.open(theObj.data("url"), "_blank", "location=yes");
		}

			// ***** PouchDB Code STARTS ***** //
		
		var db;	// Create an Object for our DB

		function initDB() {				// Function to initialize DB
			db = new PouchDB("mysdce");	// Instantiate new PouchDB Object
			return db;					// Return the result of the DB
		} // END initDB()
		
		initDB();		// Call the initilizaitoin function
				
		var $elBtnSave   = $("#btnSave"),		// Create jQuery-based variables
			$elBtnReset  = $("#btnReset"),   	// of various on-screen elements
			$elDivShow   = $("#divShow"),		// Commonly use $ for jQ vars
			$elFormClass = $("#formClass"),
			$elBtnShow   = $("#btnShow");
			
		$elBtnSave.on("click", fnSaveClass);	// Event Handler Save button click
		$elBtnShow.on("click", fnShowClasses);
		$("#divShow").on("click", "#btnDelete", fnDeleteClass); // First target an element that exists (#divShow), then the dynamic element (#btnDelete)
		$("#divShow").on("click", ".btnPencil", function(){fnUpdateClassPrep($(this).parent())});  // Run an AnonFunction, passing data of the WHOLE ROW, of the particular pencil clicked on
		$("#divEdit").on("click", "#btnUpdate", fnUpdateClass);
		$("#divShow").on("click", "#btnNuke", fnNuke);
		
		function fnSaveClass() {		// Function to save class data 
			var $valCRN   = $("#fieldCRN").val(),   // Variables storing what
				$valClass = $("#fieldName").val(), // what the user typed into
				$valInst  = $("#fieldInst").val();  // the Inputs in the Form
				
			$valCRN = $valCRN.toUpperCase(); // Force to Uppercase any Letter input
			
			var aClass = { 
					"_id"   : $valCRN,
					"cName" : $valClass,
					"cInst" : $valInst
				}; // A JSON-formatted Object with all our data
						
			db.put(aClass, function(error, result){ // .put() adds(or updates) an item to the DB
				if(result) {						// Args are the data, and Callbacks
					fnClearForm();
					fnShowClasses();
					
					$("#popSaved").popup();
					$("#popSaved").popup("open", {"positionTo" : "window", "transition" : "slideUp"});
				} else {
					switch(error.status) { // In case of ERROR, pick the right response
						case 409:		// CRN already exists
							$("#popErrorDupe").popup();
							$("#popErrorDupe").popup("open", {"positionTo" : "window", "transition" : "slideUp"});
							break;
						case 412:		// CRN is empty
							$("#popErrorCRN").popup();
							$("#popErrorCRN").popup("open", {"positionTo" : "window", "transition" : "slideUp"});
							break;
						default:		// Unknown error. Check Console
							alert("ERROR - Contact the developer!");
							break;
					}
				}
			});
		} // END fnSaveClass()
		
		function fnClearForm() { // Function to clear the Form Fields
			$elFormClass[0].reset();
		} // END fnClearForm()
		
		function fnShowClasses() { // Function to retrieve the PouchDB data
				// .allDocs to retrieve all Records from DB. Options: include_docs (ALL fields, not just _id); ascending (A-Z)
			db.allDocs({"include_docs" : true, "ascending" : true}, function(error, result){
					if(result) {						// If no error... 
						fnShowClassesTable(result.rows); // Pass the data into function to make it pretty
						} else {						// Else there was an error..
						console.log(error);				// Let the user know
					}
				});
		} // END fnShowClasses()
		
		function fnShowClassesTable(data) { // Construct a Table based on PouchDB Data
			var str = "<p><table id='tableClass'>"; // Build a string of HTML; using a <table>
			str += "<tr><th>CRN</th><th>Class</th><th>Instructor</th><th class='thEmpty'>&nbsp;</th></tr>" // A Row in the Table with Headings
			for(var i = 0; i < data.length; i++) { // For "x" number of times-worth of Data...
													// Build a row at a time of data
				str += "<tr><td>"  + data[i].doc._id + 
					   "</td><td>" + data[i].doc.cName + 
					   "</td><td>" + data[i].doc.cInst + 
					   "</td><td class='btnPencil'>&#x270e;</td></tr>";
			}
			str += "</table></p>";					// End the <table>
			str += "<hr>";							// Horizontal rule
													// Dynamically create an <input> and a <button> to delete classes:
			str += "<input type='text' placeholder='2059H' id='fieldDelete'> <button id='btnDelete'>Delete Class</button>";
			str += "<hr><hr>";
			str += "<hr><hr><hr>";
			str += "<a href='#' class='ui-btn ui-corner-all ui-btn-b ui-shadow' id='btnNuke'>DELETE ALL CLASSES</a>";
			$elDivShow.html(str);		// Render the string as HTML on-screen
			$elDivShow.hide().fadeIn(250);
		} // END fnShowClassesTable()
		
		function fnDeleteClass() { // Function to delete an existing class
			var $theClass = $("#fieldDelete").val();	// Store the class CRN
			$theClass = $theClass.toUpperCase();		// Force letters to Uppercase
			
			db.get($theClass, function(error, result){	// First .get() a class from PouchDB
				if(result) {							// If 'good' Result... [from .get()]
					db.remove(result, function(error, result){	// Next .remove() the class from PouchDB 
						if(result) {					// If 'good' Result... [from .remove()]
							fnShowClasses();			// Then re-draw the Table w/ the latest Data
							$("#popDeleted").popup();
							$("#popDeleted").popup("open", {"positionTo" : "window", "transition" : "slideUp"});
						} else {						// If 'bad' Error... [from .remove()]
							console.log(error);			// Let the user know
							$("#popErrorNull").popup();
							$("#popErrorNull").popup("open", {"positionTo" : "window", "transition" : "slideUp"});
						}
					}); // END db.remove()
				} else {								// If 'bad' Error... [from .get()]
					console.log(error);					// Let the user know something went wrong
					$("#popErrorNull").popup();
					$("#popErrorNull").popup("open", {"positionTo" : "window", "transition" : "slideUp"});
				}
			}); // END db.get()
		} // END fnDeleteClass()
		
		function fnUpdateClassPrep(thisObj) { // Function with an argument of an Object (a Row from the Table)
			console.log(thisObj);
			var $tmpCRN = thisObj.find("td:eq(0)").text(), 	// Extract the 1st Cell's text info from the whole Row (thisObj)
				$tmpClass = thisObj.find("td:eq(1)").text(),// and save to temporary Variables. Again for 2nd Cell
				$tmpInst = thisObj.find("td:eq(2)").text(), // AGain for 3rd cell
				$elDivEdit = $("#divEdit");
			
			var str = "";
			str += "<div id='divTwoCol'>" + 
				"<div id='divLeftCol'><button id='btnUpdate'>Update Class</button></div>" + 
				"<div id='divRightCol'><input type='text' placeholder='1234X' disabled id='fieldUpdateCRN'><input type='text' placeholder='Android I' id='fieldUpdateClass'><input type='text' placeholder='Jones' id='fieldUpdateInst'></div>" + 
				"</div>";
			
			$elDivEdit.html(str);
			$("#h1Update").html("Updating " + $tmpCRN);
			
			$("#fieldUpdateCRN").val($tmpCRN);		// Set the on-screen Inputs to the data from the selected Row
			$("#fieldUpdateClass").val($tmpClass);
			$("#fieldUpdateInst").val($tmpInst);
			
			$("#popClassUpdate").popup();
			$("#popClassUpdate").popup("open", {"positionTo" : "window", "transition" : "turn"});
		} // END fnUpdateClassPrep(thisObj)
		
		function fnUpdateClass() {
			var $updateCRN = $("#fieldUpdateCRN").val(),
				$updateClass = $("#fieldUpdateClass").val(),
				$updateInst = $("#fieldUpdateInst").val();
				
			db.get($updateCRN, function(error, result){
				if(error) {
					alert("Warning! \nThe CRN: " + $updateCRN + " does not exist!");
				} else {
					console.log("yes, updated");
					db.put({
						"_id"   : result._id,
						"cName" : $updateClass,
						"cInst" : $updateInst,
						"_rev"  : result._rev
					}, function(error, result){
						if(error) {
							alert("ERROR");
						} else {
							$("#popClassUpdate").popup("close");
							fnShowClasses();
							$("#popUpdated").popup();
							$("#popUpdated").popup("open", {"positionTo" : "window", "transition" : "slideUp"});
						} // END of .put() function callback's if..else
					}); // END .put() (of new Data)
				} // END of .get() if..else
			}); // END of .get()
		} // END fnUpdateClass()
		
		function fnNuke() {
			switch(confirm("You are about to delete EVERYTHING. \Confirm?")) {
				case true:
					db.destroy(function(error, result){
						if(error) {
							alert("ERROR: Contact the devloper for help.");
						} else {
							initDB();
							$elDivShow.show().fadeOut(2000);
						}
					});
					break;
				case false:
					// To-do: add a jQM Popup later
					console.log("User cancelled");
					break;
				default:
					console.log("third error");
					break;
			}
		} // END fnNuke()
    } // END onDeviceReady()

    function onPause() {
        // TODO: This application has been suspended. Save application state here.
    }

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    }
} )();

/*
	Name: 			Kiran Palla <palla@palla.com>
	Project: 		mySDCE
	Version: 		1.1.2016115
	Date: 			2016-11-15
	Description: 	The unofficial San Diego Continuing Education App
*/