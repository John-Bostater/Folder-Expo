/*
[Author]: John Bostater

[Creation Date]: 5/18/26

[Description]:
	Simple Extension for saving directories and opening them quickly via the Explorer's Side-Panel UI Interface.
*/



/*[TO DO!!]

Save the json items as

  Key : FolderName (last dir in full path name)  -  Value : Full path name to the driectory

*/





//[Global]
//---------------------------------

  //Reqs
    const vscode = require("vscode");
    const fs = require("fs");

  //Variables
    var currentFolder = "";
//---------------------------------



//[Allocations]
//-------------------------------------------------------------------------------------------------------------------------------

  //Search for a .json containing any saved directories the user has
    const userJson = path.join("C:", "Users", userName, "AppData", "Roaming", "Code", "User", "globalStorage", "UserProjectData.json");

  //


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
                currentFolder = folders[0].uri.fsPath;

              //Save the directory to the extension


              //Also save the folder to a .json that we will load & pull directories from everytime we load the extension/the dropdown item list loads!!
                //Code here..


              //Refresh the provider to display the new folder saved!
                directoryProvider.refresh();


              //Inform the user of their choice
                vscode.window.showInformationMessage(`Saving Directory to List: [${currentFolder}]`);

            }),

    
          //[Dropdown - Select Folder/Directory]
            vscode.commands.registerCommand("directoryChange", (item) => {

              //Apply the new folder for the user's current window
                //Code here..


              //Inform the user of their choice
                vscode.window.showInformationMessage(`Switching to Folder: [${item}]`);
            }),


          //[Dropdown - Refresh for new Folders being added to the list]
            vscode.commands.registerCommand("quickSelect.leafClicked0", (item) => {

              
              //Update the folder/directory list items for the extension object
                allDirectoryNames.push(currentFolder);


//[DEBUG!!]
//  Name is working
console.log(directoryProvider.allDirectoryNames.pop());                

//Left off with an issue refreshing this command everytime I hit the "saveCurrentDirectory"
//    i think i can just do an action call from there too???



              //Refresh the extension object / Explorer - UI Panel
                directoryProvider.refresh();

            })

        )
    }

//-----------------------------------------------------------------------------------------------------------------------------


//[Author-Defined Functions]
//-----------------------------------------------------------------------------------------------------------------------------

  //Add a new 



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


                  //Button to Submit the directory the user has written to the input box (do an existence check first!)
                    //Code here


                  //Button to Add the currently opened directory to the list user has written to the input box
                    //Code here



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
              if(buttonName == "Save Directory"){ this.iconPath = new vscode.ThemeIcon("plus"); }

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
                  title: "Leaf clicked",
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