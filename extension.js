/*
[Author]: John Bostater

[Creation Date]: 5/18/26

[Description]:
	Simple Extension for saving directories and opening them quickly via the Explorer's Side-Panel UI Interface.
*/



/*[TO DO!!]

Save the json items as

  Key : FolderName (last dir in full path name)  -  Value : Full path name to the directory

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
    var directoryMap = new Map();

  //Variables
    var currentFolderPath = "";
    var allDirectoryNames = [];
//-------------------------------------------------------------------------------------------------------------------------------------



//[Allocations]
//-------------------------------------------------------------------------------------------------------------------------------

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
            vscode.commands.registerCommand("saveCurrentDirectory", (item) => {

              //List of folders in the user's workspace
                const folders = vscode.workspace.workspaceFolders;

              //[Error Handling] No folder currently open
                if(!folders || folders.length === 0) { vscode.window.showInformationMessage("[Error]: No folder is currently open."); return; }


              //First folder in the current workspace
                currentFolderPath = folders[0].uri.fsPath;

              //Update the folder/directory list items for the extension object
                allDirectoryNames.push(path.basename(currentFolderPath));


              //[Save data to: UserDirectoryData.json ]
              //  Ensure file exists & that we are NOT writing a duplicate
                if(fs.existsSync(userJson) && !directoryMap.has(path.basename(currentFolderPath))){

                  //Create a new entry in the map and write the data to a json
                    directoryMap.set(path.basename(currentFolderPath), currentFolderPath);

                  //Convert Map -> Object
                    const pathObject = Object.fromEntries(directoryMap);

                  //Write the JSON file data
                    fs.writeFileSync(userJson, JSON.stringify(pathObject, null, 4));

                  //Refresh the provider to display the new folder saved!
                    directoryProvider.refresh();

                  //Inform the user of their choice
                    vscode.window.showInformationMessage(`Saving Directory to List: [${currentFolderPath}]`);

                  //Return
                    return;
                }

              //Else, the user is trying to save the same dir twice!, inform them
                vscode.window.showWarningMessage(`Current Folder is already Saved: [${currentFolderPath}]`);

            }),

    
          //[Dropdown - Select Folder/Directory]
            vscode.commands.registerCommand("directoryChange", (directoryKeyName) => {

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

                  //Input Box for user's to manually enter a folder via it's directory
                    new Button("Save Current Folder Open", "Click to Run", "saveCurrentDirectory"),

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


          //Button Behavour
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