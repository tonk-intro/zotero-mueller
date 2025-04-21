import { REPLServer } from "repl";
import ZoteroToolkit from "zotero-plugin-toolkit";



function msgBox(msg: string): void {
  ztoolkit.getGlobal("alert")(msg);
}


export function muelleriseEntry(): void {


  let selectedItem = ZoteroPane.getSelectedItems()[0];


  let result = modifyAuthor(selectedItem.getField("firstCreator").toString()) + intoMueller(selectedItem.getField("title").toString());


  let s = new Zotero.Search();
  s.addCondition("anyField", "contains", result);
  s.search().then((v) => {
    let found = false;

    for (let i = 0; i < v.length; i++)
    {
      let potentialConflict = Zotero.Items.get(v[i])
      if (potentialConflict !== selectedItem &&
        ztoolkit.ExtraField.getExtraField(potentialConflict, "Citation Key") == result)
      {

        found = true;
        ConflictResolutionDialog(potentialConflict, selectedItem, result);

      }
      else
        continue
    }

    if (!found)
    {
      ztoolkit.ExtraField.setExtraField(selectedItem, "Citation Key", result);
      selectedItem.saveTx();
    }

  });

}

const WordsToSkip = [  'and', 'or', 'the', 'a', ',', '—'];
const WordsInLowerCase = [ 'against', 'on', 'of', 'about', 'in', 'at', 'as', 'to', 'for' ];


function intoMueller(title: string): string {

  // TODO: remove quotation marks and other special characters
  // Also something needs to be done about several authors, and maybe '-' in the names

    title = title.split(":")[0].replace("-", " ")
    const array = title.split(' ')

    let mTitle = ''
    let mLength = 0;

    for (let current of array)
    {

      if (mLength == 4)
        break;

      if (WordsToSkip.includes(current.toLowerCase()))
        continue;


      current = current.replace("\'", "").replace("\"", "").replace("\“", "");

      if (mLength > 0 && WordsInLowerCase.includes(current.toLowerCase()))
        mTitle += current[0].toLowerCase()
      else
        mTitle += current[0].toUpperCase()

      mLength++;

    }


    return mTitle
  }


  function modifyAuthor(author: string): string {

    author = author.split(" and ")[0].split(" et al.")[0];


    // Ü, ü     \u00dc, \u00fc
// Ä, ä     \u00c4, \u00e4
// Ö, ö     \u00d6, \u00f6
// ß        \u00df



   // const umlaute: Record<string, string> = {'ß':'ss','ö':'oe','ä':'ae','ü':'ue','Ö':'Oe','Ä':'Ae','Ü':'Ue'};

    const umlaute: Record<string, string> = {'\u00df':'ss','\u00f6':'oe','\u00e4':'ae','\u00fc':'ue','\u00d6':'Oe','\u00c4':'Ae','\u00dc':'Ue'};


    author = author.replace(/[\u00dc\u00fc\u00c4\u00e4\u00d6\u00f6\u00df]/g, m => umlaute[m])

    author = author.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")

    author = author.replace("-", "").replace(" ", "");

    author = author.replace(author[0], author[0].toUpperCase());

    return author;


  }


   async function ConflictResolutionDialog(first: Zotero.Item, second: Zotero.Item, proposed: string) {

    const dialogData: { [key: string | number]: any } = {
      inputFirstKey:  ztoolkit.ExtraField.getExtraField(first, "Citation Key"),
      inputSecondKey: proposed,

      checkboxValue: true,
      loadCallback: () => {
        ztoolkit.log(dialogData, "Dialog Opened!");
      },
      unloadCallback: () => {
        ztoolkit.log(dialogData, "Dialog closed!");
      },
    };

    const dialogHelper = new ztoolkit.Dialog(10, 2)
      .addCell(0, 0, {
        tag: "h1",
        properties: { innerHTML: "Conflicting Citation Keys!" },
      })
      .addCell(1, 0, {
        tag: "h2",
        properties: { innerHTML: "Previous Entry" },
      })
      .addCell(2, 0, {
        tag: "p",
        properties: {
          innerHTML:
            first.getField("firstCreator").toString() + ': ' + first.getDisplayTitle()
        },
        styles: {
          width: "200px",
        },
      })
      .addCell(
        3,
        0,
        {
          tag: "input",
          namespace: "html",
          id: "dialog-input",
          attributes: {
            "data-bind": "inputFirstKey",
            "data-prop": "value",
            type: "text",
          },
        },
        false
      )

      .addCell(4, 0, {
        tag: "h2",
        properties: { innerHTML: "New Entry" },
      })

      .addCell(5, 0, {
        tag: "p",
        properties: {
          innerHTML:
          second.getField("firstCreator").toString() + ': ' + second.getDisplayTitle()
        },
        styles: {
          width: "200px",
        },
      })
      .addCell(
        6,
        0,
        {
          tag: "input",
          namespace: "html",
          id: "dialog-input",
          attributes: {
            "data-bind": "inputSecondKey",
            "data-prop": "value",
            type: "text",
          },
        },
        false
      )


      .addButton("Confirm", "confirm")
      .addButton("Cancel", "cancel")
      .setDialogData(dialogData)
      .open("Dialog Example");
    await dialogData.unloadLock.promise;


    if (dialogData._lastButtonId == "confirm")
    {
      ztoolkit.ExtraField.setExtraField(first, "Citation Key", dialogData.inputFirstKey);
      ztoolkit.ExtraField.setExtraField(second, "Citation Key", dialogData.inputSecondKey);

      first.saveTx();
      second.saveTx();

    }


    // ztoolkit.getGlobal("alert")(
    //   `Close dialog with First: ${dialogData.inputFirstKey} and Second: ${dialogData.inputSecondKey}.`

    //  // `Close dialog with ${dialogData._lastButtonId}.\nCheckbox: ${dialogData.checkboxValue}\nInput: ${dialogData.inputValue}.`
    // );
    ztoolkit.log(dialogData);
  }

