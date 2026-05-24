/*
[Author]: John Bostater

[Creation Date]: 5/18/26

[Description]:
	Simple Extension for saving directories and opening them quickly via the Explorer's Side-Panel UI Interface.


[TO DO!!]:

  - Find a way to allow user's to input and save paths to other folders (not just save the current folder open

  - Create a button that allows user's to sort their Dropdown by alphabetical order (A -> Z) or (Z -> A)

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

  //Variables
    var currentFolderPath = "";
    var allDirectoryNames = [];
    var directoryMap = new Map();
    var removedDirectories = [];
    var specificRemoveFlag = false;

//-------------------------------------------------------------------------------------------------------------------------------------



//[Allocations]
//-------------------------------------------------------------------------------------------------------------------------------

  //[Gather the current folder path] (if one has opened)

  //List of folders in the user's workspace
    const folders = vscode.workspace.workspaceFolders;

  //[Error Handling] No folder currently open
    if(!folders || folders.length === 0) { vscode.window.showInformationMessage("[Error]: No folder is currently open."); return; }

  //First folder in the current workspace
    currentFolderPath = folders[0].uri.fsPath;


  //Search for the UserDirectoryData.json containing any saved directories the user has

  //[JSON exists, continue to collect data]
    if(fs.existsSync(userJson)){

      //Collect Raw data & then convert to JSON
        const jsonData = JSON.parse(fs.readFileSync(userJson, "utf-8"));
      
      //Parse the JSON and collect all of the Directory names!
        directoryMap = new Map(Object.entries(jsonData));

      //Collect all of the directory names we can from the loaded data
        for(const dirKey of directoryMap.keys()){ allDirectoryNames.push(dirKey) }

    }

  //Else, create the JSON (everytime we save a directory we will use a simplified name (the last dir of the path))
    else{ fs.writeFileSync(userJson, ""); }

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
            vscode.commands.registerCommand("deleteSpecificDirectory", (directoryKeyName) => { specificRemoveFlag = true; }),


          //[Revert the user's Deletion]
            vscode.commands.registerCommand("revertDeletion", () => { SaveDirectory(removedDirectories.pop()); directoryProvider.refresh(); }),

    
          //[Dropdown - Select Folder/Directory]
            vscode.commands.registerCommand("directoryChange", (directoryKeyName) => {

              //[Remove Directory from Dropdown Enabled]
                if(specificRemoveFlag){

                  //Remove the directory using our function
                    RemoveDirectory(directoryKeyName);

                  //Refresh the Dropdown object
                    directoryProvider.refresh();

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
                    new Button("Save Current Folder Open", "Click to Run", "saveCurrentDirectory"),


                  //[Delete Current Directory]
                    new Button("Delete Current Directory", "Click to Run", "deleteCurrentDirectory"),

                  //[Delete Specific Directory]
                    new Button("Delete Specific Directory", "Click to Run", "deleteSpecificDirectory"),

                  //[Revert Deletion]
                    new Button("Revert Deletion", "Click to Run", "revertDeletion"),


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


      //Refresh the tree items
        refresh(){ this._onDidChangeTreeData.fire(); }

      //Return the Leaf [i.e. Directory Names in Quick Select]
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
          //===============================================================================================

            //[Add Directory Button]
              if(buttonName == "Save Current Folder Open"){ this.iconPath = new vscode.ThemeIcon("save"); }

            //[Delete Specific Directory Button]
              else if(buttonName == "Delete Specific Directory"){ this.iconPath = new vscode.ThemeIcon("dash"); }

            //[Delete Current Directory Button]
              else if(buttonName == "Delete Current Directory"){ this.iconPath = new vscode.ThemeIcon("x"); }

            //[Revert Deletion Button]   (works for both types)
              else if(buttonName == "Revert Deletion"){ this.iconPath = new vscode.ThemeIcon("discard"); }

          //===============================================================================================

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