/*
[Author]: John Bostater

[Creation Date]: 5/18/26

[Description]:
	Simple Extension for saving directories and opening them quickly via the Explorer's Side-Panel UI Interface.


[TO DO!!]:

  - Find a way to allow user's to input and save paths to other folders (not just save the current folder open)

  - Automatically organize the user's data alphabetically everytime a new directory is added?

  - Create a new JSON called,  [UserExpoSettings.json]  
      which will hold a flag on whether or not the user would like all new directories added to be in alphabetical order

  - Make a json so if the user closes VS Code, they can still bring back any previously deleted path(s) via the revert button)
      We will have to load the data from that json upon every load of the program to the "removedDirectorys" array
        You should store up to 5 or 10 reverts within this JSON if you do pursue this idea
*/



//[Global]
//-------------------------------------------------------------------------------------------------------------------------------------

  //Reqs
    const vscode = require("vscode");
    const fs = require("fs");
    const os = require("os");
    const path = require("path");

  //Constants
    const userName = os.userInfo().username;
    const userJson = path.join("C:", "Users", userName, "AppData", "Roaming", "Code", "User", "globalStorage", "UserDirectoryData.json");
    const userSettingsJson = path.join("C:", "Users", userName, "AppData", "Roaming", "Code", "User", "globalStorage", "UserExpoSettings.json");

  //Variables
    var currentFolderPath = "";
    var allDirectoryNames = [];
    var directoryMap = new Map();
    var removedDirectories = [];
    var specificRemoveFlag = false;
    var organizedDataFlag = false;

//-------------------------------------------------------------------------------------------------------------------------------------



//[Allocations]
//-------------------------------------------------------------------------------------------------------------------------------


  //Search for the UserDirectoryData.json containing any saved directories the user has
    if(fs.existsSync(userJson)){ LoadUserData(); }

  //Else, create the JSON (everytime we save a directory we will use a simplified name (the last dir of the path))
    else{ fs.writeFileSync(userJson, ""); }


  //[Gather the current folder path] (if one has opened)

  //List of folders in the user's workspace
    const folders = vscode.workspace.workspaceFolders;

  //[Collect the current folder path (if one is open)]
    if(folders) { if(folders.length != 0) currentFolderPath = folders[0].uri.fsPath; console.log(`Current folder Name: ${path.basename(currentFolderPath)}`); }



//[TO DO!!]
//   [Second Idea]:  Have this JSON also hold references to the directories the user has deleted
//        (in-case user would like to revert after chaning their directory)

  //[User Settings Data JSON Exists]
    if(fs.existsSync(userSettingsJson)){

      //Load the flag on whether the user would like to have saved folders automatically be organized (A-Z)
        //Code here...

    }

  //Else, create the JSON for the user's saved preferenecs
    else{ fs.writeFileSync(userSettingsJson, ""); }


//-------------------------------------------------------------------------------------------------------------------------------



//[System Function]
//-----------------------------------------------------------------------------------------------------------------------------

  //[Runs upon Activation of the Extension]
    function activate(context) {

      //Reference to the provider of Changing our directory/folder
        const directoryProvider = new DirectoryChanger();

      //Register the Extension to the Side-Panel tree
        vscode.window.registerTreeDataProvider("folderExpo", directoryProvider );


      //[Action Event Handling - All Items]
        context.subscriptions.push(


          //[Save Folder - Command Registry]
            vscode.commands.registerCommand("saveCurrentDirectory", () => {

              //Return if the directory already exists


              //Save the current directory open
                const folders = vscode.workspace.workspaceFolders;

              //[Error Handling] No folder currently open
                if(!folders || folders.length === 0) { vscode.window.showInformationMessage("[Error]: No folder is currently open."); return; }

              //First folder in the current workspace
                currentFolderPath = folders[0].uri.fsPath;

              //Function for creating a folder entry in the Dropdown
                SaveDirectory(currentFolderPath);


              //Refresh the Directory Provider
                directoryProvider.refresh();

            }),


          //[Remove the Current Directory from the Dropdown]
          //    Call upon the function, pass our object as a parameter too 
            vscode.commands.registerCommand("deleteCurrentDirectory", () => { RemoveDirectory(path.basename(currentFolderPath)); directoryProvider.refresh(); }),


          //[Remove a specific file from the directory]
            vscode.commands.registerCommand("deleteSpecificDirectory", () => { specificRemoveFlag = true; }),


          //[Sort Dropdown & JSON Alphabetically]  
          //   (do this by default everytime a player enters a new directory? or check if the user has a flag to permanentaly have this)
            vscode.commands.registerCommand("alphabeticOrganizeDirectory", () => { OrganizeJSON(); directoryProvider.refresh(); }),


          //[Revert the user's Deletion]
            vscode.commands.registerCommand("revertDeletion", () => { specificRemoveFlag = false; SaveDirectory(removedDirectories.pop()); directoryProvider.refresh(); }),

    
          //[Dropdown - Select Folder/Directory]
            vscode.commands.registerCommand("directoryChange", (directoryKeyName) => {

              //[Remove Directory from Dropdown Enabled]
                if(specificRemoveFlag){

                  //Remove the directory using our function
                    RemoveDirectory(directoryKeyName);

                  //Refresh the Dropdown object
                    directoryProvider.refresh();

                  //Turn the flag off
                    specificRemoveFlag = false;

                  //Do not continue
                    return;

                }


              //Use the map to find the folder path connected to the directory's name
                directoryPath = directoryMap.get(directoryKeyName);

              //Execute a command to change the user's window
                vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(directoryPath), { forceNewWindow: false } );

              //Inform the user of their choice
                vscode.window.showInformationMessage(`Switching to Folder: [${directoryKeyName}]`);
            })

        )
    }

//-----------------------------------------------------------------------------------------------------------------------------



//[Author-Defined Functions]
//-----------------------------------------------------------------------------------------------------------------------------

  //[Save the passed]
    function SaveDirectory(passedFolderPath){

      //[Empty Revert Check]
        if(passedFolderPath == null){ return; }


      //[Save data to: UserDirectoryData.json ]
      //  Ensure file exists & that we are NOT writing a duplicate
        if(fs.existsSync(userJson) && !directoryMap.has(path.basename(passedFolderPath))){

          //Update the folder/directory list items for the extension object
            allDirectoryNames.push(path.basename(passedFolderPath));


          //Create a new entry in the map and write the data to a json
            directoryMap.set(path.basename(passedFolderPath), passedFolderPath);

          //Convert Map -> Object
            const pathObject = Object.fromEntries(directoryMap);

          //Write the JSON file data
            fs.writeFileSync(userJson, JSON.stringify(pathObject, null, 4));


          //Inform the user of their choice
            vscode.window.showInformationMessage(`Saving Directory to List: [${passedFolderPath}]`);

          //Return
            return;
        }

      //Else, the user is trying to save the same dir twice!, inform them
        vscode.window.showWarningMessage(`Current Folder is already Saved: [${passedFolderPath}]`);
    }


  //[Delete the passed name from the list of folders]
  //    nameToRemove is the basename of the path we want to delete
    function RemoveDirectory(nameToRemove){

//[TO DO!!]
// Make a json so if the user closes VS Code, they can still bring back deleted path(s) via revert)
//   We will have to load the data from that json upon every load of the program to the "removedDirectorys" array


      //[Remove the reference from: UserDirectoryData.json]
      //  Ensure file exists & that we are NOT writing a duplicate
        if(fs.existsSync(userJson) && directoryMap.has(nameToRemove)){

          //Save a reference to the file path we are to delete (in case we need to bring it back)
            if(directoryMap.has(nameToRemove)){ removedDirectories.push(directoryMap.get(nameToRemove)); }


          //[Go to the map, delete the name]
            directoryMap.delete(nameToRemove);

          //[Remove from the array too]
            allDirectoryNames.splice(allDirectoryNames.indexOf(nameToRemove), 1);

          //Convert Map -> Object
            const pathObject = Object.fromEntries(directoryMap);

          //Write the JSON file data
            fs.writeFileSync(userJson, JSON.stringify(pathObject, null, 4));

          //Inform the user' the directory has been removed
            vscode.window.showInformationMessage(`Removing Folder from the Dropdown menu: [${nameToRemove}]`);
        }

      //Else, do nothing

    }


  //[Organize the Dropdown Menu]
    function OrganizeJSON(){

      //Organize the JSON Data & refresh the local data from the new JSON


      //Collect the JSON data to an array
        const jsonData = JSON.parse(fs.readFileSync(userJson, "utf-8"));

      //Map Data we need to organize
        var unorganizedDataMap = new Map(Object.entries(jsonData));


      //Organized Data via JavaScript's internal Map Object Method  { .sort()  &  locale.Compare() }
        var organizedDataMap = new Map([...unorganizedDataMap].sort((a, b) => a[0].localeCompare(b[0])));

      //Convert Organized Map -> Object
        const pathObject = Object.fromEntries(organizedDataMap);

      //Write the JSON file data
        fs.writeFileSync(userJson, JSON.stringify(pathObject, null, 4));

      //Empty the names to make way for the organized set
        allDirectoryNames = [];


      //Load the data the user has created
        LoadUserData();

    }


  //[Load the user's Data from the JSON]
    function LoadUserData(){
      
      //Collect Raw data & then convert to JSON
        const jsonData = JSON.parse(fs.readFileSync(userJson, "utf-8"));
      
      //Parse the JSON and collect all of the Directory names!
        directoryMap = new Map(Object.entries(jsonData));

      //Collect all of the directory names we can from the loaded data
        for(const dirKey of directoryMap.keys()){ allDirectoryNames.push(dirKey) }

    }


//-----------------------------------------------------------------------------------------------------------------------------



//[Classes/Objects]
//--------------------------------------------------------------------------------------------

  //[Theme Changer]
    class DirectoryChanger {

      //Constructor
        constructor(){
        
          //Action-Event Handlers for the press of the buttons
            this._onDidChangeTreeData = new vscode.EventEmitter();
            this.onDidChangeTreeData = this._onDidChangeTreeData.event;

          //Dropdown Items for the Quick Theme Select
            this.dropdowns = [{

              //[Quick Select Dropdown]
                label: "Folder Expo",
                children: allDirectoryNames
            }];
        
        }


      //[Displayed Objects/Classes]
        getChildren(element) {

          //Capture the [Buttons] && [DropDown]
            if(!element){

              //List of "Buttons" for the extension
                return [

                  //[Save the Current Folder]
                    new Button("Save Current Folder Open", "", "saveCurrentDirectory"),


                  //[Delete Current Directory]
                    new Button("Delete Current Folder", "", "deleteCurrentDirectory"),

                  //[Delete Specific Folder]
                    new Button("Delete Specific Folder", "", "deleteSpecificDirectory"),


                  //[Sort the Dropdown Alphabetically]
                    new Button("Organize Folders (A-Z)", "", "alphabeticOrganizeDirectory"),


                  //[Revert Deletion]
                    new Button("Revert Deletion", "", "revertDeletion"),


                  //[Select Folder Drop Down List]
                    ...this.dropdowns.map( d => new DropdownItem(d.label, d.children) )
                ];
           
            }


          //Capture Expanded Element's Child items
            if(element.children) {

              //Return Leafs connected to [Theme Names] that we will be using
                return element.children.map( child => new DirectoryName(child) );
            }

          //Else, return empty array
            return [];

        }


      //Refresh the Dropdown List Items
        refresh(){ this._onDidChangeTreeData.fire(); this.dropdowns[0].children = allDirectoryNames; }

      //Return the Leaf [i.e. Folder Names in Quick Select]
        getTreeItem(element){ return element; }

    }


  //[Button]
    class Button extends vscode.TreeItem {


      //Constructor
        constructor(buttonName, buttonDescription, commandId) {

          //Calls parent
            super(buttonName, vscode.TreeItemCollapsibleState.None);


          //Button Behaviour
            this.command = {
                command: commandId,
                title: buttonName,
                arguments: [this]
            };

          //Button Description
            this.description = buttonDescription;


          //Set up the icon for the button based on which type it is
          //======================================================================================================

            //[Add Folder Button]
              if(buttonName == "Save Current Folder Open"){ this.iconPath = new vscode.ThemeIcon("save"); }

            //[Delete Specific Folder Button]
              else if(buttonName == "Delete Specific Folder"){ this.iconPath = new vscode.ThemeIcon("dash"); }

            //[Delete Current Folder Button]
              else if(buttonName == "Delete Current Folder"){ this.iconPath = new vscode.ThemeIcon("x"); }

            //[Organize Folders Button]
              else if(buttonName == "Organize Folders (A-Z)"){ this.iconPath = new vscode.ThemeIcon("book"); }

            //[Revert Deletion Button]   (works for both types)
              else if(buttonName == "Revert Deletion"){ this.iconPath = new vscode.ThemeIcon("discard"); }

          //======================================================================================================

        }
    }


  //[Dropdown Menu]
    class DropdownItem extends vscode.TreeItem {

      //Construct the UI Element
        constructor(label, children) {

          //Set Super to call constructor & set child Items
            super(label, vscode.TreeItemCollapsibleState.Collapsed);
            this.children = children;
        }
    }


  //[Leaf Item] for the Dropdown's {Folder Names}
    class DirectoryName extends vscode.TreeItem {

      //Construct the Leaf [Theme Names] UI Element
        constructor(label) {

          //Set Super to call constructor
            super(label,vscode.TreeItemCollapsibleState.None);


          //[Action-Event Call for the Leaf Item]
          //=============================================

            //Click action attached here
              this.command = {
                  command: "directoryChange",
                  title: "Directory Changed",
                  arguments: [label]
              };

          //=============================================

        }
    }

//--------------------------------------------------------------------------------------------


//[Export functions]
//------------------------------
  module.exports = { activate };
//------------------------------