/*
[Author]: John Bostater

[Creation Date]: 5/18/26

[Description]:
	Simple Extension for saving directories and opening them quickly via the Explorer's Side-Panel UI Interface.
*/


//[Global]
//---------------------------------
  const vscode = require("vscode");
  var allDirectoryNames = ["hello", "testing"];
//---------------------------------


//[System Function]
//-----------------------------------------------------------------------------------------------------------------------------

  //[Runs upon Activation of the Extension]
    function activate(context) {


      //Register the Extension to the Side-Panel tree
        vscode.window.registerTreeDataProvider( "folderExpo", new DirectoryChanger() );


      //[Action Event Handling - All Items]
        context.subscriptions.push(


          //[Dark Mode Command Registry]
            vscode.commands.registerCommand("saveCurrentDirectory", (item) => {

              //Save the currently opened directory to the array/dropdown (update the dropdown menu!!)
                //Code here...   //Check for duplicate directories!!


              //Also save the folder to a .json that we will load & pull directories from everytime we load the extension/the dropdown item list loads!!
                //Code here..


              //Inform the user of their choice
                vscode.window.showInformationMessage(`Random [Dark] Theme Applied! [${newName}]`);

            }),

    
          //[Dropdown - Select Folder]
            vscode.commands.registerCommand("quickSelect.leafClicked", (item) => {

              //Apply the new folder for the user's current window
                //Code here..


              //Inform the user of their choice
                vscode.window.showInformationMessage(`Switching to Folder: [${item}]`);
            }),

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
                    //Code here


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
                  command: "quickSelect.leafClicked",
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