import { modifyAuthor, intoMueller } from "../logic/muellerise";
// import { getString } from "../utils/locale";

export function registerMuelleriser() {
  ztoolkit.Menu.register("item", {
    tag: "menuitem",
    id: "zotero-muelleriser-action",
    label: "Jetzt Müllerisieren!", // getString("muelleriser-action-label"),
    commandListener: () => muelleriseEntry(),
  });
}

function getTextColor() {
  // TODO: Figure out whether we're in day or night mode and set text color based on that!

  return "white";
}

function muelleriseEntry(): void {
  const ZoteroPane = ztoolkit.getGlobal("ZoteroPane");

  const selectedItem = ZoteroPane.getSelectedItems()[0];

  const result =
    modifyAuthor(selectedItem.getField("firstCreator").toString()) +
    intoMueller(selectedItem.getField("title").toString());

  const s = new Zotero.Search();
  s.addCondition("anyField", "contains", result);
  s.search().then((v) => {
    let found = false;

    for (let i = 0; i < v.length; i++) {
      const potentialConflict = Zotero.Items.get(v[i]);
      if (
        potentialConflict !== selectedItem &&
        ztoolkit.ExtraField.getExtraField(potentialConflict, "Citation Key") ==
          result
      ) {
        found = true;
        ConflictResolutionDialog(potentialConflict, selectedItem, result);
      } else continue;
    }

    if (!found) {
      ztoolkit.ExtraField.setExtraField(selectedItem, "Citation Key", result);
      selectedItem.saveTx();
    }
  });
}

async function ConflictResolutionDialog(
  first: Zotero.Item,
  second: Zotero.Item,
  proposed: string,
) {
  const dialogData: { [key: string | number]: any } = {
    inputFirstKey: ztoolkit.ExtraField.getExtraField(first, "Citation Key"),
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
      properties: {
        innerHTML: "Conflicting Citation Keys!",
      },
      styles: { color: getTextColor() },
    })
    .addCell(1, 0, {
      tag: "h2",
      properties: { innerHTML: "Previous Entry" },
      styles: { color: getTextColor() },
    })
    .addCell(2, 0, {
      tag: "p",
      properties: {
        innerHTML:
          first.getField("firstCreator").toString() +
          ": " +
          first.getDisplayTitle(),
      },
      styles: {
        width: "200px",
        color: getTextColor(),
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
      false,
    )

    .addCell(4, 0, {
      tag: "h2",
      properties: { innerHTML: "New Entry" },
      styles: { color: getTextColor() },
    })

    .addCell(5, 0, {
      tag: "p",
      properties: {
        innerHTML:
          second.getField("firstCreator").toString() +
          ": " +
          second.getDisplayTitle(),
      },
      styles: {
        width: "200px",
        color: getTextColor(),
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
      false,
    )

    .addButton("Confirm", "confirm")
    .addButton("Cancel", "cancel")
    .setDialogData(dialogData)
    .open("Dialog Example");

  await dialogData.unloadLock.promise;

  if (dialogData._lastButtonId == "confirm") {
    ztoolkit.ExtraField.setExtraField(
      first,
      "Citation Key",
      dialogData.inputFirstKey,
    );
    ztoolkit.ExtraField.setExtraField(
      second,
      "Citation Key",
      dialogData.inputSecondKey,
    );

    first.saveTx();
    second.saveTx();
  }

  ztoolkit.log(dialogData);
}
