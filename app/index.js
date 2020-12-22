import document from "document";

let shoppingList = document.getElementById("shopping-list");

let todoistItems = fetchShoppinList();

shoppingList.delegate = {
  getTileInfo: (idx) => {
    return {
      type: "item-pool",
      index: idx,
      name: todoistItems[idx],
      active: true,
    };
  },
  configureTile: (tile, item) => {
    if (item.type === "item-pool") {
      let textEl = tile.getElementById("text");
      textEl.text = item.name;
      let touch = tile.getElementById("touchable");
      touch.onclick = (e) => {
        textEl.style.fill = item.active ? "red" : "grey";
        item.active = !item.active;
      };
    }
  },
};

shoppingList.length = todoistItems.length;

function fetchShoppinList() {
  return [
    "Apfelkuchen",
    "Schokopudding",
    "Ben&Jerry's",
    "Rosenkohl",
    "Knödel",
    "Rindswurst",
  ];
}
